import { type NextRequest, NextResponse } from "next/server"

interface FeedbackData {
  moduleId: string
  feedback: string
  userId?: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const feedbackData: FeedbackData = await request.json()

    // Burada feedback'i veritabanına kaydedebilirsiniz
    // Şimdilik console'a log atalım
    console.log("User Feedback:", {
      moduleId: feedbackData.moduleId,
      feedback: feedbackData.feedback,
      timestamp: feedbackData.timestamp,
    })

    // Feedback'i analiz etmek için Gemini API'yi kullanabiliriz
    // Bu feedback'ler daha sonra planı yeniden oluştururken kullanılabilir

    return NextResponse.json({
      success: true,
      message: "Geri bildirim kaydedildi",
    })
  } catch (error) {
    console.error("Feedback save error:", error)
    return NextResponse.json({ error: "Geri bildirim kaydedilirken hata oluştu" }, { status: 500 })
  }
}
