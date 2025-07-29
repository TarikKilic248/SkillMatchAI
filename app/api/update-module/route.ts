import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
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

    const { moduleId, completed, unlockNext } = await request.json()

    if (!moduleId) {
      return NextResponse.json({ error: "Missing module ID" }, { status: 400 })
    }

    // Update the current module
    const { error: updateError } = await supabase
      .from("modules")
      .update({ completed: completed || false })
      .eq("id", moduleId)

    if (updateError) {
      console.error("Module update error:", updateError)
      return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
    }

    // If unlockNext is true, unlock the next module
    if (unlockNext) {
      // Get current module's plan and order
      const { data: currentModule, error: moduleError } = await supabase
        .from("modules")
        .select("plan_id, module_order")
        .eq("id", moduleId)
        .single()

      if (!moduleError && currentModule) {
        // Unlock next module
        const { error: unlockError } = await supabase
          .from("modules")
          .update({ unlocked: true })
          .eq("plan_id", currentModule.plan_id)
          .eq("module_order", currentModule.module_order + 1)

        if (unlockError) {
          console.error("Next module unlock error:", unlockError)
          // Don't fail the request if unlocking fails
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update module error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
