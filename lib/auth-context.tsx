"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Kullanıcı bilgilerini getir
  const fetchUser = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.user
      }
      return null
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  // Local storage'dan token'ı al ve kullanıcı bilgilerini getir
  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        const userData = await fetchUser(token)
        if (userData) {
          setUser(userData)
        } else {
          // Token geçersiz, temizle
          localStorage.removeItem('access_token')
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.session?.access_token) {
        // Token'ı kaydet
        localStorage.setItem('access_token', data.session.access_token)
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Giriş başarısız' }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'Bağlantı hatası' }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, full_name: fullName })
      })

      const data = await response.json()

      if (response.ok) {
        // Kayıt başarılı, giriş yap
        return await signIn(email, password)
      } else {
        return { success: false, error: data.error || 'Kayıt başarısız' }
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'Bağlantı hatası' }
    }
  }

  const signOut = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      // Local state'i temizle
      localStorage.removeItem('access_token')
      setUser(null)
      router.push('/login')
    }
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      const userData = await fetchUser(token)
      setUser(userData)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 