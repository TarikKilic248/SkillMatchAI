import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at?: string
}

export interface AuthResponse {
  user: AuthUser
  session?: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

/**
 * Get user from request headers
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    // Get profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email!,
      full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
      created_at: user.created_at,
      updated_at: profile?.updated_at
    }
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Şifre en az 6 karakter olmalıdır')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if user exists by email
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error checking user existence:', error)
      return false
    }
    
    return users.users.some(user => user.email === email)
  } catch (error) {
    console.error('Error checking user existence:', error)
    return false
  }
}

/**
 * Create user profile
 */
export async function createUserProfile(userId: string, fullName: string, email: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        email
      })
    
    if (error) {
      console.error('Error creating user profile:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error creating user profile:', error)
    return false
  }
}
