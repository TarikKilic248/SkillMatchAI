"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FiLogIn, FiMail, FiLock, FiAlertCircle, FiCheckCircle } from "react-icons/fi"
import { supabase } from "@/lib/supabase"
import { validateEmail } from "@/lib/validation"
import { checkRateLimit, getRemainingTime } from "@/lib/rate-limit"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    honeypot: "", // Spam koruması için
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Hataları temizle
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = () => {
    const allErrors: string[] = []

    // Honeypot kontrolü (spam koruması)
    if (formData.honeypot) {
      allErrors.push("Spam tespit edildi")
      return allErrors
    }

    const emailValidation = validateEmail(formData.email)
    allErrors.push(...emailValidation.errors)

    if (!formData.password) {
      allErrors.push("Şifre gereklidir")
    }

    return allErrors
  }

  const checkUserExists = async (email: string) => {
    try {
      // Kullanıcının profiles tablosunda olup olmadığını kontrol et
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email.trim().toLowerCase())
        .single()

      console.log("Profile check result:", { profile, error })

      return !!profile
    } catch (error) {
      console.error("User existence check error:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Rate limiting kontrolü
    const clientIP = "user-login"
    if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) {
      const remainingTime = Math.ceil(getRemainingTime(clientIP) / 1000 / 60)
      setErrors([`Çok fazla deneme yaptınız. ${remainingTime} dakika sonra tekrar deneyin.`])
      return
    }

    const formErrors = validateForm()
    if (formErrors.length > 0) {
      setErrors(formErrors)
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      console.log("Giriş işlemi başlatılıyor...")

      // Önce kullanıcının var olup olmadığını kontrol et
      const userExists = await checkUserExists(formData.email)

      if (!userExists) {
        setErrors(["Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı. Lütfen kayıt olun."])
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      console.log("Auth Response:", { authData, authError })

      if (authError) {
        console.error("Login error:", authError)
        if (authError.message.includes("Invalid login credentials")) {
          setErrors(["E-posta veya şifre hatalı"])
        } else if (authError.message.includes("Email not confirmed")) {
          setErrors(["E-posta adresinizi doğrulamanız gerekiyor. E-posta kutunuzu kontrol edin."])
        } else if (authError.message.includes("Too many requests")) {
          setErrors(["Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin."])
        } else {
          setErrors(["Giriş yapılırken bir hata oluştu: " + authError.message])
        }
        return
      }

      if (authData.user) {
        console.log("Giriş başarılı:", authData.user.id)
        setSuccess(true)
        setTimeout(() => {
          router.push("/")
        }, 1000)
      }
    } catch (error) {
      console.error("Giriş hatası:", error)
      setErrors(["Beklenmeyen bir hata oluştu"])
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl">
          <CardContent className="p-6 text-center">
            <FiCheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Giriş Başarılı!</h2>
            <p className="text-white/80">Ana sayfaya yönlendiriliyorsunuz...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center p-4 overflow-hidden relative font-inter">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="relative mb-4">
            <FiLogIn className="w-16 h-16 mx-auto text-white animate-float" />
            <div className="absolute inset-0 w-16 h-16 mx-auto bg-white/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Giriş Yap
          </CardTitle>
          <CardDescription className="text-white/80 text-lg">
            Hesabınıza giriş yaparak öğrenmeye devam edin.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {errors.length > 0 && (
            <Alert className="mb-6 bg-red-500/20 border-red-500/30 text-white">
              <FiAlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field - spam koruması */}
            <input
              type="text"
              name="website"
              value={formData.honeypot}
              onChange={(e) => handleInputChange("honeypot", e.target.value)}
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div>
              <Label htmlFor="email" className="text-white/90 mb-2 block">
                E-posta *
              </Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="e-posta@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:ring-2 focus:ring-white/30"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/90 mb-2 block">
                Şifre *
              </Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Şifrenizi girin"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:ring-2 focus:ring-white/30"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          <p className="mt-6 text-center text-white/80">
            Henüz hesabın yok mu?{" "}
            <Link href="/signup" className="text-blue-300 hover:underline font-medium">
              Kayıt Ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
