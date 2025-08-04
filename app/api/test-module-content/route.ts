import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Module content generation API is working",
    testData: {
      introduction: {
        content: "# Test Modülü - Giriş\n\nBu bir test modülüdür."
      },
      detailed_explanation: {
        content: "# Detaylı Açıklama\n\nDetaylı içerik burada yer alır.",
        videoSuggestions: ["Test Video 1", "Test Video 2"]
      },
      practical_task: {
        content: JSON.stringify({
          taskTitle: "Test Görevi",
          instructions: ["Adım 1", "Adım 2"],
          completionCriteria: ["Kriter 1"]
        })
      },
      summary_evaluation: {
        content: JSON.stringify({
          summary: "Modül özeti",
          assessmentQuestions: [{
            question: "Test sorusu?",
            type: "multiple_choice",
            options: ["A", "B", "C", "D"],
            correctAnswer: "A"
          }]
        })
      }
    }
  });
}
