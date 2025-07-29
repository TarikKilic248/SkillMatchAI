import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { supabase } from "@/lib/supabase"

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

// Advanced JSON cleaning and repair function
function repairAndParseJSON(text: string) {
  try {
    // Step 1: Basic cleaning
    let cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^\s*[\w\s]*?(?=\{)/g, "") // Remove any text before first {
      .trim()

    // Step 2: Extract JSON content
    const firstBrace = cleaned.indexOf("{")
    const lastBrace = cleaned.lastIndexOf("}")

    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error("No valid JSON structure found")
    }

    cleaned = cleaned.substring(firstBrace, lastBrace + 1)

    // Step 3: Fix common JSON issues
    cleaned = cleaned
      // Fix trailing commas in arrays and objects
      .replace(/,(\s*[\]}])/g, "$1")
      // Fix missing commas between array elements
      .replace(/"\s*\n\s*"/g, '",\n"')
      .replace(/}\s*\n\s*{/g, "},\n{")
      .replace(/]\s*\n\s*\[/g, "],\n[")
      // Fix missing commas between object properties
      .replace(/"\s*\n\s*"/g, '",\n"')
      .replace(/([}\]"])\s*\n\s*"/g, '$1,\n"')
      // Fix quotes
      .replace(/'/g, '"')
      // Remove any trailing text after the last }
      .replace(/}\s*[^}]*$/, "}")

    // Step 4: Try to parse
    try {
      return JSON.parse(cleaned)
    } catch (parseError) {
      console.log("First parse failed, attempting repair...")

      // Step 5: More aggressive repairs
      cleaned = cleaned
        // Fix array formatting issues
        .replace(/\[\s*([^,[\]]+)\s*([^,[\]]+)\s*\]/g, '["$1", "$2"]')
        // Ensure proper string quoting
        .replace(/:\s*([^",[\]{}]+)(?=\s*[,}])/g, ': "$1"')
        // Fix boolean and null values
        .replace(/:\s*"(true|false|null)"/g, ": $1")
        // Fix number values that got quoted
        .replace(/:\s*"(\d+)"/g, ": $1")

      return JSON.parse(cleaned)
    }
  } catch (error) {
    console.error("JSON repair failed:", error)
    console.error("Problematic text:", text.substring(0, 500))
    throw new Error("Could not repair JSON")
  }
}

// Create a comprehensive fallback plan
function createFallbackPlan(userData: UserData) {
  const moduleCount =
    userData.duration === "2weeks" ? 4 : userData.duration === "4weeks" ? 6 : userData.duration === "8weeks" ? 8 : 10

  const modules = []

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
  ]

  for (let i = 0; i < moduleCount; i++) {
    const isQuiz = (i + 1) % 3 === 0 && i < moduleCount - 1
    const isExam = i === moduleCount - 1
    const topicIndex = Math.min(i, baseTopics.length - 1)

    modules.push({
      id: `${i + 1}`,
      title: isExam ? "Final Değerlendirme" : isQuiz ? `Hafta ${Math.ceil((i + 1) / 3)} Quiz` : baseTopics[topicIndex],
      description: isExam
        ? "Tüm öğrenilenlerin kapsamlı değerlendirmesi"
        : isQuiz
          ? "Haftalık değerlendirme ve gözden geçirme"
          : `${userData.learningGoal} konusunda ${baseTopics[topicIndex].toLowerCase()}`,
      objectives: isExam
        ? ["Genel değerlendirme", "Başarı ölçümü"]
        : isQuiz
          ? ["Haftalık değerlendirme", "Eksik konuları belirleme"]
          : [`${baseTopics[topicIndex]} konusunda uzmanlaşma`, "Pratik beceriler kazanma"],
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
            : "Bu modülde öğrendiklerinizi değerlendiriniz",
        ...(isExam
          ? {
              options: ["Mükemmel", "Çok iyi", "İyi", "Geliştirilmeli"],
              type: "multiple" as const,
            }
          : isQuiz
            ? {
                options: ["Temel kavramlar", "Pratik uygulamalar", "İleri konular", "Hepsi iyi"],
                type: "multiple" as const,
              }
            : {
                type: "open" as const,
              }),
      },
      completed: false,
      unlocked: i === 0,
      position: { x: 50, y: Math.max(10, 90 - (i * 80) / Math.max(1, moduleCount - 1)) },
      type: isExam ? ("exam" as const) : isQuiz ? ("quiz" as const) : ("lesson" as const),
    })
  }

  return {
    title: `${userData.learningGoal} - Kişiselleştirilmiş Öğrenme Planı`,
    modules,
  }
}

// Simplified Gemini call with better error handling
async function callGeminiSafely(prompt: string) {
  const models = ["gemini-1.5-flash", "gemini-1.0-pro"]

  for (const model of models) {
    try {
      const { text } = await generateText({
        model: google(model),
        prompt,
        maxTokens: 2000,
        temperature: 0.1, // Very low temperature for consistent JSON
      })

      if (!text || text.length < 100) {
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

// Save plan to database
async function savePlanToDatabase(userData: UserData, planData: any, userId: string) {
  try {
    // Create learning plan
    const { data: planRecord, error: planError } = await supabase
      .from("learning_plans")
      .insert({
        user_id: userId,
        title: planData.title,
        learning_goal: userData.learningGoal,
        daily_time: userData.dailyTime,
        duration: userData.duration,
        learning_style: userData.learningStyle,
        target_level: userData.targetLevel,
        is_active: true,
      })
      .select()
      .single()

    if (planError) {
      console.error("Plan kaydetme hatası:", planError)
      throw new Error("Plan kaydedilemedi")
    }

    // Create modules
    const modulesToInsert = planData.modules.map((module: any, index: number) => ({
      plan_id: planRecord.id,
      module_order: index + 1,
      title: module.title,
      description: module.description,
      objectives: module.objectives || [],
      resources: module.resources || [],
      quiz_question: module.quiz.question,
      quiz_options: module.quiz.options || null,
      quiz_type: module.quiz.type,
      module_type: module.type,
      completed: module.completed || false,
      unlocked: module.unlocked || index === 0,
      position_x: module.position?.x || 50,
      position_y: module.position?.y || 50,
    }))

    const { error: modulesError } = await supabase.from("modules").insert(modulesToInsert)

    if (modulesError) {
      console.error("Modül kaydetme hatası:", modulesError)
      // Plan kaydını geri al
      await supabase.from("learning_plans").delete().eq("id", planRecord.id)
      throw new Error("Modüller kaydedilemedi")
    }

    return planRecord.id
  } catch (error) {
    console.error("Veritabanı kaydetme hatası:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  let userData: UserData

  try {
    const body = await request.json()
    userData = body.userData || body

    // Get user from auth
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate user data
    if (!userData.learningGoal || !userData.dailyTime || !userData.duration) {
      throw new Error("Missing required user data")
    }

    const moduleCount =
      userData.duration === "2weeks" ? 5 : userData.duration === "4weeks" ? 7 : userData.duration === "8weeks" ? 10 : 12

    let planData

    // Check API key and use fallback if missing
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log("No API key found, using fallback plan")
      planData = createFallbackPlan(userData)
    } else {
      // Very simple and structured prompt to minimize JSON errors
      const prompt = `Create a learning plan for: ${userData.learningGoal}

Requirements:
- ${moduleCount} modules total
- Daily time: ${userData.dailyTime}
- Duration: ${userData.duration}
- Style: ${userData.learningStyle}
- Level: ${userData.targetLevel}

Return ONLY this exact JSON structure with NO additional text:

{
  "title": "Learning Plan Title",
  "modules": [
    {
      "id": "1",
      "title": "Module Title",
      "description": "Brief description",
      "objectives": ["Objective 1", "Objective 2"],
      "resources": ["Resource 1", "Resource 2"],
      "quiz": {
        "question": "Assessment question?",
        "type": "open"
      },
      "type": "lesson"
    }
  ]
}

Make every 3rd module type "quiz" and last module type "exam". Include exactly ${moduleCount} modules.`

      try {
        // Try Gemini first
        const response = await callGeminiSafely(prompt)
        planData = repairAndParseJSON(response)

        // Validate the structure
        if (!planData || !planData.title || !Array.isArray(planData.modules) || planData.modules.length === 0) {
          throw new Error("Invalid plan structure from Gemini")
        }

        // Validate each module has required fields
        for (let i = 0; i < planData.modules.length; i++) {
          const module = planData.modules[i]
          if (!module.title || !module.description) {
            throw new Error(`Module ${i + 1} missing required fields`)
          }

          // Ensure arrays exist
          if (!Array.isArray(module.objectives)) {
            module.objectives = ["Öğrenme hedefi"]
          }
          if (!Array.isArray(module.resources)) {
            module.resources = ["Öğrenme materyali"]
          }

          // Ensure quiz exists
          if (!module.quiz || !module.quiz.question) {
            module.quiz = {
              question: "Bu modülde ne öğrendin?",
              type: "open",
            }
          }
        }

        console.log("Successfully parsed Gemini response")
      } catch (error) {
        console.error("Gemini failed, using fallback:", error)
        planData = createFallbackPlan(userData)
      }
    }

    // Enhance modules with required fields
    const enhancedModules: Module[] = planData.modules.map((module: any, index: number) => {
      const totalModules = planData.modules.length

      return {
        id: `${index + 1}`,
        title: module.title || `Modül ${index + 1}`,
        description: module.description || `${userData.learningGoal} ile ilgili öğrenme modülü`,
        objectives:
          Array.isArray(module.objectives) && module.objectives.length > 0
            ? module.objectives
            : [`${userData.learningGoal} becerilerini geliştirme`],
        resources:
          Array.isArray(module.resources) && module.resources.length > 0
            ? module.resources
            : ["Öğrenme materyalleri", "Pratik alıştırmalar"],
        quiz: {
          question: module.quiz?.question || "Bu modülde öğrendiklerinizi değerlendiriniz",
          ...(module.quiz?.options && Array.isArray(module.quiz.options) ? { options: module.quiz.options } : {}),
          type: module.quiz?.type === "multiple" ? "multiple" : "open",
        },
        completed: false,
        unlocked: index === 0,
        position: {
          x: 50,
          y: Math.max(10, 90 - (index * 80) / Math.max(1, totalModules - 1)),
        },
        type:
          module.type === "exam"
            ? "exam"
            : module.type === "quiz"
              ? "quiz"
              : index === totalModules - 1
                ? "exam"
                : (index + 1) % 3 === 0
                  ? "quiz"
                  : "lesson",
      }
    })

    const finalPlan = {
      title: planData.title || `${userData.learningGoal} - Öğrenme Planı`,
      modules: enhancedModules,
    }

    // Save to database
    const planId = await savePlanToDatabase(userData, finalPlan, user.id)

    return NextResponse.json({ ...finalPlan, planId })
  } catch (error) {
    console.error("Complete API failure:", error)

    // Emergency fallback - always return a working plan
    const emergencyPlan = createFallbackPlan(
      userData || {
        learningGoal: "Genel Öğrenme",
        dailyTime: "1hour",
        duration: "4weeks",
        learningStyle: "mixed",
        targetLevel: "intermediate",
      },
    )

    return NextResponse.json(emergencyPlan)
  }
}
