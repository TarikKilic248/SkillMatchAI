import { type NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

interface FeedbackData {
  moduleId: string;
  feedback: string;
  userId?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const feedbackData: FeedbackData = await request.json();

    console.log("📝 Saving feedback via backend API...");

    try {
      // Try backend API first
      const response = await apiClient.saveFeedback(feedbackData);
      
      console.log("✅ Successfully saved feedback to backend");
      
      return NextResponse.json({
        success: true,
        message: "Geri bildirim başarıyla kaydedildi",
        sentimentScore: response.sentimentScore,
      });

    } catch (backendError) {
      console.error("❌ Backend API failed for feedback:", backendError);
      console.log("🔄 Falling back to local logging...");

      // Fallback - log locally (existing behavior)
      console.log("User Feedback:", {
        moduleId: feedbackData.moduleId,
        feedback: feedbackData.feedback,
        timestamp: feedbackData.timestamp,
      });

      return NextResponse.json({
        success: true,
        message: "Geri bildirim yerel olarak kaydedildi",
      });
    }

  } catch (error) {
    console.error("❌ Feedback save error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Geri bildirim kaydedilirken hata oluştu" 
      }, 
      { status: 500 }
    );
  }
}
