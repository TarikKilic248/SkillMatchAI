import { google } from "@ai-sdk/google"
import { type NextRequest, NextResponse } from "next/server"

async function callGemini(prompt: string) {
  const model = google("gemini-1.5-flash")
  const response = await model.generateContent(prompt)
  const text = response.response.text()
  return text
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

    if (!userData || !feedbacks || !completedModules) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is missing from environment variables" },
        { status: 400 },
      )
    }

    // Analyze feedbacks
    const feedbackSummary = feedbacks.map((f) => `Modül ${f.moduleId}: ${f.feedback}`).join("\n")

    const prompt = `
Sen bir eğitim uzmanısın. Kullanıcının önceki deneyimlerine göre öğrenme planını yeniden oluştur.

Orijinal Kullanıcı Bilgileri:
- Öğrenme Hedefi: ${userData.learningGoal}
- Günlük Zaman: ${userData.dailyTime}
- Eğitim Süresi: ${userData.duration}
- Öğrenme Tarzı: ${userData.learningStyle}
- Hedef Seviye: ${userData.targetLevel}

Kullanıcı Geri Bildirimleri:
${feedbackSummary}

Tamamlanan Modüller: ${completedModules.join(", ")}

Bu geri bildirimlere göre planı iyileştir:
1. Zorluk yaşanan konulara daha fazla zaman ayır
2. Başarılı olan öğrenme yöntemlerini artır
3. Kullanıcının tercih ettiği kaynak türlerini öncelikle
4. Zaman sıkıntısı varsa modülleri daha kısa yap
5. Motivasyon düşükse daha interaktif içerikler ekle

Aynı JSON formatında yeni bir plan oluştur:

{
  "title": "Güncellenmiş Plan Başlığı",
  "modules": [
    {
      "id": "unique_id",
      "title": "Modül başlığı",
      "description": "Modül açıklaması",
      "objectives": ["Hedef 1", "Hedef 2"],
      "resources": ["Kaynak 1", "Kaynak 2"],
      "quiz": {
        "question": "Değerlendirme sorusu",
        "options": ["Seçenek 1", "Seçenek 2", "Seçenek 3", "Seçenek 4"],
        "type": "multiple"
      },
      "type": "lesson"
    }
  ]
}

Sadece JSON formatında yanıt ver.
`

    const text = await callGemini(prompt)

    let planData
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      planData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json({ error: "Invalid JSON response from Gemini" }, { status: 500 })
    }

    // Add position and status information to modules
    const enhancedModules = planData.modules.map((module: any, index: number) => {
      const totalModules = planData.modules.length
      const row = Math.floor(index / 3)
      const col = index % 3
      const maxRows = Math.ceil(totalModules / 3)

      const y = 90 - (row * 80) / (maxRows - 1 || 1)

      let x
      if (col === 0) x = 20 + (row % 2) * 10
      else if (col === 1) x = 50
      else x = 80 - (row % 2) * 10

      return {
        ...module,
        id: `module_${index + 1}`,
        completed: false,
        unlocked: index === 0,
        position: { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) },
      }
    })

    const finalPlan = {
      title: planData.title,
      modules: enhancedModules,
    }

    return NextResponse.json(finalPlan)
  } catch (error) {
    console.error("Regenerate plan error:", error)
    return NextResponse.json({ error: "Plan yeniden oluşturulurken hata oluştu" }, { status: 500 })
  }
}
