import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

interface EvaluationRequest {
  moduleId: string;
  assessmentAnswers: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    concept: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
  taskSubmission?: {
    submissionData: any;
    completionTime: number; // minutes
  };
  userFeedback?: string;
}

interface EvaluationResult {
  understandingLevel: number; // 1-5
  performanceScore: number; // 0-100
  struggledConcepts: string[];
  strengths: string[];
  nextModuleDifficulty: 'easier' | 'same' | 'harder';
  detailedFeedback: string;
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting kontrolü - IP bazlı
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const rateLimitResult = checkRateLimit(ip, 10, 60000); // 10 request per minute
    if (!rateLimitResult) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Kullanıcı authentication kontrolü - Authorization header'dan token al
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Token'ı supabase ile verify et
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      moduleId, 
      assessmentAnswers, 
      taskSubmission, 
      userFeedback 
    }: EvaluationRequest = await request.json();

    if (!moduleId || !assessmentAnswers) {
      return NextResponse.json({ 
        error: 'Module ID and assessment answers are required' 
      }, { status: 400 });
    }

    // Modül bilgilerini al
    const { data: module, error: moduleError } = await supabaseAdmin
      .from('modules')
      .select(`
        *,
        learning_plans!inner(user_id, learning_goal, target_level)
      `)
      .eq('id', moduleId)
      .eq('learning_plans.user_id', user.id)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // AI ile değerlendirme yap
    const evaluation = await evaluateStudentPerformance(
      module,
      assessmentAnswers,
      taskSubmission,
      userFeedback
    );

    // Sonuçları veritabanına kaydet
    await saveStudentProgress(supabaseAdmin, user.id, moduleId, evaluation, taskSubmission);

    // Modülü tamamlandı olarak işaretle
    await supabaseAdmin
      .from('modules')
      .update({ 
        completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId);

    // Sonraki modülü aç (varsa)
    await unlockNextModule(supabaseAdmin, module.plan_id, module.module_order);

    return NextResponse.json({
      success: true,
      evaluation,
      moduleCompleted: true
    });

  } catch (error) {
    console.error('Error evaluating student progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function evaluateStudentPerformance(
  module: any,
  assessmentAnswers: any[],
  taskSubmission?: any,
  userFeedback?: string
): Promise<EvaluationResult> {
  // Doğru cevap sayısını hesapla
  const correctAnswers = assessmentAnswers.filter(answer => {
    return answer.userAnswer.toLowerCase().trim() === answer.correctAnswer.toLowerCase().trim();
  }).length;

  const totalQuestions = assessmentAnswers.length;
  const basicScore = (correctAnswers / totalQuestions) * 100;

  // Zorluk seviyesine göre ağırlıklı puan hesaplama
  let weightedScore = 0;
  let totalWeight = 0;

  assessmentAnswers.forEach(answer => {
    const weight = answer.difficulty === 'hard' ? 3 : 
                   answer.difficulty === 'medium' ? 2 : 1;
    const isCorrect = answer.userAnswer.toLowerCase().trim() === answer.correctAnswer.toLowerCase().trim();
    
    weightedScore += isCorrect ? weight : 0;
    totalWeight += weight;
  });

  const performanceScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : basicScore;

  // AI ile detaylı analiz
  const prompt = `
Sen bir eğitim uzmanısın. Aşağıdaki bilgilere göre öğrencinin performansını değerlendir:

Modül: ${module.title}
Hedef Seviye: ${module.learning_plans.target_level}

Sınav Sonuçları:
${assessmentAnswers.map(answer => `
- Soru: ${answer.question}
- Öğrenci Cevabı: ${answer.userAnswer}
- Doğru Cevap: ${answer.correctAnswer}
- Konu: ${answer.concept}
- Zorluk: ${answer.difficulty}
- Doğru mu: ${answer.userAnswer.toLowerCase().trim() === answer.correctAnswer.toLowerCase().trim() ? 'Evet' : 'Hayır'}
`).join('')}

Performans Puanı: ${performanceScore.toFixed(1)}/100

${taskSubmission ? `
Pratik Görev:
- Tamamlama Süresi: ${taskSubmission.completionTime} dakika
- Submission Data: ${JSON.stringify(taskSubmission.submissionData, null, 2)}
` : ''}

${userFeedback ? `Öğrenci Geri Bildirimi: ${userFeedback}` : ''}

Lütfen şu formatta değerlendirme yap:
{
  "understandingLevel": 1-5 arası sayı (1: çok kötü, 5: mükemmel),
  "struggledConcepts": ["zorluk yaşanan konu listesi"],
  "strengths": ["güçlü yönler listesi"],
  "nextModuleDifficulty": "easier|same|harder",
  "detailedFeedback": "Öğrenciye yönelik detaylı geri bildirim",
  "recommendations": ["gelişim önerileri listesi"]
}

Kriterlerin:
- 80-100%: Çok iyi (understanding: 4-5, next: same/harder)
- 60-79%: İyi (understanding: 3-4, next: same) 
- 40-59%: Orta (understanding: 2-3, next: easier/same)
- 0-39%: Zayıf (understanding: 1-2, next: easier)

Pratik görev performansını da dikkate al.
Türkçe yanıt ver.
  `;

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
    });
    
    const aiEvaluation = JSON.parse(text);
    
    return {
      understandingLevel: aiEvaluation.understandingLevel,
      performanceScore: Math.round(performanceScore),
      struggledConcepts: aiEvaluation.struggledConcepts || [],
      strengths: aiEvaluation.strengths || [],
      nextModuleDifficulty: aiEvaluation.nextModuleDifficulty || 'same',
      detailedFeedback: aiEvaluation.detailedFeedback || '',
      recommendations: aiEvaluation.recommendations || []
    };
  } catch (e) {
    console.error('AI evaluation JSON parse error:', e);
    
    // Fallback değerlendirme
    const understandingLevel = performanceScore >= 80 ? 5 :
                              performanceScore >= 60 ? 4 :
                              performanceScore >= 40 ? 3 :
                              performanceScore >= 20 ? 2 : 1;

    const nextDifficulty = performanceScore >= 80 ? 'same' :
                          performanceScore >= 60 ? 'same' :
                          performanceScore >= 40 ? 'same' : 'easier';

    return {
      understandingLevel,
      performanceScore: Math.round(performanceScore),
      struggledConcepts: assessmentAnswers
        .filter(a => a.userAnswer.toLowerCase().trim() !== a.correctAnswer.toLowerCase().trim())
        .map(a => a.concept),
      strengths: assessmentAnswers
        .filter(a => a.userAnswer.toLowerCase().trim() === a.correctAnswer.toLowerCase().trim())
        .map(a => a.concept),
      nextModuleDifficulty: nextDifficulty as 'easier' | 'same' | 'harder',
      detailedFeedback: `Performans puanınız: ${Math.round(performanceScore)}/100. ${
        performanceScore >= 70 ? 'Başarılı bir performans gösterdiniz!' : 
        'Daha iyi anlamak için konuları tekrar gözden geçirmenizi öneririz.'
      }`,
      recommendations: performanceScore >= 70 ? 
        ['Devam edin, iyi gidiyorsunuz!'] : 
        ['Eksik kalan konuları tekrar çalışın', 'Pratik yapma sürenizi artırın']
    };
  }
}

async function saveStudentProgress(
  supabase: any, 
  userId: string, 
  moduleId: string, 
  evaluation: EvaluationResult,
  taskSubmission?: any
) {
  // Student progress kaydet
  const { error: progressError } = await supabase
    .from('student_progress')
    .upsert({
      user_id: userId,
      module_id: moduleId,
      understanding_level: evaluation.understandingLevel,
      completion_time: taskSubmission?.completionTime || null,
      struggled_concepts: evaluation.struggledConcepts,
      strengths: evaluation.strengths,
      performance_score: evaluation.performanceScore,
      next_module_difficulty: evaluation.nextModuleDifficulty,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,module_id'
    });

  if (progressError) {
    console.error('Error saving student progress:', progressError);
  }

  // Task submission kaydet (varsa)
  if (taskSubmission) {
    // Önce task'ı bul
    const { data: task } = await supabase
      .from('practical_tasks')
      .select('id')
      .eq('module_id', moduleId)
      .single();

    if (task) {
      const { error: submissionError } = await supabase
        .from('task_submissions')
        .upsert({
          user_id: userId,
          task_id: task.id,
          submission_data: taskSubmission.submissionData,
          completion_status: 'completed',
          ai_feedback: evaluation.detailedFeedback,
          completion_score: evaluation.performanceScore,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,task_id'
        });

      if (submissionError) {
        console.error('Error saving task submission:', submissionError);
      }
    }
  }
}

async function unlockNextModule(supabase: any, planId: string, currentModuleOrder: number) {
  const { error } = await supabase
    .from('modules')
    .update({ 
      unlocked: true,
      updated_at: new Date().toISOString()
    })
    .eq('plan_id', planId)
    .eq('module_order', currentModuleOrder + 1);

  if (error) {
    console.error('Error unlocking next module:', error);
  }
}
