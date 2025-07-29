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
import { FiUserPlus, FiMail, FiLock, FiUser, FiAlertCircle, FiCheckCircle } from "react-icons/fi"
import { supabase } from "@/lib/supabase"
import { validateFullName, validateEmail, validatePassword, validatePasswordConfirmation } from "@/lib/validation"
import { checkRateLimit, getRemainingTime } from "@/lib/rate-limit"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    const nameValidation = validateFullName(formData.fullName)
    const emailValidation = validateEmail(formData.email)
    const passwordValidation = validatePassword(formData.password)
    const confirmPasswordValidation = validatePasswordConfirmation(formData.password, formData.confirmPassword)

    allErrors.push(...nameValidation.errors)
    allErrors.push(...emailValidation.errors)
    allErrors.push(...passwordValidation.errors)
    allErrors.push(...confirmPasswordValidation.errors)

    return allErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Rate limiting kontrolü
    const clientIP = "user-signup" // Gerçek uygulamada IP adresi kullanılabilir
    if (!checkRateLimit(clientIP, 3, 15 * 60 * 1000)) {
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
      console.log("Starting signup process...")
      console.log("Form data:", {
        fullName: formData.fullName,
        email: formData.email,
        passwordLength: formData.password.length,
      })

      // Supabase Auth ile kullanıcı oluştur - metadata ile birlikte
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      })

      console.log("Auth response:", { authData, authError })

      if (authError) {
        console.error("Auth error:", authError)
        if (authError.message.includes("already registered")) {
          setErrors(["Bu e-posta adresi zaten kayıtlı"])
        } else if (authError.message.includes("Password")) {
          setErrors(["Şifre gereksinimleri karşılanmıyor"])
        } else if (authError.message.includes("Email")) {
          setErrors(["E-posta adresi geçersiz"])
        } else {
          setErrors(["Kayıt olurken bir hata oluştu: " + authError.message])
        }
        return
      }

      if (authData.user) {
        console.log("User created successfully:", authData.user.id)

        // Kısa bir bekleme süresi - trigger'ın çalışması için
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Manuel olarak profil oluştur (trigger çalışmazsa)
        try {
          console.log("Attempting to create profile manually...")

          const profileData = {
            id: authData.user.id,
            full_name: formData.fullName.trim(),
            email: formData.email.trim().toLowerCase(),
          }

          console.log("Profile data to insert:", profileData)

          const { data: profileResult, error: profileError } = await supabase
            .from("profiles")
            .insert(profileData)
            .select()

          console.log("Profile creation result:", { profileResult, profileError })

          if (profileError) {
            console.error("Profile creation error:", profileError)

            // Eğer profil zaten varsa (trigger çalıştıysa) hata verme
            if (!profileError.message.includes("duplicate key")) {
              setErrors([`Profil oluşturulamadı: ${profileError.message}`])
              return
            } else {
              console.log("Profile already exists (trigger worked)")
            }
          } else {
            console.log("Profile created successfully via manual insert")
          }
        } catch (profileErr) {
          console.error("Profile creation failed:", profileErr)
          setErrors(["Profil oluşturulurken bir hata oluştu"])
          return
        }

        console.log("Signup process completed successfully")
        setSuccess(true)

        setTimeout(() => {
          // Kayıt başarılı, ana sayfaya yönlendir
          router.push("/")
        }, 2000)
      } else {
        console.error("No user returned from signup")
        setErrors(["Kullanıcı oluşturulamadı"])
      }
    } catch (error) {
      console.error("Signup process error:", error)
      setErrors(["Beklenmeyen bir hata oluştu: " + (error as Error).message])
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl">
          <CardContent className="p-6 text-center">
            <FiCheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Kayıt Başarılı!</h2>
            <p className="text-white/80">Ana sayfaya yönlendiriliyorsunuz...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4 overflow-hidden relative font-inter">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="relative mb-4">
            <FiUserPlus className="w-16 h-16 mx-auto text-white animate-float" />
            <div className="absolute inset-0 w-16 h-16 mx-auto bg-white/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Kayıt Ol
          </CardTitle>
          <CardDescription className="text-white/80 text-lg">
            Yeni bir hesap oluşturarak öğrenmeye başla.
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
              <Label htmlFor="fullName" className="text-white/90 mb-2 block">
                Ad Soyad *
              </Label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:ring-2 focus:ring-white/30"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

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
                  placeholder="En az 8 karakter, büyük/küçük harf, rakam"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:ring-2 focus:ring-white/30"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-white/90 mb-2 block">
                Şifre Doğrulama *
              </Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
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
              {isLoading ? "Kayıt Olunuyor..." : "Kayıt Ol"}
            </Button>
          </form>

          <p className="mt-6 text-center text-white/80">
            Zaten bir hesabın var mı?{" "}
            <Link href="/login" className="text-blue-300 hover:underline font-medium">
              Giriş Yap
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
