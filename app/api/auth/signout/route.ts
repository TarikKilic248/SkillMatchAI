import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Set the session for the request
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      )
    }

    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('Signout error:', signOutError)
      return NextResponse.json(
        { error: 'Çıkış yapılırken hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Başarıyla çıkış yapıldı'
    }, { status: 200 })

  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
} 