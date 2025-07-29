"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FiLogOut, FiUser } from "react-icons/fi"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push("/login") // Kullanıcı yoksa giriş sayfasına yönlendir
      }
      setLoading(false)
    }

    getUser()

    // Oturum değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Çıkış yaparken hata oluştu:", error.message)
      setLoading(false)
    } else {
      router.push("/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Yükleniyor...</h2>
            <p className="text-white/80">Lütfen bekleyin.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // Yönlendirme yapıldığı için burada bir şey render etmeye gerek yok
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex flex-col items-center justify-center p-4 overflow-hidden relative font-inter">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="relative mb-4">
            <FiUser className="w-16 h-16 mx-auto text-white animate-float" />
            <div className="absolute inset-0 w-16 h-16 mx-auto bg-white/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Hoş Geldin, {user.user_metadata?.full_name || user.email}!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
          <p className="text-white/80 text-lg leading-relaxed">
            Mikro öğrenme yolculuğuna hoş geldin. Burası senin kişisel öğrenme alanın.
          </p>
          <Button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white text-lg py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            size="lg"
            disabled={loading}
          >
            <FiLogOut className="mr-2 h-5 w-5" /> Çıkış Yap
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
