import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
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
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fullName, email } = await request.json()

    if (!fullName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Creating profile for user:", user.id, "with data:", { fullName, email })

    // Admin client kullanarak profile oluştur (RLS bypass)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single()

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json(
        {
          error: "Failed to create profile",
          details: profileError.message,
        },
        { status: 500 },
      )
    }

    console.log("Profile created successfully:", profile)
    return NextResponse.json({ profile, success: true })
  } catch (error) {
    console.error("Create profile error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
