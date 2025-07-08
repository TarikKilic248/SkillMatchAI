"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BookOpen,
  Clock,
  Target,
  Brain,
  TrendingUp,
  Play,
  CheckCircle,
  Circle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  Users,
  Calendar,
  BookMarked,
} from "lucide-react"

interface UserData {
  learningGoal: string
  dailyTime: string
  duration: string
  learningStyle: string
  targetLevel: string
}

interface Module {
  id: string
  title: string
  description: string
  objectives: string[]
  resources: string[]
  quiz: {
    question: string
    options?: string[]
    type: "multiple" | "open"
  }
  completed: boolean
  unlocked: boolean
  position: { x: number; y: number }
  type: "lesson" | "quiz" | "exam"
}

interface LearningPlan {
  title: string
  modules: Module[]
  weeklyTests: Module[]
}

export default function MicroLearningPlatform() {
  const [currentScreen, setCurrentScreen] = useState<"welcome" | "questions" | "loading" | "dashboard" | "module">(
    "welcome",
  )
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userData, setUserData] = useState<UserData>({
    learningGoal: "",
    dailyTime: "",
    duration: "",
    learningStyle: "",
    targetLevel: "",
  })
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Senin için program oluşturuyoruz...")
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right")
  const [userFeedbacks, setUserFeedbacks] = useState<
    Array<{
      moduleId: string
      feedback: string
      timestamp: string
    }>
  >([])
  const [isAnimating, setIsAnimating] = useState(false)

  const questions = [
    {
      title: "Öğrenme Hedefin",
      subtitle: "Hangi alanda uzmanlaşmak istiyorsun?",
      field: "learningGoal" as keyof UserData,
      type: "input",
      placeholder: "Örnek: Frontend geliştirme uzmanı olmak",
      icon: Target,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Günlük Zaman",
      subtitle: "Öğrenmeye ne kadar zaman ayırabilirsin?",
      field: "dailyTime" as keyof UserData,
      type: "select",
      options: [
        { value: "30min", label: "⏰ 30 dakika", desc: "Kısa ve etkili" },
        { value: "1hour", label: "🕐 1 saat", desc: "Dengeli tempo" },
        { value: "2hours", label: "🕑 2 saat", desc: "Yoğun öğrenme" },
        { value: "3hours", label: "🕒 3+ saat", desc: "Maksimum verim" },
      ],
      icon: Clock,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Eğitim Süresi",
      subtitle: "Hedefinize ne kadar sürede ulaşmak istiyorsun?",
      field: "duration" as keyof UserData,
      type: "select",
      options: [
        { value: "2weeks", label: "🚀 2 hafta", desc: "Hızlı başlangıç" },
        { value: "4weeks", label: "📈 4 hafta", desc: "Optimal süre" },
        { value: "8weeks", label: "🎯 8 hafta", desc: "Derinlemesine" },
        { value: "12weeks", label: "🏆 12 hafta", desc: "Uzman seviye" },
      ],
      icon: Calendar,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Öğrenme Tarzın",
      subtitle: "Hangi yöntemle daha iyi öğreniyorsun?",
      field: "learningStyle" as keyof UserData,
      type: "select",
      options: [
        { value: "visual", label: "👁️ Görsel öğrenme", desc: "Videolar ve grafikler" },
        { value: "practical", label: "🛠️ Uygulamalı öğrenme", desc: "Projeler ve pratik" },
        { value: "reading", label: "📚 Okuyarak öğrenme", desc: "Makaleler ve kitaplar" },
        { value: "mixed", label: "🎭 Karma öğrenme", desc: "Her türlü içerik" },
      ],
      icon: Brain,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Hedef Seviye",
      subtitle: "Hangi seviyeye ulaşmak istiyorsun?",
      field: "targetLevel" as keyof UserData,
      type: "select",
      options: [
        { value: "beginner", label: "🌱 Başlangıç", desc: "Temelden başla" },
        { value: "intermediate", label: "🌿 Orta seviye", desc: "Bilgini geliştir" },
        { value: "advanced", label: "🌳 İleri seviye", desc: "Uzmanlaş" },
        { value: "expert", label: "🏅 Uzman seviye", desc: "Lider ol" },
      ],
      icon: TrendingUp,
      gradient: "from-indigo-500 to-purple-500",
    },
  ]

  const generateLearningPlan = async () => {
    setCurrentScreen("loading")
    setLoadingProgress(0)
    setLoadingText("Senin için program oluşturuyoruz...")

    try {
      const steps = [
        { text: "✨ Senin için program oluşturuyoruz...", progress: 20 },
        { text: "🤖 Gemini bağlantısı kuruluyor...", progress: 40 },
        { text: "🎯 Program oluşturuluyor...", progress: 70 },
        { text: "🎨 Son dokunuşlar yapılıyor...", progress: 90 },
      ]

      let stepIndex = 0
      const loadingInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setLoadingText(steps[stepIndex].text)
          setLoadingProgress(steps[stepIndex].progress)
          stepIndex++
        }
      }, 1000)

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error("Plan oluşturulurken hata oluştu")
      }

      const planData = await response.json()
      clearInterval(loadingInterval)

      setLoadingText("🎉 Tamamlandı!")
      setLoadingProgress(100)

      await new Promise((resolve) => setTimeout(resolve, 500))

      setLearningPlan(planData)
      setCurrentScreen("dashboard")
    } catch (error) {
      console.error("Error generating plan:", error)
      setLoadingText("⚠️ Hata oluştu, varsayılan plan yükleniyor...")

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockPlan: LearningPlan = {
        title: `${userData.learningGoal} - Kişisel Öğrenme Planı`,
        modules: [
          {
            id: "1",
            title: "Temel Kavramlar",
            description: "Konuya giriş ve temel kavramların öğrenilmesi",
            objectives: ["Temel kavramları anlama", "Terminolojiyi öğrenme"],
            resources: ["📹 Video: Giriş dersi", "📄 Makale: Temel kavramlar"],
            quiz: {
              question: "Bu modülde öğrendiğin en önemli kavram neydi?",
              type: "open",
            },
            completed: false,
            unlocked: true,
            position: { x: 50, y: 90 },
            type: "lesson",
          },
          {
            id: "2",
            title: "Pratik Uygulamalar",
            description: "Öğrenilen kavramların pratikte uygulanması",
            objectives: ["Pratik beceriler kazanma", "Uygulama geliştirme"],
            resources: ["💻 Interaktif uygulama", "📝 Kod örnekleri"],
            quiz: {
              question: "Hangi uygulama türü daha faydalı oldu?",
              options: ["Interaktif uygulamalar", "Kod örnekleri", "Video dersler", "Okuma materyalleri"],
              type: "multiple",
            },
            completed: false,
            unlocked: false,
            position: { x: 30, y: 70 },
            type: "lesson",
          },
          {
            id: "quiz1",
            title: "Hafta 1 Quiz",
            description: "İlk haftanın değerlendirmesi",
            objectives: ["Öğrenilenleri test etme"],
            resources: [],
            quiz: {
              question: "Bu hafta hangi konularda zorluk yaşadın?",
              type: "open",
            },
            completed: false,
            unlocked: false,
            position: { x: 70, y: 50 },
            type: "quiz",
          },
          {
            id: "exam1",
            title: "Final Sınavı",
            description: "Tüm öğrenilenlerin kapsamlı değerlendirmesi",
            objectives: ["Genel değerlendirme"],
            resources: [],
            quiz: {
              question: "Bu programı arkadaşlarına tavsiye eder misin?",
              options: ["Kesinlikle evet", "Evet", "Kararsızım", "Hayır"],
              type: "multiple",
            },
            completed: false,
            unlocked: false,
            position: { x: 50, y: 10 },
            type: "exam",
          },
        ],
      }

      setLearningPlan(mockPlan)
      setCurrentScreen("dashboard")
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setIsAnimating(true)
      setSlideDirection("right")
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
        setIsAnimating(false)
      }, 300)
    } else {
      generateLearningPlan()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true)
      setSlideDirection("left")
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1)
        setIsAnimating(false)
      }, 300)
    }
  }

  const handleModuleClick = (module: Module) => {
    if (module.unlocked) {
      setCurrentModule(module)
      setCurrentScreen("module")
    }
  }

  const completeModule = async () => {
    if (currentModule && learningPlan) {
      if (feedback.trim()) {
        const feedbackData = {
          moduleId: currentModule.id,
          feedback: feedback.trim(),
          timestamp: new Date().toISOString(),
        }

        try {
          await fetch("/api/save-feedback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(feedbackData),
          })

          setUserFeedbacks((prev) => [...prev, feedbackData])
        } catch (error) {
          console.error("Feedback kaydedilemedi:", error)
        }
      }

      const updatedModules = learningPlan.modules.map((m) => {
        if (m.id === currentModule.id) {
          return { ...m, completed: true }
        }
        return m
      })

      const currentIndex = updatedModules.findIndex((m) => m.id === currentModule.id)
      if (currentIndex < updatedModules.length - 1) {
        updatedModules[currentIndex + 1].unlocked = true
      }

      setLearningPlan({ ...learningPlan, modules: updatedModules })
      setCurrentScreen("dashboard")
      setCurrentModule(null)
      setFeedback("")
    }
  }

  const regeneratePlan = async () => {
    setShowRegenerateDialog(false)
    setCurrentScreen("loading")
    setLoadingProgress(0)
    setLoadingText("🔄 Geri bildirimleriniz analiz ediliyor...")

    try {
      const completedModuleIds = learningPlan?.modules.filter((m) => m.completed).map((m) => m.id) || []

      const response = await fetch("/api/regenerate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userData,
          feedbacks: userFeedbacks,
          completedModules: completedModuleIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Plan yeniden oluşturulamadı")
      }

      const steps = [
        { text: "🔍 Geri bildirimleriniz analiz ediliyor...", progress: 25 },
        { text: "🤖 Gemini ile plan optimize ediliyor...", progress: 50 },
        { text: "🎯 Yeni modüller oluşturuluyor...", progress: 75 },
        { text: "✨ Plan hazırlanıyor...", progress: 100 },
      ]

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setLoadingText(step.text)
        setLoadingProgress(step.progress)
      }

      const newPlan = await response.json()
      setLearningPlan(newPlan)
      setUserFeedbacks([])
      setCurrentScreen("dashboard")
    } catch (error) {
      console.error("Plan yeniden oluşturulurken hata:", error)
      setLoadingText("⚠️ Hata oluştu, önceki plan geri yükleniyor...")
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentScreen("dashboard")
    }
  }

  const getModuleIcon = (type: string, completed: boolean, unlocked: boolean) => {
    if (completed) return <CheckCircle className="w-6 h-6 text-emerald-400" />
    if (!unlocked) return <Circle className="w-6 h-6 text-slate-400" />

    switch (type) {
      case "quiz":
        return <Brain className="w-6 h-6 text-violet-400" />
      case "exam":
        return <Award className="w-6 h-6 text-amber-400" />
      default:
        return <BookOpen className="w-6 h-6 text-sky-400" />
    }
  }

  const getModuleGradient = (type: string, completed: boolean, unlocked: boolean) => {
    if (completed) return "from-emerald-500 to-teal-500"
    if (!unlocked) return "from-slate-400 to-slate-500"

    switch (type) {
      case "quiz":
        return "from-violet-500 to-purple-500"
      case "exam":
        return "from-amber-500 to-orange-500"
      default:
        return "from-sky-500 to-blue-500"
    }
  }

  if (currentScreen === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
          <CardContent className="p-10 text-center">
            <div className="mb-8">
              <div className="relative mb-6">
                <Sparkles className="w-20 h-20 mx-auto text-yellow-300 animate-bounce" />
                <div className="absolute inset-0 w-20 h-20 mx-auto bg-yellow-300/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                Hoş Geldin!
              </h1>
              <p className="text-white/80 text-lg leading-relaxed">
                Kişiselleştirilmiş öğrenme yolculuğuna başlamaya hazır mısın? AI destekli planınızı oluşturalım.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2 text-white/70">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>AI destekli kişiselleştirme</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white/70">
                <Target className="w-5 h-5 text-green-400" />
                <span>Hedef odaklı modüller</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-white/70">
                <Users className="w-5 h-5 text-blue-400" />
                <span>İnteraktif öğrenme deneyimi</span>
              </div>
            </div>

            <Button
              onClick={() => setCurrentScreen("questions")}
              className="w-full bg-gradient-to-r from-white/20 to-white/30 hover:from-white/30 hover:to-white/40 text-white border-white/30 text-lg py-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              size="lg"
            >
              Başlayalım
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentScreen === "questions") {
    const currentQ = questions[currentQuestion]
    const IconComponent = currentQ.icon

    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${currentQ.gradient} flex items-center justify-center p-4 overflow-hidden relative`}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-delayed"></div>
          <div className="absolute top-1/2 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float-slow"></div>
        </div>

        <div className="w-full max-w-lg relative z-10">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/80 text-sm font-medium">İlerleme</span>
              <span className="text-white/80 text-sm font-medium">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="relative">
              <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-3 bg-white/20" />
              <div
                className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/60 rounded-full h-3 transition-all duration-500"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <Card
            className={`bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl transition-all duration-500 ${
              isAnimating
                ? slideDirection === "right"
                  ? "translate-x-full opacity-0"
                  : "-translate-x-full opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="relative mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${currentQ.gradient} p-4 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 mx-auto bg-white/20 rounded-2xl blur-xl"></div>
                </div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {currentQ.title}
                </h2>
                <p className="text-white/80 text-lg">{currentQ.subtitle}</p>
              </div>

              <div className="space-y-4">
                {currentQ.type === "input" ? (
                  <div className="relative">
                    <Input
                      placeholder={currentQ.placeholder}
                      value={userData[currentQ.field]}
                      onChange={(e) => setUserData({ ...userData, [currentQ.field]: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-14 text-lg rounded-xl focus:ring-2 focus:ring-white/30 transition-all duration-300"
                    />
                  </div>
                ) : (
                  <Select
                    value={userData[currentQ.field]}
                    onValueChange={(value) => setUserData({ ...userData, [currentQ.field]: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-14 text-lg rounded-xl focus:ring-2 focus:ring-white/30">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20">
                      {currentQ.options?.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-slate-800 hover:bg-white/50"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            {option.desc && <span className="text-sm text-slate-600">{option.desc}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex justify-between mt-10">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!userData[currentQ.field]}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {currentQuestion === questions.length - 1 ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Planı Oluştur
                    </>
                  ) : (
                    <>
                      İleri
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentScreen === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
          <CardContent className="p-10 text-center">
            <div className="mb-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-yellow-300 border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300/20 to-orange-300/20 animate-pulse"></div>
              </div>
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                {loadingText}
              </h2>
              <div className="relative">
                <Progress value={loadingProgress} className="h-3 bg-white/20" />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-3 transition-all duration-1000"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-white/60 text-sm mt-3 font-medium">{loadingProgress}%</p>
            </div>

            <div className="space-y-3 text-white/70 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>AI analiz yapıyor</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-300"></div>
                <span>Kişisel plan oluşturuluyor</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-700"></div>
                <span>Modüller hazırlanıyor</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentScreen === "dashboard" && learningPlan) {
    const completedCount = learningPlan.modules.filter((m) => m.completed).length
    const totalCount = learningPlan.modules.length
    const progressPercentage = (completedCount / totalCount) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 p-4 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float-slow"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
              {learningPlan.title}
            </h1>

            {/* Progress Stats */}
            <div className="flex justify-center items-center space-x-8 mb-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{completedCount}</div>
                <div className="text-white/70 text-sm">Tamamlanan</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{totalCount - completedCount}</div>
                <div className="text-white/70 text-sm">Kalan</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{Math.round(progressPercentage)}%</div>
                <div className="text-white/70 text-sm">İlerleme</div>
              </div>
            </div>

            <Button
              onClick={() => setShowRegenerateDialog(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Planı Yeniden Oluştur
            </Button>
          </div>

          {/* Learning Tree */}
          <div className="relative h-[500px] bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
            <svg className="absolute inset-0 w-full h-full">
              {/* Tree connections with enhanced styling */}
              {learningPlan.modules.map((module, index) => {
                if (index < learningPlan.modules.length - 1) {
                  const nextModule = learningPlan.modules[index + 1]
                  return (
                    <line
                      key={`line-${module.id}`}
                      x1={`${module.position.x}%`}
                      y1={`${module.position.y}%`}
                      x2={`${nextModule.position.x}%`}
                      y2={`${nextModule.position.y}%`}
                      stroke={module.completed ? "rgba(16, 185, 129, 0.6)" : "rgba(255,255,255,0.3)"}
                      strokeWidth="3"
                      strokeDasharray={module.completed ? "0" : "8,4"}
                      className="transition-all duration-500"
                    />
                  )
                }
                return null
              })}
            </svg>

            {/* Enhanced Modules */}
            {learningPlan.modules.map((module) => (
              <div
                key={module.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ${
                  module.unlocked ? "hover:scale-110 hover:-translate-y-2" : "opacity-60"
                }`}
                style={{ left: `${module.position.x}%`, top: `${module.position.y}%` }}
                onClick={() => handleModuleClick(module)}
              >
                <div className="relative group">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getModuleGradient(module.type, module.completed, module.unlocked)} backdrop-blur-sm border-2 border-white/30 shadow-xl transition-all duration-300 ${
                      module.unlocked ? "group-hover:shadow-2xl group-hover:border-white/50" : ""
                    }`}
                  >
                    {getModuleIcon(module.type, module.completed, module.unlocked)}
                  </div>

                  {/* Glow effect */}
                  <div
                    className={`absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${getModuleGradient(module.type, module.completed, module.unlocked)} opacity-20 blur-xl transition-all duration-300 ${
                      module.unlocked ? "group-hover:opacity-40" : ""
                    }`}
                  ></div>

                  {/* Completion indicator */}
                  {module.completed && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <p className="text-white text-sm font-semibold max-w-24 truncate">{module.title}</p>
                  <Badge
                    variant="secondary"
                    className={`text-xs mt-1 px-2 py-1 rounded-full ${
                      module.type === "quiz"
                        ? "bg-violet-500/20 text-violet-200 border border-violet-400/30"
                        : module.type === "exam"
                          ? "bg-amber-500/20 text-amber-200 border border-amber-400/30"
                          : "bg-sky-500/20 text-sky-200 border border-sky-400/30"
                    }`}
                  >
                    {module.type === "quiz" ? "🧠 Quiz" : module.type === "exam" ? "🏆 Sınav" : "📚 Ders"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
          <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-white/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-800">Planı Yeniden Oluştur</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                Bu işlem mevcut ilerlemenizi silecek ve yeni bir plan oluşturacak. Devam etmek istediğinizden emin
                misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-800">İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={regeneratePlan}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                Evet, Yeniden Oluştur
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  if (currentScreen === "module" && currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 p-4 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl">
            <CardContent className="p-10">
              {/* Module Header */}
              <div className="text-center mb-10">
                <div className="relative mb-6">
                  <div
                    className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${getModuleGradient(currentModule.type, false, true)} p-5 shadow-xl`}
                  >
                    {getModuleIcon(currentModule.type, false, true)}
                  </div>
                  <div className="absolute inset-0 w-20 h-20 mx-auto bg-white/20 rounded-3xl blur-xl"></div>
                </div>
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                  {currentModule.title}
                </h1>
                <p className="text-white/80 text-lg leading-relaxed max-w-2xl mx-auto">{currentModule.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-10">
                {/* Objectives */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-400" />
                    Hedef Kazanımlar
                  </h3>
                  <ul className="space-y-3">
                    {currentModule.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/90">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources */}
                {currentModule.resources.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <BookMarked className="w-5 h-5 mr-2 text-blue-400" />
                      Kaynaklar
                    </h3>
                    <ul className="space-y-3">
                      {currentModule.resources.map((resource, index) => (
                        <li key={index} className="flex items-start">
                          <Play className="w-5 h-5 mr-3 text-sky-400 flex-shrink-0 mt-0.5" />
                          <span className="text-white/90">{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Assessment */}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-violet-400" />
                  Değerlendirme
                </h3>
                <div className="bg-white/5 rounded-xl p-6">
                  <p className="mb-6 text-lg text-white/90">{currentModule.quiz.question}</p>
                  {currentModule.quiz.type === "multiple" && currentModule.quiz.options ? (
                    <div className="grid gap-3">
                      {currentModule.quiz.options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20 p-4 h-auto text-left rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                        >
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-3 text-sm font-semibold">
                              {String.fromCharCode(65 + index)}
                            </div>
                            {option}
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Düşüncelerinizi ve deneyimlerinizi paylaşın..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-32 rounded-xl focus:ring-2 focus:ring-white/30 transition-all duration-300"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentScreen("dashboard")}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri Dön
                </Button>
                <Button
                  onClick={completeModule}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tamamla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
