import { type NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

interface UserData {
  learningGoal: string;
  dailyTime: string;
  duration: string;
  learningStyle: string;
  targetLevel: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  resources: string[];
  quiz: {
    question: string;
    options?: string[];
    type: "multiple" | "open";
  };
  completed: boolean;
  unlocked: boolean;
  position: { x: number; y: number };
  type: "lesson" | "quiz" | "exam";
}

interface BackendPlanResponse {
  title: string;
  modules: Array<{
    id: string;
    title: string;
    description: string;
    objectives: string[];
    resources: string[];
    quiz: {
      question: string;
      options?: string[];
      type: "multiple" | "open";
    };
    type: "lesson" | "quiz" | "exam";
  }>;
}

// Fallback plan function - same as before
function createFallbackPlan(userData: UserData) {
  const moduleCount =
    userData.duration === "2weeks"
      ? 4
      : userData.duration === "4weeks"
      ? 6
      : userData.duration === "8weeks"
      ? 8
      : 10;

  const modules = [];

  // Create modules based on learning goal and style
  const baseTopics = [
    "Temel Kavramlar ve Giriş",
    "Pratik Uygulamalar",
    "İleri Seviye Konular",
    "Proje Geliştirme",
    "En İyi Uygulamalar",
    "Gerçek Dünya Örnekleri",
    "Performans ve Optimizasyon",
    "Gelecek Adımlar",
  ];

  for (let i = 0; i < moduleCount; i++) {
    const isQuiz = (i + 1) % 3 === 0 && i < moduleCount - 1;
    const isExam = i === moduleCount - 1;
    const topicIndex = Math.min(i, baseTopics.length - 1);

    modules.push({
      id: `${i + 1}`,
      title: isExam
        ? "Final Değerlendirme"
        : isQuiz
        ? `Hafta ${Math.ceil((i + 1) / 3)} Quiz`
        : baseTopics[topicIndex],
      description: isExam
        ? "Tüm öğrenilenlerin kapsamlı değerlendirmesi"
        : isQuiz
        ? "Haftalık değerlendirme ve gözden geçirme"
        : `${userData.learningGoal} konusunda ${baseTopics[
            topicIndex
          ].toLowerCase()}`,
      objectives: isExam
        ? ["Genel değerlendirme", "Başarı ölçümü"]
        : isQuiz
        ? ["Haftalık değerlendirme", "Eksik konuları belirleme"]
        : [
            `${baseTopics[topicIndex]} konusunda uzmanlaşma`,
            "Pratik beceriler kazanma",
          ],
      resources:
        isExam || isQuiz
          ? []
          : [
              userData.learningStyle === "visual"
                ? "Video dersler ve infografikler"
                : userData.learningStyle === "practical"
                ? "Hands-on projeler ve uygulamalar"
                : userData.learningStyle === "reading"
                ? "Detaylı dökümanlar ve makaleler"
                : "Karma öğrenme materyalleri",
              "Interaktif alıştırmalar",
              "Gerçek dünya örnekleri",
            ],
      quiz: {
        question: isExam
          ? "Bu eğitimi genel olarak nasıl değerlendiriyorsun?"
          : isQuiz
          ? "Bu haftaki konularda hangi alanda daha fazla çalışmaya ihtiyaç duyuyorsun?"
          : "Bu modülde öğrendiğin en önemli konu neydi?",
        ...(isExam
          ? {
              options: ["Mükemmel", "Çok iyi", "İyi", "Geliştirilmeli"],
              type: "multiple" as const,
            }
          : isQuiz
          ? {
              options: [
                "Temel kavramlar",
                "Pratik uygulamalar",
                "İleri konular",
                "Hepsi iyi",
              ],
              type: "multiple" as const,
            }
          : {
              type: "open" as const,
            }),
      },
      completed: false,
      unlocked: i === 0,
      position: {
        x: 50,
        y: Math.max(10, 90 - (i * 80) / Math.max(1, moduleCount - 1)),
      },
      type: isExam
        ? ("exam" as const)
        : isQuiz
        ? ("quiz" as const)
        : ("lesson" as const),
    });
  }

  return {
    title: `${userData.learningGoal} - Kişiselleştirilmiş Öğrenme Planı`,
    modules,
  };
}

export async function POST(request: NextRequest) {
  // Initialize with default values to avoid "used before assigned" error
  let userData: UserData = {
    learningGoal: "Genel Öğrenme",
    dailyTime: "1hour",
    duration: "4weeks",
    learningStyle: "mixed",
    targetLevel: "intermediate",
  };

  try {
    userData = await request.json();

    // Validate user data
    if (!userData.learningGoal || !userData.dailyTime || !userData.duration) {
      throw new Error("Missing required user data");
    }

    console.log("🔄 Generating plan via backend API...");

    try {
      // Try backend API first
      const backendResponse = await apiClient.generatePlan(userData) as BackendPlanResponse;
      
      console.log("✅ Successfully received plan from backend");

      // Enhance modules with frontend-specific fields
      const enhancedModules: Module[] = backendResponse.modules.map(
        (module, index) => ({
          id: module.id || `${index + 1}`,
          title: module.title,
          description: module.description,
          objectives: Array.isArray(module.objectives) ? module.objectives : [],
          resources: Array.isArray(module.resources) ? module.resources : [],
          quiz: {
            question: module.quiz?.question || "Bu modülde ne öğrendin?",
            ...(module.quiz?.options && Array.isArray(module.quiz.options)
              ? { options: module.quiz.options }
              : {}),
            type: module.quiz?.type === "multiple" ? "multiple" : "open",
          },
          completed: false,
          unlocked: index === 0,
          position: {
            x: 50,
            y: Math.max(10, 90 - (index * 80) / Math.max(1, backendResponse.modules.length - 1)),
          },
          type: module.type || "lesson",
        })
      );

      return NextResponse.json({
        title: backendResponse.title,
        modules: enhancedModules,
      });

    } catch (backendError) {
      console.error("❌ Backend API failed:", backendError);
      console.log("🔄 Falling back to local processing...");

      // Fallback to local plan generation
      const fallbackPlan = createFallbackPlan(userData);
      
      console.log("✅ Generated fallback plan locally");
      
      return NextResponse.json(fallbackPlan);
    }

  } catch (error) {
    console.error("❌ Complete API failure:", error);

    // Emergency fallback - always return a working plan
    const emergencyPlan = createFallbackPlan(userData);

    return NextResponse.json(emergencyPlan);
  }
}
