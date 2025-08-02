import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's active learning plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from("learning_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (plansError) {
      console.error("Plans fetch error:", plansError)
      return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
    }

    if (!plans || plans.length === 0) {
      return NextResponse.json({ plans: [] })
    }

    // Get modules for each plan
    const plansWithModules = await Promise.all(
      plans.map(async (plan) => {
        const { data: modules, error: modulesError } = await supabaseAdmin
          .from("modules")
          .select("*")
          .eq("plan_id", plan.id)
          .order("module_order", { ascending: true })

        if (modulesError) {
          console.error("Modules fetch error:", modulesError)
          return {
            ...plan,
            modules: [],
          }
        }

        // Check if all modules are completed
        const allModulesCompleted = modules.length > 0 && modules.every(module => module.completed)

        // If all modules are completed, return null to filter out this plan
        if (allModulesCompleted) {
          return null
        }

        // Transform modules to match frontend interface
        const transformedModules = modules.map((module, index) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          objectives: module.objectives || [],
          resources: module.resources || [],
          quiz: {
            question: module.quiz_question,
            options: module.quiz_options,
            type: module.quiz_type,
          },
          completed: module.completed,
          unlocked: module.unlocked,
          position: {
            x: module.position_x || 50,
            y: module.position_y || Math.max(10, 90 - (index * 80) / Math.max(1, modules.length - 1)),
          },
          type: module.module_type,
        }))

        return {
          id: plan.id,
          title: plan.title,
          modules: transformedModules,
          learningGoal: plan.learning_goal,
          dailyTime: plan.daily_time,
          duration: plan.duration,
          learningStyle: plan.learning_style,
          targetLevel: plan.target_level,
        }
      }),
    )

    // Filter out null values (completed plans)
    const activePlans = plansWithModules.filter(plan => plan !== null)

    return NextResponse.json({ plans: activePlans })
  } catch (error) {
    console.error("Get user plans error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
