import { type NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

interface RegenerateRequest {
  userData: {
    learningGoal: string;
    dailyTime: string;
    duration: string;
    learningStyle: string;
    targetLevel: string;
  };
  feedbacks: Array<{
    moduleId: string;
    feedback: string;
    timestamp: string;
  }>;
  completedModules: string[];
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

// Simple fallback plan
function createSimplePlan() {
  return {
    title: "Güncellenmiş Öğrenme Planı",
    modules: [
      {
        id: "1",
        title: "Yeniden Başlangıç",
        description: "Geri bildirimleriniz doğrultusunda optimize edilmiş içerik",
        objectives: ["Geliştirilmiş öğrenme deneyimi", "Kişiselleştirilmiş yaklaşım"],
        resources: ["Güncellenmiş materyaller", "İyileştirilmiş alıştırmalar"],
        quiz: { question: "Bu yeni yaklaşım nasıl?", type: "open" },
        completed: false,
        unlocked: true,
        position: { x: 50, y: 90 },
        type: "lesson",
      },
      {
        id: "2",
        title: "Gelişmiş Konular",
        description: "Daha derinlemesine ve pratik odaklı içerik",
        objectives: ["İleri seviye beceriler", "Gerçek dünya uygulamaları"],
        resources: ["Pratik projeler", "Gerçek örnekler"],
        quiz: {
          question: "Hangi konu daha faydalı?",
          options: ["Teori", "Pratik", "Projeler", "Örnekler"],
          type: "multiple",
        },
        completed: false,
        unlocked: false,
        position: { x: 50, y: 75 },
        type: "lesson",
      },
      {
        id: "3",
        title: "Final Değerlendirme",
        description: "Kapsamlı değerlendirme ve gelecek planları",
        objectives: ["Genel değerlendirme", "İlerleme ölçümü"],
        resources: [],
        quiz: {
          question: "Genel memnuniyetiniz nedir?",
          options: ["Çok memnun", "Memnun", "Orta", "Geliştirilmeli"],
          type: "multiple",
        },
        completed: false,
        unlocked: false,
        position: { x: 50, y: 60 },
        type: "exam",
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userData, feedbacks, completedModules }: RegenerateRequest = await request.json();

    if (!userData || !userData.learningGoal) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 });
    }

    console.log("🔄 Regenerating plan via backend API...");

    try {
      // Try backend API first
      const backendResponse = await apiClient.regeneratePlan({
        userData,
        feedbacks,
        completedModules,
      }) as BackendPlanResponse;

      console.log("✅ Successfully regenerated plan from backend");

      // Enhance modules with frontend-specific fields
      const enhancedModules = backendResponse.modules.map((module, index) => ({
        id: module.id || `${index + 1}`,
        title: module.title || `Güncellenmiş Modül ${index + 1}`,
        description: module.description || "Geri bildirimler doğrultusunda güncellenmiş modül",
        objectives:
          Array.isArray(module.objectives) && module.objectives.length > 0
            ? module.objectives
            : ["Geliştirilmiş öğrenme hedefi"],
        resources:
          Array.isArray(module.resources) && module.resources.length > 0 
            ? module.resources 
            : ["Güncellenmiş kaynaklar"],
        quiz: {
          question: module.quiz?.question || "Bu güncellemeler nasıl?",
          ...(module.quiz?.options && Array.isArray(module.quiz.options) 
            ? { options: module.quiz.options } 
            : {}),
          type: module.quiz?.type === "multiple" ? "multiple" : "open",
        },
        completed: false,
        unlocked: index === 0,
        position: { x: 50, y: 90 - index * 15 },
        type: module.type || (index === backendResponse.modules.length - 1 ? "exam" : "lesson"),
      }));

      const finalPlan = {
        title: backendResponse.title || "Güncellenmiş Öğrenme Planı",
        modules: enhancedModules,
      };

      return NextResponse.json(finalPlan);

    } catch (backendError) {
      console.error("❌ Backend API failed for regeneration:", backendError);
      console.log("🔄 Falling back to simple plan...");

      // Fallback to simple plan
      const simplePlan = createSimplePlan();
      
      console.log("✅ Generated simple fallback plan");
      
      return NextResponse.json(simplePlan);
    }

  } catch (error) {
    console.error("❌ Regenerate error:", error);
    return NextResponse.json({ error: "Plan güncellenemedi" }, { status: 500 });
  }
}
