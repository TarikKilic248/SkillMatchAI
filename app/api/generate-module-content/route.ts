import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

interface ModuleContentRequest {
  moduleId: string;
  learningStyle?: string;
  targetLevel?: string;
  previousModulePerformance?: any;
}

interface ModuleContentSection {
  content: string;
  metadata?: any;
  videoSuggestions?: any[];
}

interface VideoSuggestion {
  title: string;
  description: string;
  searchTerms: string[];
  estimatedDuration: string;
}

interface PracticalTask {
  taskTitle: string;
  taskDescription: string;
  instructions: string[];
  completionCriteria: string[];
  interactionQuestions: {
    question: string;
    expectedResponse: string;
    followUpQuestions?: string[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting kontrolü - IP bazlı
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const rateLimitResult = checkRateLimit(ip, 5, 60000); // 5 request per minute
    if (!rateLimitResult) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Kullanıcı authentication kontrolü - Authorization header'dan token al
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Test token kontrolü
      if (token === 'test-token') {
        user = { id: 'test-user-id', email: 'test@example.com' };
      } else {
        // Token'ı supabase ile verify et
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = authUser;
      }
    } else {
      // Test için geçici olarak authentication'ı atla
      user = { id: 'test-user-id', email: 'test@example.com' };
    }

    const { moduleId, learningStyle, targetLevel, previousModulePerformance }: ModuleContentRequest = await request.json();

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    // Gerçek modül bilgilerini veritabanından al
    const { data: module, error: moduleError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      console.error('Module not found:', moduleError);
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    console.log('Found module:', module.title, module.description);

    // Adaptif zorluk seviyesi belirleme
    let adaptiveDifficulty = targetLevel || 'beginner';
    if (previousModulePerformance) {
      switch (previousModulePerformance.nextModuleDifficulty) {
        case 'easier':
          adaptiveDifficulty = targetLevel === 'advanced' ? 'intermediate' : 
                              targetLevel === 'intermediate' ? 'beginner' : 'beginner';
          break;
        case 'harder':
          adaptiveDifficulty = targetLevel === 'beginner' ? 'intermediate' : 
                              targetLevel === 'intermediate' ? 'advanced' : 'advanced';
          break;
        default:
          adaptiveDifficulty = targetLevel || 'beginner';
      }
    }

    // Her section için ayrı ayrı içerik üret
    const sections = await generateAllSections(
      module,
      learningStyle || 'visual',
      adaptiveDifficulty,
      previousModulePerformance
    );

    // Veritabanına kaydet
    try {
      await saveModuleContents(supabaseAdmin, moduleId, sections);
      console.log('Module contents saved successfully');
    } catch (error) {
      console.error('Error saving module contents:', error);
    }

    // JSON content'i parse edip sadece metni al
    const parseContent = (content: any) => {
      if (typeof content === 'string') {
        // ```json ile başlayan response'ları temizle
        let cleanContent = content;
        if (content.includes('```json')) {
          cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
        }
        
        try {
          // JSON string'i parse et
          const parsed = JSON.parse(cleanContent);
          // Eğer content field'ı varsa onu döndür
          if (parsed.content) {
            return parsed.content;
          }
          // Eğer summary field'ı varsa onu döndür (evaluation için)
          if (parsed.summary) {
            return parsed.summary;
          }
          // Eğer taskTitle field'ı varsa JSON string olarak döndür (interactive için)
          if (parsed.taskTitle) {
            return JSON.stringify(parsed);
          }
          // Hiçbiri yoksa raw content'i döndür
          return cleanContent;
        } catch (e) {
          // JSON parse edilemezse temizlenmiş content'i döndür
          return cleanContent;
        }
      }
      return content;
    };

    // Frontend'in beklediği formatı oluştur
    const contentPages = [
      {
        id: 'introduction',
        title: 'Giriş ve Temel Kavramlar',
        type: 'text' as const,
        content: parseContent(sections.introduction?.content) || 'Giriş içeriği yükleniyor...',
        duration: 15,
        videoSuggestions: [],
        difficulty: adaptiveDifficulty,
        originalType: 'introduction'
      },
      {
        id: 'detailed_explanation',
        title: 'Detaylı Açıklamalar ve Örnekler',
        type: 'text' as const,
        content: parseContent(sections.detailed_explanation?.content) || 'Detaylı açıklama yükleniyor...',
        duration: 20,
        videoSuggestions: sections.detailed_explanation?.videoSuggestions || [],
        difficulty: adaptiveDifficulty,
        originalType: 'detailed_explanation'
      },
      {
        id: 'practical_task',
        title: 'Uygulamalı Örnek ve Pratik',
        type: 'interactive' as const,
        content: parseContent(sections.practical_task?.content) || 'Pratik görev yükleniyor...',
        duration: 25,
        videoSuggestions: [],
        difficulty: adaptiveDifficulty,
        originalType: 'practical_task'
      },
      {
        id: 'summary_evaluation',
        title: 'Özet ve Değerlendirme',
        type: 'evaluation' as const,
        content: parseContent(sections.summary_evaluation?.content) || 'Değerlendirme yükleniyor...',
        duration: 10,
        videoSuggestions: [],
        difficulty: adaptiveDifficulty,
        originalType: 'summary_evaluation'
      }
    ];

    return NextResponse.json({
      success: true,
      moduleId,
      contentPages,
      sections,
      adaptiveDifficulty
    });

  } catch (error) {
    console.error('Error generating module content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAllSections(
  module: any,
  learningStyle: string,
  difficulty: string,
  previousPerformance?: any
) {
  // 1. Giriş ve Temel Kavramlar
  const introductionContent = await generateIntroduction(module, learningStyle, difficulty);
  
  // 2. Detaylı Açıklamalar
  const detailedExplanation = await generateDetailedExplanation(module, learningStyle, difficulty);
  
  // 3. Uygulamalı Örnek
  const practicalTask = await generatePracticalTask(module, learningStyle, difficulty);
  
  // 4. Özet ve Değerlendirme
  const summaryEvaluation = await generateSummaryEvaluation(module, learningStyle, difficulty, previousPerformance);

  return {
    introduction: introductionContent,
    detailed_explanation: detailedExplanation,
    practical_task: practicalTask,
    summary_evaluation: summaryEvaluation
  };
}

async function generateIntroduction(module: any, learningStyle: string, difficulty: string): Promise<ModuleContentSection> {
  const prompt = `
Sen bir uzman eğitim içeriği yazarısın. "${module.title}" konusu için Türkçe bir giriş bölümü yaz.

Konu: ${module.title}
Açıklama: ${module.description}
Hedefler: ${module.objectives?.join(', ') || 'Belirtilmemiş'}
Hedef seviye: ${difficulty}
Öğrenme stili: ${learningStyle}

Lütfen aşağıdaki kriterlere uygun bir içerik oluştur:
- En bilgisiz kişinin anlayacağı şekilde başla
- Konunun önemini ve neden öğrenilmesi gerektiğini açıkla
- Temel kavramları tanımla
- Günlük hayattan örnekler ver
- Yaklaşık 300-400 kelime
- Motivasyonel ve ilgi çekici ol
- ${learningStyle} öğrenme stiline uygun anlatım kullan

Çıktı formatı JSON olsun:
{
  "content": "Giriş içeriği burada...",
  "keyPoints": ["Ana nokta 1", "Ana nokta 2", ...],
  "realLifeExamples": ["Örnek 1", "Örnek 2", ...],
  "whyImportant": "Bu konunun neden önemli olduğu..."
}
  `;

  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
      maxTokens: 800,
      temperature: 0.7,
    });
    
    console.log('AI Introduction Response:', text.substring(0, 200));
    
    // JSON parse etmeye çalış
    try {
      const parsed = JSON.parse(text);
      // Eğer content field'ı varsa onu kullan, yoksa tüm response'u content olarak kullan
      if (parsed.content) {
        return parsed;
      } else {
        return {
          content: text,
          metadata: { rawResponse: true }
        };
      }
    } catch (parseError) {
      console.log('JSON parse failed, using raw text');
      return {
        content: text,
        metadata: { rawResponse: true }
      };
    }
  } catch (e) {
    console.error('AI generation error:', e);
    return {
      content: `# ${module.title} - Giriş

Bu modülde ${module.title} konusunu öğreneceğiz. Bu konu ${difficulty} seviyesinde hazırlanmış olup ${learningStyle} öğrenme stiline uygun olarak düzenlenmiştir.

## Ana Hedefler
${module.objectives?.map((obj: string, i: number) => `${i + 1}. ${obj}`).join('\n') || 'Henüz hedef belirlenmemiş'}

Bu konuyu öğrenmek günlük hayatınızda ve profesyonel gelişiminizde önemli faydalar sağlayacaktır.`,
      metadata: { error: 'AI generation failed, using fallback content' }
    };
  }
}

async function generateDetailedExplanation(module: any, learningStyle: string, difficulty: string): Promise<ModuleContentSection> {
  const prompt = `
"${module.title}" konusu için detaylı açıklamalar ve örnekler bölümü yaz.

Konu: ${module.title}
Açıklama: ${module.description}
Hedef seviye: ${difficulty}
Öğrenme stili: ${learningStyle}

Bu bölümde:
- Konunun tarihsel gelişimini anlat
- Farklı yaklaşımları ve metodolojileri açıkla
- En az 3 somut, gerçek hayat örneği ver
- Uzman görüşlerine yer ver
- Güncel gelişmeleri ve trendleri bahset
- ${learningStyle} öğrenme stiline uygun anlatım kullan
- Yaklaşık 400-500 kelime

Çıktı formatı JSON olsun:
{
  "content": "Detaylı açıklama içeriği...",
  "subTopics": [
    {
      "title": "Alt konu başlığı",
      "content": "Alt konu içeriği",
      "examples": ["Örnek 1", "Örnek 2"]
    }
  ],
  "videoSuggestions": [
    {
      "title": "Video başlığı önerisi",
      "description": "Video açıklaması",
      "searchTerms": ["arama", "terimleri"],
      "estimatedDuration": "10-15 dakika"
    }
  ],
  "technicalTerms": [
    {
      "term": "Terim",
      "definition": "Tanımı"
    }
  ]
}
  `;

  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
      maxTokens: 1000,
      temperature: 0.7,
    });
    
    console.log('AI Detailed Explanation Response:', text.substring(0, 200));
    
    // JSON parse etmeye çalış
    try {
      const parsed = JSON.parse(text);
      // Eğer content field'ı varsa onu kullan, yoksa tüm response'u content olarak kullan
      if (parsed.content) {
        return parsed;
      } else {
        return {
          content: text,
          videoSuggestions: [
            `${module.title} - Temel Kavramlar ve Tarihçe`,
            `${module.title} - Pratik Uygulamalar ve Örnekler`,
            `${module.title} - Uzman Röportajları`,
            `${module.title} - Güncel Gelişmeler 2024-2025`
          ],
          metadata: { rawResponse: true }
        };
      }
    } catch (parseError) {
      console.log('JSON parse failed, using raw text');
      return {
        content: text,
        videoSuggestions: [
          `${module.title} - Temel Kavramlar ve Tarihçe`,
          `${module.title} - Pratik Uygulamalar ve Örnekler`,
          `${module.title} - Uzman Röportajları`,
          `${module.title} - Güncel Gelişmeler 2024-2025`
        ],
        metadata: { rawResponse: true }
      };
    }
  } catch (e) {
    console.error('AI generation error:', e);
    return {
      content: `# ${module.title} - Detaylı Açıklama

${module.description}

Bu bölümde konuyu derinlemesine inceleyeceğiz. Zorluk seviyesi: ${difficulty}

## Ana Konular
- Temel kavramlar
- Pratik uygulamalar
- İleri seviye teknikler

## Önerilen Kaynaklar
- Online videolar
- Interaktif örnekler
- Pratik egzersizler`,
      videoSuggestions: [
        `${module.title} - Temel Kavramlar ve Tarihçe`,
        `${module.title} - Pratik Uygulamalar ve Örnekler`,
        `${module.title} - Uzman Röportajları`,
        `${module.title} - Güncel Gelişmeler 2024-2025`
      ],
      metadata: { error: 'AI generation failed, using fallback content' }
    };
  }
}

async function generatePracticalTask(module: any, learningStyle: string, difficulty: string): Promise<ModuleContentSection> {
  const prompt = `
"${module.title}" konusu için uygulamalı bir görev tasarla.

Konu: ${module.title}
Açıklama: ${module.description}
Hedef seviye: ${difficulty}

Bir JSON formatında aşağıdakileri içeren uygulamalı görev oluştur:
- taskTitle: Göreve uygun bir başlık
- taskDescription: Görevin amacını açıklayan 2-3 cümle
- instructions: 5-6 adımlık detaylı talimatlar dizisi
- completionCriteria: Başarı için 4-5 kriter
- interactionQuestions: 2 adet soru (her birinde question, expectedResponse, followUpQuestions)
- estimatedTime: Tahmini süre
- tools: Gerekli araçlar listesi
- helpHints: Yardımcı ipuçları

Görevi ${difficulty} seviyesine uygun, gerçekçi ve öğretici yap.
  `;

  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
      maxTokens: 800,
      temperature: 0.7,
    });
    
    console.log('AI Practical Task Response:', text.substring(0, 200));
    
    // JSON parse etmeye çalış
    try {
      const parsed = JSON.parse(text);
      // Eğer content field'ı varsa onu kullan, yoksa tüm response'u content olarak kullan
      if (parsed.content) {
        return parsed;
      } else {
        return {
          content: text,
          metadata: { rawResponse: true }
        };
      }
    } catch (parseError) {
      console.log('JSON parse failed, using raw text');
      return {
        content: text,
        metadata: { rawResponse: true }
      };
    }
  } catch (e) {
    console.error('AI generation error:', e);
    return {
      content: JSON.stringify({
        taskTitle: `${module.title} - Pratik Uygulama`,
        taskDescription: `Bu görevde ${module.title} konusundaki bilgilerinizi pratik olarak uygulayacaksınız.`,
        instructions: [
          "Modül içeriğini tekrar gözden geçirin",
          "Verilen örnekleri inceleyin",
          "Kendi çözümünüzü geliştirin",
          "Sonuçları değerlendirin"
        ],
        completionCriteria: [
          "Tüm adımları tamamlamış olmak",
          "Sonuçları doğru yorumlamak",
          "Öğrenilen kavramları açıklayabilmek"
        ],
        interactionQuestions: [
          {
            question: "Bu görevi tamamlamak için hangi adımları takip ettiniz?",
            expectedResponse: "Adım adım açıklama",
            followUpQuestions: ["Hangi adımda zorlandınız?", "Başka nasıl bir yaklaşım deneyebilirdiniz?"]
          }
        ],
        estimatedTime: "30-45 dakika",
        tools: ["Kalem", "Kağıt", "Bilgisayar"],
        helpHints: ["Küçük adımlarla başlayın", "Hata yapmaktan korkmayın"]
      }),
      metadata: { error: 'AI generation failed, using fallback content' }
    };
  }
}

async function generateSummaryEvaluation(module: any, learningStyle: string, difficulty: string, previousPerformance?: any): Promise<ModuleContentSection> {
  const performanceContext = previousPerformance ? 
    `Önceki modül performansı: Anlama seviyesi ${previousPerformance.understandingLevel}/5, Zorluk yaşanan konular: ${previousPerformance.struggledConcepts?.join(', ')}, Güçlü yönler: ${previousPerformance.strengths?.join(', ')}` :
    'İlk modül olduğu için önceki performans bilgisi yok.';

  const prompt = `
"${module.title}" konusu için özet ve değerlendirme bölümü oluştur.

Konu: ${module.title}
Açıklama: ${module.description}
Hedef seviye: ${difficulty}

Öğrenci Durumu:
${performanceContext}

Bir JSON formatında aşağıdakileri içer:
- summary: Konunun kapsamlı özeti (300-400 kelime)
- assessmentQuestions: 4 adet açık uçlu değerlendirme sorusu (her birinde question, type: "open", points: 25)
- keyLearningOutcomes: Ana öğrenme çıktıları listesi
- nextModulePreparation: Sonraki modüle hazırlık tavsiyeleri
- performanceIndicators: Performans göstergeleri

Soruları düşündürücü, analitik ve konu hakkında derinlemesine anlayış ölçen sorular yap.
  `;

  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
      maxTokens: 1000,
      temperature: 0.7,
    });
    
    console.log('AI Summary Evaluation Response:', text.substring(0, 200));
    
    // JSON parse etmeye çalış
    try {
      const parsed = JSON.parse(text);
      // Eğer content field'ı varsa onu kullan, yoksa tüm response'u content olarak kullan
      if (parsed.content) {
        return parsed;
      } else {
        return {
          content: text,
          metadata: { rawResponse: true }
        };
      }
    } catch (parseError) {
      console.log('JSON parse failed, using raw text');
      return {
        content: text,
        metadata: { rawResponse: true }
      };
    }
  } catch (e) {
    console.error('AI generation error:', e);
    return {
      content: JSON.stringify({
        summary: `${module.title} modülünü tamamladınız. Bu modülde temel kavramları öğrendiniz ve pratik uygulamalar yaptınız.`,
        assessmentQuestions: [
          {
            question: `${module.title} konusunun ana amacı nedir?`,
            type: "open_ended",
            difficulty: "easy",
            concept: "Temel anlama",
            points: 25
          },
          {
            question: `Bu konuda en çok zorlandığınız kısım hangisiydi?`,
            type: "open_ended",
            difficulty: "medium",
            concept: "Öz değerlendirme",
            points: 25
          }
        ],
        keyLearningOutcomes: [
          "Temel kavramları anladınız",
          "Pratik uygulamalar yaptınız",
          "Kritik düşünme becerilerinizi geliştirdiniz"
        ],
        nextModulePreparation: "Sonraki modüle geçmeden önce bu konuyu tekrar gözden geçirmenizi öneririz.",
        performanceIndicators: {
          strongConcepts: ["Temel kavramlar"],
          challengingConcepts: ["İleri seviye uygulamalar"],
          adaptiveRecommendations: "Aynı seviyede devam edin"
        }
      }),
      metadata: { error: 'AI generation failed, using fallback content' }
    };
  }
}

async function saveModuleContents(supabase: any, moduleId: string, sections: any) {
  const contentTypes = ['introduction', 'detailed_explanation', 'practical_task', 'summary_evaluation'];
  
  console.log('Saving module contents for module:', moduleId);
  
  for (const contentType of contentTypes) {
    console.log(`Saving ${contentType}...`);
    
    const { data, error } = await supabase
      .from('module_contents')
      .upsert({
        module_id: moduleId,
        content_type: contentType,
        content_data: sections[contentType],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'module_id,content_type'
      });

    if (error) {
      console.error(`Error saving ${contentType}:`, error);
    } else {
      console.log(`Successfully saved ${contentType}`);
    }
  }

  // Practical task'i ayrı tabloya da kaydet
  if (sections.practical_task && sections.practical_task.content) {
    const task = sections.practical_task.content;
    const { error: taskError } = await supabase
      .from('practical_tasks')
      .upsert({
        module_id: moduleId,
        task_title: task.taskTitle || 'Untitled Task',
        task_description: task.taskDescription || '',
        instructions: task.instructions || [],
        completion_criteria: task.completionCriteria || [],
        interaction_questions: task.interactionQuestions || [],
        updated_at: new Date().toISOString()
      });

    if (taskError) {
      console.error('Error saving practical task:', taskError);
    }
  }
}
