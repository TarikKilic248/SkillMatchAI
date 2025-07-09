import { google } from "@ai-sdk/google"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

// Same advanced JSON repair function
function repairAndParseJSON(text: string) {
  try {
    let cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^\s*[\w\s]*?(?=\{)/g, "")
      .trim()

    const firstBrace = cleaned.indexOf("{")
    const lastBrace = cleaned.lastIndexOf("}")

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error("No valid JSON structure found")
    }

    cleaned = cleaned.substring(firstBrace, lastBrace + 1)

    cleaned = cleaned
      .replace(/,(\s*[\]}])/g, "$1")
      .replace(/"\s*\n\s*"/g, '",\n"')
      .replace(/}\s*\n\s*{/g, "},\n{")
      .replace(/]\s*\n\s*\[/g, "],\n[")
      .replace(/([}\]"])\s*\n\s*"/g, '$1,\n"')
      .replace(/'/g, '"')
      .replace(/}\s*[^}]*$/, "}")

    try {
      return JSON.parse(cleaned)
    } catch (parseError) {
      cleaned = cleaned
        .replace(/\[\s*([^,[\]]+)\s*([^,[\]]+)\s*\]/g, '["$1", "$2"]')
        .replace(/:\s*([^",[\]{}]+)(?=\s*[,}])/g, ': "$1"')
        .replace(/:\s*"(true|false|null)"/g, ": $1")
        .replace(/:\s*"(\d+)"/g, ": $1")

      return JSON.parse(cleaned)
    }
  } catch (error) {
    console.error("JSON repair failed:", error)
    throw new Error("Could not repair JSON")
  }
}

async function callGeminiSafely(prompt: string) {
  const models = ["gemini-1.5-flash", "gemini-1.0-pro"]

  for (const model of models) {
    try {
      const { text } = await generateText({
        model: google(model),
        prompt,
        maxTokens: 1500,
        temperature: 0.1,
      })

      if (!text || text.length < 50) {
        throw new Error("Response too short")
      }

      return text
    } catch (error) {
      console.error(`Model ${model} failed:`, error)
      continue
    }
  }

  throw new Error("All models failed")
}

interface RegenerateRequest {
  userData: {
    learningGoal: string
    dailyTime: string
    duration: string
    learningStyle: string
    targetLevel: string
  }
  feedbacks: Array<{
    moduleId: string
    feedback: string
    timestamp: string
  }>
  completedModules: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { userData, feedbacks, completedModules }: RegenerateRequest = await request.json()

    if (!userData || !userData.learningGoal) {
      return NextResponse.json({ error: "Missing user data" }, { status: 400 })
    }

    // Simple fallback plan
    const createSimplePlan = () => ({
      title: "Güncellenmiş Öğrenme Planı",
      modules: [
        {
          id: "1",
          title: "Yeniden Başlangıç",
          description: "Geri bildirimleriniz doğrultusunda optimize edilmiş içerik",
          objectives: ["Geliştirilmiş öğrenme deneyimi", "Kişiselleştirilmiş yaklaşım"],
          resources: ["Güncellenmiş materyaller", "İyileştirilmiş alıştırmalar"],
          quiz: { question: "Bu yeni yaklaşım nasıl?", type: "open" },
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
          type: "exam",
        },
      ],
    })

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const simplePlan = createSimplePlan()
      return NextResponse.json(simplePlan)
    }

    let planData

    try {
      const feedbackSummary = feedbacks
        .slice(0, 3)
        .map((f) => `${f.moduleId}: ${f.feedback.slice(0, 80)}`)
        .join("; ")

      const prompt = `Update learning plan for: ${userData.learningGoal}

Previous feedback: ${feedbackSummary}
Completed modules: ${completedModules.slice(0, 5).join(", ")}

Return ONLY this JSON structure:

{
  "title": "Updated Learning Plan",
  "modules": [
    {
      "id": "1",
      "title": "Module Title",
      "description": "Description",
      "objectives": ["Objective 1", "Objective 2"],
      "resources": ["Resource 1", "Resource 2"],
      "quiz": {
        "question": "Question?",
        "type": "open"
      },
      "type": "lesson"
    }
  ]
}

Create 5-7 modules based on feedback.`

      const response = await callGeminiSafely(prompt)
      planData = repairAndParseJSON(response)

      if (!planData || !Array.isArray(planData.modules) || planData.modules.length === 0) {
        throw new Error("Invalid structure")
      }
    } catch (error) {
      console.error("Regeneration failed, using fallback:", error)
      planData = createSimplePlan()
    }

    // Enhance modules
    const enhancedModules = planData.modules.map((module: any, index: number) => ({
      id: `${index + 1}`,
      title: module.title || `Güncellenmiş Modül ${index + 1}`,
      description: module.description || "Geri bildirimler doğrultusunda güncellenmiş modül",
      objectives:
        Array.isArray(module.objectives) && module.objectives.length > 0
          ? module.objectives
          : ["Geliştirilmiş öğrenme hedefi"],
      resources:
        Array.isArray(module.resources) && module.resources.length > 0 ? module.resources : ["Güncellenmiş kaynaklar"],
      quiz: {
        question: module.quiz?.question || "Bu güncellemeler nasıl?",
        ...(module.quiz?.options && Array.isArray(module.quiz.options) ? { options: module.quiz.options } : {}),
        type: module.quiz?.type === "multiple" ? "multiple" : "open",
      },
      completed: false,
      unlocked: index === 0,
      position: { x: 50, y: 90 - index * 15 },
      type: module.type || (index === planData.modules.length - 1 ? "exam" : "lesson"),
    }))

    const finalPlan = {
      title: planData.title || "Güncellenmiş Öğrenme Planı",
      modules: enhancedModules,
    }

    return NextResponse.json(finalPlan)
  } catch (error) {
    console.error("Regenerate error:", error)
    return NextResponse.json({ error: "Plan güncellenemedi" }, { status: 500 })
  }
}
