import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

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
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Missing plan ID" }, { status: 400 })
    }

    // Deactivate the plan
    const { error: updateError } = await supabaseAdmin
      .from("learning_plans")
      .update({ is_active: false })
      .eq("id", planId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Plan deactivation error:", updateError)
      return NextResponse.json({ error: "Failed to deactivate plan" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Deactivate plan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 