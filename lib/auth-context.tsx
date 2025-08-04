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

      if (!response.ok) {
        console.error('User fetch failed:', response.status, response.statusText);
        return null;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("User response is not JSON:", contentType);
        return null;
      }

      try {
        const data = await response.json();
        return data.user;
      } catch (jsonError) {
        console.error("User JSON parse error:", jsonError);
        return null;
      }
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

      if (!response.ok) {
        console.error('Signin failed:', response.status, response.statusText);
        return { success: false, error: 'Giriş başarısız' };
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Signin response is not JSON:", contentType);
        return { success: false, error: 'Sunucu hatası' };
      }

      try {
        const data = await response.json();

        if (data.session?.access_token) {
          // Token'ı kaydet
          localStorage.setItem('access_token', data.session.access_token)
          setUser(data.user)
          return { success: true }
        } else {
          return { success: false, error: data.error || 'Giriş başarısız' }
        }
      } catch (jsonError) {
        console.error("Signin JSON parse error:", jsonError);
        return { success: false, error: 'Sunucu hatası' };
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

      if (!response.ok) {
        console.error('Signup failed:', response.status, response.statusText);
        return { success: false, error: 'Kayıt başarısız' };
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Signup response is not JSON:", contentType);
        return { success: false, error: 'Sunucu hatası' };
      }

      try {
        const data = await response.json();

        if (data.message) {
          // Kayıt başarılı, giriş yap
          return await signIn(email, password)
        } else {
          return { success: false, error: data.error || 'Kayıt başarısız' }
        }
      } catch (jsonError) {
        console.error("Signup JSON parse error:", jsonError);
        return { success: false, error: 'Sunucu hatası' };
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
