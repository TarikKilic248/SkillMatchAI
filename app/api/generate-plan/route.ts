import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

interface UserData {
  learningGoal: string
  dailyTime: string
  duration: string
  learningStyle: string
  targetLevel: string
}

interface Module {
  id: string
  title: string
  description: string
  objectives: string[]
  resources: string[]
  quiz: {
    question: string
    options?: string[]
    type: "multiple" | "open"
  }
  completed: boolean
  unlocked: boolean
  position: { x: number; y: number }
  type: "lesson" | "quiz" | "exam"
}

// --- Gemini helper -------------------------------------------------
async function callGemini(prompt: string) {
  // 1️⃣ preferred + 2️⃣ fallback model
  const modelIds = ["gemini-1.5-flash", "gemini-2.0-flash-exp"] as const
  const maxAttempts = 5

  for (const modelId of modelIds) {
    let delay = 500 // first wait = .5 s
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { text } = await generateText({
          model: google(modelId),
          prompt,
        })
        return text
      } catch (err: any) {
        // Break if it is an irrecoverable error
        const msg = err?.message ?? ""
        const overload = msg.includes("overloaded") || msg.includes("quota") || msg.includes("exceeded")
        if (!overload) {
          throw err
        }
        // Otherwise, wait and retry
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, delay))
          delay *= 2 // exponential back-off 0.5s → 1s → 2s → …
        }
      }
    }
    // if we exhausted attempts for this model, try the next one
  }
  // If we get here, every attempt failed
  throw new Error("Gemini modelleri aşırı yüklenmiş; lütfen daha sonra deneyin.")
}

export async function POST(request: NextRequest) {
  try {
    const userData: UserData = await request.json()

    // Check for API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is missing. Add it to your environment variables." },
        { status: 400 },
      )
    }

    const prompt = `
Sen bir eğitim uzmanısın. Aşağıdaki kullanıcı bilgilerine göre kişiselleştirilmiş bir mikro öğrenme planı oluştur:

Kullanıcı Bilgileri:
- Öğrenme Hedefi: ${userData.learningGoal}
- Günlük Zaman: ${userData.dailyTime}
- Eğitim Süresi: ${userData.duration}
- Öğrenme Tarzı: ${userData.learningStyle}
- Hedef Seviye: ${userData.targetLevel}

Lütfen aşağıdaki JSON formatında bir öğrenme planı oluştur:

{
  "title": "Plan başlığı",
  "modules": [
    {
      "id": "unique_id",
      "title": "Modül başlığı (kısa ve öz)",
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

Kurallar:
1. Günlük zaman ve toplam süreye göre modül sayısını ayarla
2. Öğrenme tarzına göre kaynak türlerini belirle (görsel için videolar, uygulamalı için projeler)
3. Hedef seviyeye göre zorluk derecesini ayarla
4. Her 3-4 modülde bir "quiz" türünde değerlendirme ekle
5. Son modül "exam" türünde final sınavı olsun
6. Modül başlıkları 20 karakteri geçmesin
7. Her modülde 2-3 hedef kazanım olsun
8. Quiz soruları modül içeriğiyle ilgili olsun
9. Kaynaklar öğrenme tarzına uygun olsun
10. Toplam ${userData.duration === "2weeks" ? "10-12" : userData.duration === "4weeks" ? "16-20" : userData.duration === "8weeks" ? "24-28" : "32-36"} modül oluştur

Sadece JSON formatında yanıt ver, başka açıklama ekleme.
`

    const text = await callGemini(prompt)

    // Clean and parse JSON response
    let planData
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      planData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      throw new Error("Invalid JSON response from Gemini")
    }

    // Add position and status information to modules
    const enhancedModules: Module[] = planData.modules.map((module: any, index: number) => {
      // Create tree-like positions
      const totalModules = planData.modules.length
      const row = Math.floor(index / 3)
      const col = index % 3
      const maxRows = Math.ceil(totalModules / 3)

      // Y position: decreases from 90 to 10 (bottom to top)
      const y = 90 - (row * 80) / (maxRows - 1 || 1)

      // X position: zigzag pattern for sequential modules
      let x
      if (col === 0) x = 20 + (row % 2) * 10
      else if (col === 1) x = 50
      else x = 80 - (row % 2) * 10

      return {
        ...module,
        id: `module_${index + 1}`,
        completed: false,
        unlocked: index === 0, // Only first module is unlocked
        position: { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) },
      }
    })

    const finalPlan = {
      title: planData.title,
      modules: enhancedModules,
    }

    return NextResponse.json(finalPlan)
  } catch (error) {
    console.error("Gemini API error:", error)
    return NextResponse.json(
      {
        error: "Gemini API çağrısı başarısız oldu. Lütfen API anahtarını kontrol edin ve tekrar deneyin.",
      },
      { status: 502 },
    )
  }
}
