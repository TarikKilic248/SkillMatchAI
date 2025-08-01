"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  FiBookOpen,
  FiClock,
  FiTarget,
  FiTrendingUp,
  FiPlay,
  FiCheckCircle,
  FiCircle,
  FiRotateCcw,
  FiArrowRight,
  FiArrowLeft,
  FiStar,
  FiAward,
  FiCalendar,
  FiBookmark,
  FiLogIn,
  FiUserPlus,
  FiUsers,
  FiEye,
  FiFileText,
  FiVideo,
  FiHeadphones,
  FiPlus,
} from "react-icons/fi"
import { FaBrain } from "react-icons/fa"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface UserData {
  learningGoal: string
  dailyTime: string
  duration: string
  learningStyle: string
  targetLevel: string
}

interface ContentPage {
  id: string
  title: string
  type: "text" | "video" | "audio" | "interactive"
  content: string
  duration: number // minutes
}

interface Module {
  id: string
  title: string
  description: string
  objectives: string[]
  resources: string[]
  contentPages: ContentPage[]
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
  id?: string
  title: string
  modules: Module[]
  learningGoal?: string
  dailyTime?: string
  duration?: string
  learningStyle?: string
  targetLevel?: string
}

export default function MicroLearningPlatform() {
  const { user, signOut, loading: authLoading } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<
    "welcome" | "questions" | "loading" | "dashboard" | "module" | "module-content" | "module-test" | "module-complete"
  >("loading") // Başlangıçta genel bir yükleme durumu
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
  const [moduleProgress, setModuleProgress] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [currentContentPage, setCurrentContentPage] = useState(0)
  const [viewedContentPages, setViewedContentPages] = useState<Set<number>>(new Set())
  const [hasAttemptedPlanLoad, setHasAttemptedPlanLoad] = useState(false) // Plan yükleme denemesi yapıldı mı?
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      // Sadece kimlik doğrulama durumu bilindiğinde devam et
      if (user) {
        // Kullanıcı giriş yapmış, planı yüklemeye çalış
        loadUserPlans()
      } else {
        // Kullanıcı yok, hoş geldin ekranına git
        setCurrentScreen("welcome")
        setHasAttemptedPlanLoad(true) // Giriş yapmamış kullanıcı için kontrol tamamlandı
      }
    }
  }, [user, authLoading]) // user ve authLoading değiştiğinde tetikle

  const getNumericId = (id: string) => {
    const match = id.match(/\d+/)
    return match ? Number.parseInt(match[0]) : 0
  }

  const loadUserPlans = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setCurrentScreen("welcome")
        return
      }

      const response = await fetch("/api/get-user-plans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const { plans } = await response.json()
        if (plans && plans.length > 0) {
          const activePlan = plans[0] // En son aktif planı al

          // Modüllere örnek içerik sayfaları ekle (varsa mevcutları koru) ve sırala
          const updatedPlan = {
            ...activePlan,
            modules: activePlan.modules
              .map((module: Module) => ({
                ...module,
                contentPages: module.contentPages || [
                  {
                    id: "content-1",
                    title: "Giriş ve Temel Kavramlar",
                    type: "text",
                    content:
                      "Bu modülde öğreneceğiniz temel kavramları ve konuları tanıyacaksınız. İlk olarak konunun genel çerçevesini çizerek başlayacağız.",
                    duration: 5,
                  },
                  {
                    id: "content-2",
                    title: "Detaylı Açıklamalar",
                    type: "video",
                    content:
                      "Konunun detaylarına inerek, pratik örnekler üzerinden açıklamalar yapacağız. Bu bölümde teorik bilgileri pratiğe dökmeyi öğreneceksiniz.",
                    duration: 8,
                  },
                  {
                    id: "content-3",
                    title: "Uygulamalı Örnekler",
                    type: "interactive",
                    content:
                      "Gerçek hayat örnekleri ile konuyu pekiştireceğiz. İnteraktif alıştırmalar ile öğrendiklerinizi test edebileceksiniz.",
                    duration: 10,
                  },
                  {
                    id: "content-4",
                    title: "Özet ve Değerlendirme",
                    type: "audio",
                    content:
                      "Modülün özetini yaparak önemli noktaları tekrar edeceğiz. Öğrendiklerinizi değerlendirme fırsatı bulacaksınız.",
                    duration: 6,
                  },
                ],
              }))
              .sort((a: Module, b: Module) => getNumericId(a.id) - getNumericId(b.id)), // Modülleri id'ye göre sırala
          }

          setLearningPlan(updatedPlan)
          setUserData({
            learningGoal: activePlan.learningGoal,
            dailyTime: activePlan.dailyTime,
            duration: activePlan.duration,
            learningStyle: activePlan.learningStyle,
            targetLevel: activePlan.targetLevel,
          })
          setCurrentScreen("dashboard")
        } else {
          // Plan bulunamadı veya tüm modüller tamamlanmış, sorulara git
          setCurrentScreen("questions")
        }
      } else {
        // Plan yüklenirken hata oluştu, sorulara yönlendir
        console.error("Plan yükleme hatası:", response.statusText)
        setCurrentScreen("questions")
      }
    } catch (error) {
      console.error("Plan yükleme hatası:", error)
      setCurrentScreen("questions") // Hata durumunda sorulara yönlendir
    } finally {
      setHasAttemptedPlanLoad(true) // Plan yükleme denemesi tamamlandı
    }
  }

  const questions = [
    {
      title: "Öğrenme Hedefin",
      subtitle: "Hangi alanda uzmanlaşmak istiyorsun?",
      field: "learningGoal" as keyof UserData,
      type: "input",
      placeholder: "Örnek: Frontend geliştirme uzmanı olmak",
      icon: FiTarget,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Günlük Zaman",
      subtitle: "Öğrenmeye ne kadar zaman ayırabilirsin?",
      field: "dailyTime" as keyof UserData,
      type: "select",
      options: [
        { value: "30min", label: "30 dakika", desc: "Kısa ve etkili" },
        { value: "1hour", label: "1 saat", desc: "Dengeli tempo" },
        { value: "2hours", label: "2 saat", desc: "Yoğun öğrenme" },
        { value: "3hours", label: "3+ saat", desc: "Maksimum verim" },
      ],
      icon: FiClock,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Eğitim Süresi",
      subtitle: "Hedefinize ne kadar sürede ulaşmak istiyorsun?",
      field: "duration" as keyof UserData,
      type: "select",
      options: [
        { value: "2weeks", label: "2 hafta", desc: "Hızlı başlangıç" },
        { value: "4weeks", label: "4 hafta", desc: "Optimal süre" },
        { value: "8weeks", label: "8 hafta", desc: "Derinlemesine" },
        { value: "12weeks", label: "12 hafta", desc: "Uzman seviye" },
      ],
      icon: FiCalendar,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Öğrenme Tarzın",
      subtitle: "Hangi yöntemle daha iyi öğreniyorsun?",
      field: "learningStyle" as keyof UserData,
      type: "select",
      options: [
        { value: "visual", label: "Görsel öğrenme", desc: "Videolar ve grafikler" },
        { value: "practical", label: "Uygulamalı öğrenme", desc: "Projeler ve pratik" },
        { value: "reading", label: "Okuyarak öğrenme", desc: "Makaleler ve kitaplar" },
        { value: "mixed", label: "Karma öğrenme", desc: "Her türlü içerik" },
      ],
      icon: FaBrain,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Hedef Seviye",
      subtitle: "Hangi seviyeye ulaşmak istiyorsun?",
      field: "targetLevel" as keyof UserData,
      type: "select",
      options: [
        { value: "beginner", label: "Başlangıç", desc: "Temelden başla" },
        { value: "intermediate", label: "Orta seviye", desc: "Bilgini geliştir" },
        { value: "advanced", label: "İleri seviye", desc: "Uzmanlaş" },
        { value: "expert", label: "Uzman seviye", desc: "Lider ol" },
      ],
      icon: FiTrendingUp,
      gradient: "from-indigo-500 to-purple-500",
    },
  ]

  const generateLearningPlan = async () => {
    setCurrentScreen("loading")
    setLoadingProgress(0)
    setLoadingText("Senin için program oluşturuyoruz...")

    try {
      const steps = [
        { text: "Senin için program oluşturuyoruz...", progress: 15 },
        { text: "Gemini bağlantısı kuruluyor...", progress: 30 },
        { text: "Öğrenme hedeflerin analiz ediliyor...", progress: 45 },
        { text: "Kişiselleştirilmiş modüller hazırlanıyor...", progress: 60 },
        { text: "İçerik yapısı oluşturuluyor...", progress: 75 },
        { text: "Veritabanına kaydediliyor...", progress: 90 },
      ]

      let stepIndex = 0
      const loadingInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setLoadingText(steps[stepIndex].text)
          setLoadingProgress(steps[stepIndex].progress)
          stepIndex++
        }
      }, 800)

      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("Kullanıcı oturumu bulunamadı")
      }

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userData }),
      })

      if (!response.ok) {
        throw new Error("Plan oluşturulurken hata oluştu")
      }

      const planData = await response.json()
      clearInterval(loadingInterval)

      setLoadingText("Tamamlandı!")
      setLoadingProgress(100)

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Modülleri id'ye göre sırala
      const sortedModules = planData.modules.sort((a: Module, b: Module) => getNumericId(a.id) - getNumericId(b.id))
      setLearningPlan({ ...planData, modules: sortedModules })
      setCurrentScreen("dashboard")
    } catch (error) {
      console.error("Error generating plan:", error)
      setLoadingText("Hata oluştu, lütfen tekrar deneyin...")

      await new Promise((resolve) => setTimeout(resolve, 2000))
      setCurrentScreen("questions")
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
    if (module.unlocked || module.completed) {
      setCurrentModule(module)
      setCurrentContentPage(0)
      setViewedContentPages(new Set([0]))
      setModuleProgress(0)
      setCurrentScreen("module-content")
    }
  }

  const handleContentNext = () => {
    if (currentModule && currentContentPage < currentModule.contentPages.length - 1) {
      const nextPage = currentContentPage + 1
      setCurrentContentPage(nextPage)
      setViewedContentPages((prev) => new Set([...prev, nextPage]))

      // Update progress based on viewed pages
      const totalPages = currentModule.contentPages.length
      const viewedCount = viewedContentPages.size + 1 // +1 for current page
      const progress = (viewedCount / totalPages) * 100
      setModuleProgress(progress)
    } else {
      // All content viewed, go to test
      setCurrentScreen("module-test")
    }
  }

  const handleContentPrevious = () => {
    if (currentContentPage > 0) {
      setCurrentContentPage(currentContentPage - 1)
    }
  }

  const startModuleTest = () => {
    setCurrentScreen("module-test")
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const submitTest = () => {
    // Simulate test evaluation
    const isCorrect = Math.random() > 0.5 // Random for demo
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1)
    } else {
      setWrongAnswers((prev) => prev + 1)
    }
    setCurrentScreen("module-complete")
  }

  const completeModule = async () => {
    if (currentModule && learningPlan) {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) return

        // Save feedback if provided
        if (feedback.trim()) {
          await fetch("/api/save-feedback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              moduleId: currentModule.id,
              feedback: feedback.trim(),
            }),
          })
        }

        // Update module completion status
        await fetch("/api/update-module", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            moduleId: currentModule.id,
            completed: true,
            unlockNext: true,
          }),
        })

        // Update local state
        const updatedModules = learningPlan.modules.map((m) => {
          if (m.id === currentModule.id) {
            return { ...m, completed: true }
          }
          return m
        })

        // Find current module index and unlock next
        const currentIndex = updatedModules.findIndex((m) => m.id === currentModule.id)
        if (currentIndex < updatedModules.length - 1) {
          updatedModules[currentIndex + 1].unlocked = true
        }

        // Check if all modules are completed
        const allModulesCompleted = updatedModules.every((m) => m.completed)

        setLearningPlan({ ...learningPlan, modules: updatedModules })
        setCurrentScreen("dashboard")
        setCurrentModule(null)
        setFeedback("")
        setCorrectAnswers(0)
        setWrongAnswers(0)
        setSelectedAnswer("")
        setCurrentContentPage(0)
        setViewedContentPages(new Set())
        setModuleProgress(0)

        // If all modules are completed, show completion message
        if (allModulesCompleted) {
          // Plan tamamlandı, kullanıcı dashboard'da tamamlama mesajını görecek
          console.log("Tüm modüller tamamlandı!")
        }
      } catch (error) {
        console.error("Modül tamamlama hatası:", error)
      }
    }
  }

  const regeneratePlan = async () => {
    setShowRegenerateDialog(false)
    
    // Deactivate current plan if it exists
    if (learningPlan?.id) {
      try {
        const token = localStorage.getItem("access_token")
        if (token) {
          await fetch("/api/deactivate-plan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              planId: learningPlan.id,
            }),
          })
        }
      } catch (error) {
        console.error("Plan deactivation error:", error)
      }
    }
    
    setCurrentScreen("questions")
    setCurrentQuestion(0)
  }

  const getModuleIcon = (type: string, completed: boolean, unlocked: boolean) => {
    if (completed) return <FiCheckCircle className="w-6 h-6 text-emerald-400" />
    if (!unlocked) return <FiCircle className="w-6 h-6 text-slate-400" />

    switch (type) {
      case "quiz":
        return <FaBrain className="w-6 h-6 text-violet-400" />
      case "exam":
        return <FiAward className="w-6 h-6 text-amber-400" />
      default:
        return <FiBookOpen className="w-6 h-6 text-sky-400" />
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <FiVideo className="w-5 h-5" />
      case "audio":
        return <FiHeadphones className="w-5 h-5" />
      case "interactive":
        return <FiPlay className="w-5 h-5" />
      default:
        return <FiFileText className="w-5 h-5" />
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "Video İçerik"
      case "audio":
        return "Ses İçeriği"
      case "interactive":
        return "İnteraktif İçerik"
      default:
        return "Metin İçeriği"
    }
  }

  // Genel yükleme ekranı
  if (currentScreen === "loading" && !hasAttemptedPlanLoad) {
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

  if (currentScreen === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 overflow-hidden relative font-inter">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
          <CardHeader className="text-center">
            <div className="relative mb-6">
              <FiBookOpen className="w-20 h-20 mx-auto text-white animate-float" />
              <div className="absolute inset-0 w-20 h-20 mx-auto bg-white/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
              Mikro Öğrenme Platformu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Özellikler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <FiTarget className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                <h3 className="font-semibold mb-1">Hedef Odaklı</h3>
                <p className="text-sm text-white/70">Kişisel hedeflerinize uygun planlar</p>
              </div>
              <div className="text-center">
                <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-green-300" />
                <h3 className="font-semibold mb-1">İlerleme Takibi</h3>
                <p className="text-sm text-white/70">Gelişiminizi görsel olarak takip edin</p>
              </div>
              <div className="text-center">
                <FiUsers className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                <h3 className="font-semibold mb-1">Topluluk</h3>
                <p className="text-sm text-white/70">Diğer öğrencilerle etkileşim kurun</p>
              </div>
            </div>

            {/* Giriş Butonları */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/signup")}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                size="lg"
              >
                <FiUserPlus className="w-5 h-5 mr-2" />
                Kayıt Ol
              </Button>
              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                size="lg"
              >
                <FiLogIn className="w-5 h-5 mr-2" />
                Giriş Yap
              </Button>
            </div>

            <p className="text-center text-white/60 text-sm mt-6">
              Ücretsiz hesap oluşturun ve öğrenmeye hemen başlayın
            </p>
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
        className={`min-h-screen bg-gradient-to-br ${currentQ.gradient} flex items-center justify-center p-4 overflow-hidden relative font-inter`}
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
            <div className="relative bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-white/60 to-white/80 rounded-full h-3 transition-all duration-500 ease-out"
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
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${currentQ.gradient} p-4 shadow-lg transition-all duration-300`}
                  >
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
                      className="input-modern text-white placeholder:text-white/50 h-14 text-lg"
                    />
                  </div>
                ) : (
                  <Select
                    value={userData[currentQ.field]}
                    onValueChange={(value) => setUserData({ ...userData, [currentQ.field]: value })}
                  >
                    <SelectTrigger className="input-modern text-white h-14 text-lg">
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
                  variant="outline-modern" // Yeni varyantı kullan
                  className="px-6 py-3 rounded-xl disabled:opacity-50"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!userData[currentQ.field]}
                  variant="modern" // Yeni varyantı kullan
                  className="px-6 py-3 rounded-xl disabled:opacity-50 disabled:hover:scale-100"
                >
                  {currentQuestion === questions.length - 1 ? (
                    <>
                      <FiStar className="w-4 h-4 mr-2" />
                      Planı Oluştur
                    </>
                  ) : (
                    <>
                      İleri
                      <FiArrowRight className="w-4 h-4 ml-2" />
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 overflow-hidden relative font-inter">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl relative z-10">
          <CardContent className="p-10 text-center">
            <div className="mb-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="spinner-modern"></div> {/* Modern spinner sınıfı */}
              </div>
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                {loadingText}
              </h2>
              <div className="relative bg-white/20 rounded-full h-4 overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-4 transition-all duration-1000 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-white/60 text-sm mt-3 font-medium">{loadingProgress}%</p>
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

    // Modüller zaten setLearningPlan içinde sıralanmış olduğu için burada tekrar sıralamaya gerek yok.
    const sequentialModules = learningPlan.modules

    // Find current active module (first unlocked but not completed)
    const currentActiveModule = sequentialModules.find((m) => m.unlocked && !m.completed)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiBookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Mikro Öğrenme</h1>
                  <p className="text-sm text-slate-500">Kişisel gelişim platformu</p>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{user?.full_name || "Kullanıcı"}</p>
                  <p className="text-xs text-slate-500">Öğrenci</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">{user?.full_name?.charAt(0) || "U"}</span>
                </div>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  <FiLogIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Hoş geldin, {user?.full_name?.split(" ")[0] || "Öğrenci"}! 👋
            </h2>
            <p className="text-slate-600 text-lg">{learningPlan.title}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Toplam Modül</p>
                  <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiBookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Kalan</p>
                  <p className="text-2xl font-bold text-amber-600">{totalCount - completedCount}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">İlerleme</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(progressPercentage)}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Genel İlerleme</h3>
              <Button
                onClick={() => setShowRegenerateDialog(true)}
                variant="outline-modern" // Yeni varyantı kullan
                size="sm"
                className="px-4 py-2"
              >
                <FiRotateCcw className="w-4 h-4 mr-2" />
                Yeni Plan
              </Button>
            </div>
            <div className="relative">
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {completedCount} / {totalCount} modül tamamlandı
              </p>
            </div>
          </div>

          {/* Completion Message */}
          {completedCount === totalCount && totalCount > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <FiAward className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                    Tebrikler! 🎉
                  </h3>
                  <p className="text-emerald-700 mb-4">
                    Tüm modülleri başarıyla tamamladınız. Yeni bir öğrenme yolculuğuna başlamak ister misiniz?
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={async () => {
                        if (learningPlan?.id) {
                          try {
                            const token = localStorage.getItem("access_token")
                            if (token) {
                              await fetch("/api/deactivate-plan", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  planId: learningPlan.id,
                                }),
                              })
                            }
                          } catch (error) {
                            console.error("Plan deactivation error:", error)
                          }
                        }
                        setShowRegenerateDialog(true)
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Yeni Plan Oluştur
                    </Button>
                    <Button
                      onClick={async () => {
                        if (learningPlan?.id) {
                          try {
                            const token = localStorage.getItem("access_token")
                            if (token) {
                              await fetch("/api/deactivate-plan", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  planId: learningPlan.id,
                                }),
                              })
                            }
                          } catch (error) {
                            console.error("Plan deactivation error:", error)
                          }
                        }
                        setCurrentScreen("questions")
                      }}
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <FiRotateCcw className="w-4 h-4 mr-2" />
                      Farklı Hedef Belirle
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modules Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-800">Öğrenme Modülleri</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>Tamamlandı</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Aktif</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                  <span>Kilitli</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {sequentialModules.map((module, index) => {
                const isActive = currentActiveModule?.id === module.id
                const isLocked = !module.unlocked
                const isCompleted = module.completed
                const canReopen = module.completed // Tamamlanan modüller tekrar açılabilir

                return (
                  <div
                    key={module.id}
                    className={`group relative bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 cursor-pointer ${
                      isCompleted
                        ? "border-emerald-200 hover:border-emerald-300 hover:shadow-md"
                        : isActive
                          ? "border-blue-200 hover:border-blue-300 hover:shadow-md ring-2 ring-blue-100"
                          : isLocked
                            ? "border-slate-200 opacity-60 cursor-not-allowed"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                    onClick={() => (module.unlocked || canReopen) && handleModuleClick(module)}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Module Number & Status */}
                      <div className="relative">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                              : isActive
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                : isLocked
                                  ? "bg-slate-200 text-slate-400"
                                  : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          {isCompleted ? (
                            <FiCheckCircle className="w-6 h-6" />
                          ) : isLocked ? (
                            <FiCircle className="w-6 h-6" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>

                      {/* Module Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-lg font-semibold text-slate-800 truncate">{module.title}</h4>
                          <Badge
                            variant="secondary"
                            className={`badge-modern ${
                              // badge-modern sınıfını kullan
                              module.type === "quiz"
                                ? "bg-purple-500 text-white" // Doğrudan renkleri kullan
                                : module.type === "exam"
                                  ? "bg-amber-500 text-white"
                                  : "bg-blue-500 text-white"
                            }`}
                          >
                            {module.type === "quiz" ? "Quiz" : module.type === "exam" ? "Sınav" : "Ders"}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-2">{module.description}</p>

                        {/* Status Text */}
                        <div className="flex items-center space-x-4 text-sm">
                          {isCompleted && (
                            <div className="flex items-center space-x-1 text-emerald-600">
                              <FiCheckCircle className="w-4 h-4" />
                              <span className="font-medium">Tamamlandı - Tekrar Aç</span>
                            </div>
                          )}
                          {isActive && (
                            <div className="flex items-center space-x-1 text-blue-600">
                              <FiPlay className="w-4 h-4" />
                              <span className="font-medium">Devam Et</span>
                            </div>
                          )}
                          {isLocked && (
                            <div className="flex items-center space-x-1 text-slate-400">
                              <FiCircle className="w-4 h-4" />
                              <span>Kilitli</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Arrow */}
                      <div className="flex-shrink-0">
                        {(module.unlocked || canReopen) && (
                          <FiArrowRight
                            className={`w-5 h-5 transition-all duration-300 group-hover:translate-x-1 ${
                              isCompleted ? "text-emerald-500" : isActive ? "text-blue-500" : "text-slate-400"
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Active Module */}
                    {isActive && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                          <span>Modül İlerlemesi</span>
                          <span>Başlamaya hazır</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full w-0 transition-all duration-300"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Completion Celebration */}
          {completedCount === totalCount && (
            <div className="mt-12">
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 border border-emerald-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiAward className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Tebrikler! 🎉</h3>
                  <p className="text-slate-600 text-lg mb-4">
                    Tüm modülleri başarıyla tamamladın. Öğrenme yolculuğun harika geçti!
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setShowRegenerateDialog(true)}
                      variant="modern" // Yeni varyantı kullan
                      className="px-6 py-3 rounded-xl"
                    >
                      Yeni Plan Oluştur
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Module Content Screen - Modern Design
  if (currentScreen === "module-content" && currentModule) {
    const currentContent = currentModule.contentPages[currentContentPage]
    const totalPages = currentModule.contentPages.length
    const contentProgress = (viewedContentPages.size / totalPages) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setCurrentScreen("dashboard")}
                variant="outline-modern" // Yeni varyantı kullan
                className="px-4 py-2"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>

              <div className="text-center">
                <h1 className="text-xl font-bold text-slate-800">{currentModule.title}</h1>
                <p className="text-sm text-slate-500">İçerik Sayfası</p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <FiEye className="w-4 h-4" />
                <span>
                  {currentContentPage + 1} / {totalPages}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Progress Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">İçerik İlerlemesi</h3>
              <span className="text-sm text-slate-600">{Math.round(contentProgress)}% Tamamlandı</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${contentProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Başlangıç</span>
              <span>Tamamlandı</span>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden mb-8">
            {/* Content Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b border-slate-200/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                  {getContentIcon(currentContent.type)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{currentContent.title}</h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {getContentTypeLabel(currentContent.type)}
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-slate-600">
                      <FiClock className="w-4 h-4" />
                      <span>{currentContent.duration} dakika</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8">
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-700 leading-relaxed">{currentContent.content}</p>
              </div>

              {/* Content Type Specific Elements */}
              {currentContent.type === "video" && (
                <div className="mt-8 bg-slate-100 rounded-xl p-8 text-center">
                  <FiVideo className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">Video içeriği burada görüntülenecek</p>
                </div>
              )}

              {currentContent.type === "audio" && (
                <div className="mt-8 bg-slate-100 rounded-xl p-8 text-center">
                  <FiHeadphones className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">Ses içeriği burada çalınacak</p>
                </div>
              )}

              {currentContent.type === "interactive" && (
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center border border-blue-200">
                  <FiPlay className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                  <p className="text-slate-700 font-medium">İnteraktif içerik burada yer alacak</p>
                  <Button variant="modern" className="mt-4">
                    Etkileşimi Başlat
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handleContentPrevious}
              disabled={currentContentPage === 0}
              variant="outline-modern" // Yeni varyantı kullan
              className="px-6 py-3 disabled:opacity-50"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Önceki İçerik
            </Button>

            <div className="flex items-center space-x-2">
              {currentModule.contentPages.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentContentPage
                      ? "bg-blue-500 scale-125"
                      : viewedContentPages.has(index)
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleContentNext}
              variant="modern" // Yeni varyantı kullan
              className="px-6 py-3"
            >
              {currentContentPage === totalPages - 1 ? (
                <>
                  Teste Geç
                  <FiArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Sonraki İçerik
                  <FiArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Module Test Screen - Modern Design
  if (currentScreen === "module-test" && currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setCurrentScreen("module-content")}
                variant="outline-modern" // Yeni varyantı kullan
                className="px-4 py-2"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                İçeriğe Dön
              </Button>

              <div className="text-center">
                <h1 className="text-xl font-bold text-slate-800">{currentModule.title}</h1>
                <p className="text-sm text-slate-500">Değerlendirme Testi</p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <FaBrain className="w-4 h-4" />
                <span>Test</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Test Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
            {/* Test Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-slate-200/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                  <FaBrain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Değerlendirme Sorusu</h2>
                  <p className="text-slate-600 mt-1">Öğrendiklerinizi test edin</p>
                </div>
              </div>
            </div>

            {/* Test Content */}
            <div className="p-8">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 leading-relaxed">
                  {currentModule.quiz.question}
                </h3>

                {currentModule.quiz.type === "multiple" && currentModule.quiz.options ? (
                  <div className="space-y-4">
                    {currentModule.quiz.options.map((option, index) => (
                      <div
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          selectedAnswer === option
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                              selectedAnswer === option
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-slate-300 text-slate-500"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-slate-700 font-medium">{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Cevabınızı detaylı olarak yazın..."
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      className="input-modern min-h-32 resize-none" // input-modern sınıfını kullan
                    />
                    <p className="text-sm text-slate-500">
                      Düşüncelerinizi ve öğrendiklerinizi açık bir şekilde ifade edin.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={submitTest}
                  disabled={!selectedAnswer}
                  variant="modern" // Yeni varyantı kullan
                  className="px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiCheckCircle className="w-5 h-5 mr-2" />
                  Testi Tamamla
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Module Complete Screen - Modern Design
  if (currentScreen === "module-complete" && currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800">{currentModule.title}</h1>
              <p className="text-sm text-slate-500">Modül Tamamlandı</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Completion Celebration */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 border border-emerald-200 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAward className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Tebrikler! 🎉</h2>
              <p className="text-slate-600 text-lg">Modülü başarıyla tamamladın!</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Objectives Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FiTarget className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Kazanımlar</h3>
              </div>
              <ul className="space-y-3">
                {currentModule.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <FiCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiBookmark className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Kaynaklar</h3>
              </div>
              <ul className="space-y-3">
                {currentModule.resources.map((resource, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <FiPlay className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <FaBrain className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Test Sonuçları</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{correctAnswers}</div>
                <div className="text-sm text-emerald-700 font-medium">Doğru Cevap</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="text-3xl font-bold text-red-600 mb-1">{wrongAnswers}</div>
                <div className="text-sm text-red-700 font-medium">Yanlış Cevap</div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <FiStar className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Değerlendirme</h3>
            </div>
            <Textarea
              placeholder="Bu modül hakkında düşüncelerinizi, öğrendiklerinizi ve önerilerinizi paylaşın..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="input-modern min-h-32 resize-none" // input-modern sınıfını kullan
            />
            <p className="text-sm text-slate-500 mt-2">
              Geri bildiriminiz gelişimimize katkı sağlar ve diğer öğrenciler için faydalıdır.
            </p>
          </div>

          {/* Complete Button */}
          <div className="text-center">
            <Button
              onClick={completeModule}
              variant="modern" // Yeni varyantı kullan
              className="px-12 py-4 text-lg shadow-lg"
            >
              <FiCheckCircle className="w-6 h-6 mr-3" />
              Modülü Tamamla ve Dashboard'a Dön
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
      <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-white/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-800">Planı Yeniden Oluştur</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Bu işlem mevcut ilerlemenizi silecek ve yeni bir plan oluşturacak. Devam etmek istediğinizden emin misiniz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-800">İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={regeneratePlan}
            variant="modern" // Yeni varyantı kullan
            className="text-white"
          >
            Evet, Yeniden Oluştur
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
