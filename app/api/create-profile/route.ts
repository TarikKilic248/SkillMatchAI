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

    const { fullName, email } = await request.json()

    if (!fullName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

    if (existingProfile) {
      return NextResponse.json({ message: "Profile already exists" })
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Create profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
