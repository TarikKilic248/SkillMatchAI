import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Validation schema for signup
const signupSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = signupSchema.parse(body)
    
    const { email, password, full_name } = validatedData

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers()
    
    if (checkError) {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Kullanıcı kontrolü sırasında hata oluştu' },
        { status: 500 }
      )
    }

    const userExists = existingUser.users.some(user => user.email === email)
    if (userExists) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
      user_metadata: {
        full_name
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulamadı' },
        { status: 500 }
      )
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        email
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the signup if profile creation fails
      // The trigger should handle this, but we log it
    }

    // Return success response
    return NextResponse.json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
} 