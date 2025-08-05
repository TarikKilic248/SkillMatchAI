"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
} from "react-icons/fi";
import { FaBrain } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface UserData {
  learningGoal: string;
  dailyTime: string;
  duration: string;
  learningStyle: string;
  targetLevel: string;
}

interface ContentPage {
  id: string;
  title: string;
  type: "text" | "video" | "audio" | "interactive" | "evaluation";
  content: string;
  duration: number; // minutes
  videoSuggestions?: string[];
  task?: any;
  assessment?: any;
}

interface Module {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  resources: string[];
  contentPages: ContentPage[];
  quiz: {
    question: string;
    options?: string[];
    type: "multiple" | "open";
  };
  completed: boolean;
  unlocked: boolean;
  position: { x: number; y: number };
  type: "lesson" | "quiz" | "exam";
  content_generated?: boolean;
}

interface LearningPlan {
  id?: string;
  title: string;
  modules: Module[];
  learningGoal?: string;
  dailyTime?: string;
  duration?: string;
  learningStyle?: string;
  targetLevel?: string;
}

export default function MicroLearningPlatform() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false); // Hydration kontrolü için
  const [currentScreen, setCurrentScreen] = useState<
    | "welcome"
    | "questions"
    | "loading"
    | "dashboard"
    | "module"
    | "module-content"
    | "module-test"
    | "module-complete"
  >("loading"); // Başlangıçta genel bir yükleme durumu
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    learningGoal: "",
    dailyTime: "",
    duration: "",
    learningStyle: "",
    targetLevel: "",
  });
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(
    "Senin için program oluşturuyoruz..."
  );
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right"
  );
  const [userFeedbacks, setUserFeedbacks] = useState<
    Array<{
      moduleId: string;
      feedback: string;
      timestamp: string;
    }>
  >([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moduleProgress, setModuleProgress] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [currentContentPage, setCurrentContentPage] = useState(0);
  const [viewedContentPages, setViewedContentPages] = useState<Set<number>>(
    new Set()
  );
  const [hasAttemptedPlanLoad, setHasAttemptedPlanLoad] = useState(false); // Plan yükleme denemesi yapıldı mı?
  const router = useRouter();

  // Hydration tamamlandığında mount durumunu set et
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && mounted) {
      // Sadece kimlik doğrulama durumu bilindiğinde ve component mount olduğunda devam et
      if (user) {
        // Kullanıcı giriş yapmış, planı yüklemeye çalış
        loadUserPlans();
      } else {
        // Kullanıcı yok, hoş geldin ekranına git
        setCurrentScreen("welcome");
        setHasAttemptedPlanLoad(true); // Giriş yapmamış kullanıcı için kontrol tamamlandı
      }
    }
  }, [user, authLoading, mounted]); // mounted da dependency'e eklendi

  // Hydration sorununu önlemek için ayrı bir useEffect
  useEffect(() => {
    // Client-side'da çalıştığımızdan ve component mount olduğundan emin olmak için
    if (typeof window !== 'undefined' && mounted) {
      const token = localStorage.getItem("access_token");
      const savedModules = localStorage.getItem("currentModules");
      
      // Eğer token ve modüller varsa, doğrudan dashboard'a git
      if (token && savedModules && !authLoading && user) {
        try {
          const modules = JSON.parse(savedModules);
          const sortedModules = sortModulesByOrder(modules);
          setLearningPlan((prev) => {
            if (!prev) {
              return {
                id: 'default-plan',
                title: 'Öğrenme Planınız',
                description: 'Kişiselleştirilmiş öğrenme planınız',
                modules: sortedModules,
                created_at: new Date().toISOString()
              };
            }
            return {
              ...prev,
              modules: sortedModules,
            };
          });
          setCurrentScreen("dashboard");
        } catch (error) {
          console.error('Local storage modül verisi parse edilemedi:', error);
          // Hatalı veri varsa temizle
          localStorage.removeItem("currentModules");
        }
      }
    }
  }, [user, authLoading, mounted]); // mounted da dependency'e eklendi

  const getNumericId = (id: string) => {
    const match = id.match(/\d+/);
    return match ? Number.parseInt(match[0]) : 0;
  };

  // Modülleri doğru sıralamak için yeni fonksiyon
  const sortModulesByOrder = (modules: Module[]) => {
    return modules.sort((a, b) => {
      // Önce unlocked durumuna göre sırala (unlocked olanlar üstte)
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      
      // Sonra completed durumuna göre sırala (completed olanlar üstte)
      if (a.completed && !b.completed) return -1;
      if (!a.completed && b.completed) return 1;
      
      // Son olarak ID'ye göre sırala
      return getNumericId(a.id) - getNumericId(b.id);
    });
  };

  const handleSignOut = async () => {
  try {
    // Önce localStorage'ı temizle
    localStorage.removeItem('currentModules');
    localStorage.removeItem('access_token');
    
    // Sonra state'leri sıfırla
    setLearningPlan(null);
    setCurrentModule(null);
    setCurrentContentPage(0);
    setViewedContentPages(new Set());
    setModuleProgress(0);
    
    // En son çıkış yap
    await signOut();
    
    // Welcome ekranına yönlendir
    setCurrentScreen("welcome");
  } catch (error) {
    console.error("Çıkış yapılırken hata oluştu:", error);
  }
};

  const loadUserPlans = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setCurrentScreen("welcome");
        return;
      }

      // API'den planları getir
      const response = await fetch("/api/get-user-plans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { plans } = await response.json();
        if (plans && plans.length > 0) {
          const activePlan = plans[0];

          // Her modül için varsayılan içerik sayfalarını ekle
          const modulesWithContent = activePlan.modules.map(
            (module: Module, index: number) => ({
              ...module,
              unlocked: index === 0 ? true : module.unlocked,
              contentPages: [
                {
                  id: `${module.id}-content-1`,
                  title: "Giriş ve Temel Kavramlar",
                  type: "text",
                  content:
                    "Bu modülde öğreneceğiniz temel kavramları ve konuları tanıyacaksınız.",
                  duration: 5,
                },
                {
                  id: `${module.id}-content-2`,
                  title: "Detaylı Açıklamalar",
                  type: "video",
                  content:
                    "Konunun detaylarına inerek, pratik örnekler üzerinden açıklamalar yapacağız.",
                  duration: 8,
                },
                {
                  id: `${module.id}-content-3`,
                  title: "Uygulamalı Örnekler",
                  type: "interactive",
                  content: "Gerçek hayat örnekleri ile konuyu pekiştireceğiz.",
                  duration: 10,
                },
                {
                  id: `${module.id}-content-4`,
                  title: "Özet ve Değerlendirme",
                  type: "audio",
                  content:
                    "Modülün özetini yaparak önemli noktaları tekrar edeceğiz.",
                  duration: 6,
                },
              ],
            })
          );

          // Modülleri doğru sırala ve kaydet
          const sortedModules = sortModulesByOrder(modulesWithContent);
          localStorage.setItem("currentModules", JSON.stringify(sortedModules));

          setLearningPlan({
            ...activePlan,
            modules: sortedModules,
          });
          setCurrentScreen("dashboard");
        } else {
          setCurrentScreen("questions");
        }
      } else {
        console.error("Plan yükleme hatası:", response.statusText);
        setCurrentScreen("questions");
      }
    } catch (error) {
      console.error("Plan yükleme hatası:", error);
      setCurrentScreen("questions");
    } finally {
      setHasAttemptedPlanLoad(true);
    }
  };

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
        {
          value: "visual",
          label: "Görsel öğrenme",
          desc: "Videolar ve grafikler",
        },
        {
          value: "practical",
          label: "Uygulamalı öğrenme",
          desc: "Projeler ve pratik",
        },
        {
          value: "reading",
          label: "Okuyarak öğrenme",
          desc: "Makaleler ve kitaplar",
        },
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
        {
          value: "intermediate",
          label: "Orta seviye",
          desc: "Bilgini geliştir",
        },
        { value: "advanced", label: "İleri seviye", desc: "Uzmanlaş" },
        { value: "expert", label: "Uzman seviye", desc: "Lider ol" },
      ],
      icon: FiTrendingUp,
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  const generateLearningPlan = async () => {
    setCurrentScreen("loading");
    setLoadingProgress(0);
    setLoadingText("Senin için program oluşturuyoruz...");

    try {
      const steps = [
        { text: "Senin için program oluşturuyoruz...", progress: 15 },
        { text: "Gemini bağlantısı kuruluyor...", progress: 30 },
        { text: "Öğrenme hedeflerin analiz ediliyor...", progress: 45 },
        { text: "Kişiselleştirilmiş modüller hazırlanıyor...", progress: 60 },
        { text: "İçerik yapısı oluşturuluyor...", progress: 75 },
        { text: "Veritabanına kaydediliyor...", progress: 90 },
      ];

      let stepIndex = 0;
      const loadingInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setLoadingText(steps[stepIndex].text);
          setLoadingProgress(steps[stepIndex].progress);
          stepIndex++;
        }
      }, 800);

      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Kullanıcı oturumu bulunamadı");
      }

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userData }),
      });

      if (!response.ok) {
        throw new Error("Plan oluşturulurken hata oluştu");
      }

      const planData = await response.json();
      clearInterval(loadingInterval);

      setLoadingText("Tamamlandı!");
      setLoadingProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Her modül için varsayılan içerik sayfalarını ekle
      const modulesWithContent = planData.modules.map(
        (module: Module, index: number) => ({
          ...module,
          unlocked: index === 0 ? true : false, // İlk modülün kilidini aç
          contentPages: [
            {
              id: `${module.id}-content-1`,
              title: "Giriş ve Temel Kavramlar",
              type: "text",
              content:
                "Bu modülde öğreneceğiniz temel kavramları ve konuları tanıyacaksınız.",
              duration: 5,
            },
            {
              id: `${module.id}-content-2`,
              title: "Detaylı Açıklamalar",
              type: "video",
              content:
                "Konunun detaylarına inerek, pratik örnekler üzerinden açıklamalar yapacağız.",
              duration: 8,
            },
            {
              id: `${module.id}-content-3`,
              title: "Uygulamalı Örnekler",
              type: "interactive",
              content: "Gerçek hayat örnekleri ile konuyu pekiştireceğiz.",
              duration: 10,
            },
            {
              id: `${module.id}-content-4`,
              title: "Özet ve Değerlendirme",
              type: "audio",
              content:
                "Modülün özetini yaparak önemli noktaları tekrar edeceğiz.",
              duration: 6,
            },
          ],
        })
      );

      // Modülleri doğru sırala
      const sortedModules = sortModulesByOrder(modulesWithContent);

      // Local storage'a modül verilerini kaydet
      localStorage.setItem("currentModules", JSON.stringify(sortedModules));

      setLearningPlan({ ...planData, modules: sortedModules });
      setCurrentScreen("dashboard");
    } catch (error) {
      console.error("Error generating plan:", error);
      setLoadingText("Hata oluştu, lütfen tekrar deneyin...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setCurrentScreen("questions");
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setIsAnimating(true);
      setSlideDirection("right");
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      generateLearningPlan();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setSlideDirection("left");
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Önceki modül performansını getir
  const getPreviousModulePerformance = async (currentModuleId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;
      
      const response = await fetch(`/api/get-previous-performance?moduleId=${currentModuleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.performance;
      }
    } catch (error) {
      console.error("Önceki performans alınamadı:", error);
    }
    return null;
  };

  const handleModuleClick = async (module: Module) => {
    if (module.unlocked || module.completed) {
      setCurrentModule(module);
      
      // Eğer modül içeriği henüz generate edilmemişse, API'den al
      if (!module.content_generated) {
        setCurrentScreen("loading");
        setLoadingText("Modül içeriği hazırlanıyor...");
        setLoadingProgress(0);
        
        // Loading animation
        const loadingInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 90) {
              clearInterval(loadingInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        
        try {
          const token = localStorage.getItem("access_token");
          
          // Önce mevcut içeriği kontrol et (veritabanından)
          const checkResponse = await fetch(`/api/get-module-content?moduleId=${module.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          let contentData = null;
          
          // Eğer mevcut içerik varsa onu kullan
          if (checkResponse.ok) {
            const existingContent = await checkResponse.json();
            if (existingContent.success && existingContent.contentPages) {
              contentData = existingContent;
              setLoadingProgress(100);
            }
          }
          
          // Eğer mevcut içerik yoksa yeni içerik üret
          if (!contentData) {
            const response = await fetch("/api/generate-module-content", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                moduleId: module.id,
                learningStyle: userData.learningStyle,
                targetLevel: userData.targetLevel,
                topic: module.title,
                description: module.description
              }),
            });

            if (response.ok) {
              contentData = await response.json();
              setLoadingProgress(100);
            } else {
              throw new Error("İçerik üretilemedi");
            }
          }
          
          if (contentData && contentData.success && contentData.contentPages) {
            // API'den dönen contentPages formatını direkt kullan
            const updatedModule = {
              ...module,
              contentPages: contentData.contentPages.map((section: any, index: number) => ({
                id: section.type || `section-${index}`,
                title: section.title,
                type: section.type === 'theory' ? 'text' as const :
                      section.type === 'examples' ? 'text' as const :
                      section.type === 'practice' ? 'interactive' as const :
                      section.type === 'assessment' ? 'evaluation' as const : 'text' as const,
                content: section.content,
                duration: section.estimatedTime || 10,
                videoSuggestions: section.videoSuggestions || [],
                difficulty: section.difficulty || userData.targetLevel,
                originalType: section.type // API'den gelen orijinal type'ı sakla
              })),
              content_generated: true
            };
            
            setCurrentModule(updatedModule);
            
            // Learning plan'i de güncelle ve localStorage'a kaydet
            setLearningPlan(prevPlan => {
              if (!prevPlan) return prevPlan;
              const updatedModules = prevPlan.modules.map(m => 
                m.id === module.id ? updatedModule : m
              );
              
              // Modülleri doğru sırala ve localStorage'a kaydet
              const sortedModules = sortModulesByOrder(updatedModules);
              localStorage.setItem("currentModules", JSON.stringify(sortedModules));
              
              return {
                ...prevPlan,
                modules: sortedModules,
              };
            });
          } else {
            throw new Error("İçerik formatı geçersiz");
          }
          
          clearInterval(loadingInterval);
          
        } catch (error) {
          console.error("Modül içeriği yüklenirken hata:", error);
          clearInterval(loadingInterval);
          // Hata durumunda fallback içerik kullan
        }
      }
      
      setCurrentContentPage(0);
      setViewedContentPages(new Set([0]));
      setModuleProgress(0);
      setCurrentScreen("module-content");
    }
  };

  const handleContentNext = () => {
    if (
      currentModule &&
      currentContentPage < currentModule.contentPages.length - 1
    ) {
      const nextPage = currentContentPage + 1;
      setCurrentContentPage(nextPage);
      setViewedContentPages((prev) => new Set([...prev, nextPage]));

      // Update progress based on viewed pages
      const totalPages = currentModule.contentPages.length;
      const viewedCount = viewedContentPages.size + 1; // +1 for current page
      const progress = (viewedCount / totalPages) * 100;
      setModuleProgress(progress);
    } else {
      // All content viewed, go to test
      setCurrentScreen("module-test");
    }
  };

  const handleContentPrevious = () => {
    if (currentContentPage > 0) {
      setCurrentContentPage(currentContentPage - 1);
    }
  };

  const startModuleTest = () => {
    setCurrentScreen("module-test");
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const submitTest = () => {
    // Simulate test evaluation
    const isCorrect = Math.random() > 0.5; // Random for demo
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setWrongAnswers((prev) => prev + 1);
    }
    setCurrentScreen("module-complete");
  };

  const completeModule = async () => {
    if (currentModule && learningPlan) {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

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
          });
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
        });

        // Update local state
        const updatedModules = learningPlan.modules.map((m) => {
          if (m.id === currentModule.id) {
            return { ...m, completed: true };
          }
          return m;
        });

        // Find current module index and unlock next
        const currentIndex = updatedModules.findIndex(
          (m) => m.id === currentModule.id
        );
        if (currentIndex < updatedModules.length - 1) {
          updatedModules[currentIndex + 1].unlocked = true;
        }

        // Check if all modules are completed
        const allModulesCompleted = updatedModules.every((m) => m.completed);

        // Modülleri doğru sırala ve localStorage'a kaydet
        const sortedModules = sortModulesByOrder(updatedModules);
        localStorage.setItem("currentModules", JSON.stringify(sortedModules));

        setLearningPlan({ ...learningPlan, modules: sortedModules });
        setCurrentScreen("dashboard");
        setCurrentModule(null);
        setFeedback("");
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setSelectedAnswer("");
        setCurrentContentPage(0);
        setViewedContentPages(new Set());
        setModuleProgress(0);

        // If all modules are completed, show completion message
        if (allModulesCompleted) {
          // Plan tamamlandı, kullanıcı dashboard'da tamamlama mesajını görecek
          console.log("Tüm modüller tamamlandı!");
        }
      } catch (error) {
        console.error("Modül tamamlama hatası:", error);
      }
    }
  };

  const regeneratePlan = async () => {
    setShowRegenerateDialog(false);

    // Deactivate current plan if it exists
    if (learningPlan?.id) {
      try {
        const token = localStorage.getItem("access_token");
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
          });
        }
      } catch (error) {
        console.error("Plan deactivation error:", error);
      }
    }

    setCurrentScreen("questions");
    setCurrentQuestion(0);
  };

  const getModuleIcon = (
    type: string,
    completed: boolean,
    unlocked: boolean
  ) => {
    if (completed)
      return <FiCheckCircle className="w-6 h-6 text-emerald-400" />;
    if (!unlocked) return <FiCircle className="w-6 h-6 text-slate-400" />;

    switch (type) {
      case "quiz":
        return <FaBrain className="w-6 h-6 text-violet-400" />;
      case "exam":
        return <FiAward className="w-6 h-6 text-amber-400" />;
      default:
        return <FiBookOpen className="w-6 h-6 text-sky-400" />;
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <FiVideo className="w-5 h-5" />;
      case "audio":
        return <FiHeadphones className="w-5 h-5" />;
      case "interactive":
        return <FiPlay className="w-5 h-5" />;
      default:
        return <FiFileText className="w-5 h-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "Video İçerik";
      case "audio":
        return "Ses İçeriği";
      case "interactive":
        return "İnteraktif İçerik";
      default:
        return "Metin İçeriği";
    }
  };

  // Görev tamamlama handler'ı
  const handleTaskComplete = async (submission: any) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token || !currentModule) return

      // Görevi veritabanına kaydet
      const response = await fetch("/api/save-task-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleId: currentModule.id,
          taskSubmission: submission,
        }),
      })

      if (response.ok) {
        console.log("Görev başarıyla kaydedildi")
        // Sonraki içeriğe geç
        handleContentNext()
      }
    } catch (error) {
      console.error("Görev kaydedilirken hata:", error)
    }
  }

  // Değerlendirme tamamlama handler'ı
  const handleAssessmentComplete = async (answers: any) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token || !currentModule) return

      setCurrentScreen("loading")
      setLoadingText("Değerlendirme yapılıyor...")

      // AI ile değerlendirme yap
      const response = await fetch("/api/evaluate-student-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleId: currentModule.id,
          assessmentAnswers: answers,
          userFeedback: feedback,
        }),
      })

      if (response.ok) {
        const evaluation = await response.json()
        console.log("Değerlendirme tamamlandı:", evaluation)
        
        // Modülü tamamlandı olarak işaretle
        if (learningPlan) {
          setLearningPlan(prevPlan => ({
            ...prevPlan!,
            modules: prevPlan!.modules.map(m => 
              m.id === currentModule.id 
                ? { ...m, completed: true }
                : m
            )
          }))
        }

        setCurrentScreen("module-complete")
      }
    } catch (error) {
      console.error("Değerlendirme sırasında hata:", error)
      setCurrentScreen("module-content")
    }
  }

  // Genel yükleme ekranı - auth loading, mount olmamış veya plan yükleme durumunda
  if (!mounted || authLoading || (currentScreen === "loading" && !hasAttemptedPlanLoad)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Yükleniyor...</h2>
            <p className="text-white/80">Lütfen bekleyin.</p>
          </CardContent>
        </Card>
      </div>
    );
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
                <p className="text-sm text-white/70">
                  Kişisel hedeflerinize uygun planlar
                </p>
              </div>
              <div className="text-center">
                <FiTrendingUp className="w-8 h-8 mx-auto mb-2 text-green-300" />
                <h3 className="font-semibold mb-1">İlerleme Takibi</h3>
                <p className="text-sm text-white/70">
                  Gelişiminizi görsel olarak takip edin
                </p>
              </div>
              <div className="text-center">
                <FiUsers className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                <h3 className="font-semibold mb-1">Topluluk</h3>
                <p className="text-sm text-white/70">
                  Diğer öğrencilerle etkileşim kurun
                </p>
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
    );
  }

  if (currentScreen === "questions") {
    const currentQ = questions[currentQuestion];
    const IconComponent = currentQ.icon;

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
              <span className="text-white/80 text-sm font-medium">
                İlerleme
              </span>
              <span className="text-white/80 text-sm font-medium">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="relative bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-white/60 to-white/80 rounded-full h-3 transition-all duration-500 ease-out"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
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
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          [currentQ.field]: e.target.value,
                        })
                      }
                      className="input-modern text-white placeholder:text-white/50 h-14 text-lg"
                    />
                  </div>
                ) : (
                  <Select
                    value={userData[currentQ.field]}
                    onValueChange={(value) =>
                      setUserData({ ...userData, [currentQ.field]: value })
                    }
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
                            {option.desc && (
                              <span className="text-sm text-slate-600">
                                {option.desc}
                              </span>
                            )}
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
    );
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
                <div className="spinner-modern"></div>{" "}
                {/* Modern spinner sınıfı */}
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
              <p className="text-white/60 text-sm mt-3 font-medium">
                {loadingProgress}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentScreen === "dashboard" && learningPlan) {
    const completedCount = learningPlan.modules.filter(
      (m) => m.completed
    ).length;
    const totalCount = learningPlan.modules.length;
    const progressPercentage = (completedCount / totalCount) * 100;

    // Modüller zaten setLearningPlan içinde sıralanmış olduğu için burada tekrar sıralamaya gerek yok.
    const sequentialModules = learningPlan.modules;

    // Find current active module (first unlocked but not completed)
    const currentActiveModule = sequentialModules.find(
      (m) => m.unlocked && !m.completed
    );

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
                  <h1 className="text-xl font-bold text-slate-800">
                    Mikro Öğrenme
                  </h1>
                  <p className="text-sm text-slate-500">
                    Kişisel gelişim platformu
                  </p>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {user?.full_name || "Kullanıcı"}
                  </p>
                  <p className="text-xs text-slate-500">Öğrenci</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {user?.full_name?.charAt(0) || "U"}
                  </span>
                </div>
                <Button
                  onClick={handleSignOut}
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
                  <p className="text-sm font-medium text-slate-600">
                    Toplam Modül
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {totalCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiBookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Tamamlanan
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {completedCount}
                  </p>
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
                  <p className="text-2xl font-bold text-amber-600">
                    {totalCount - completedCount}
                  </p>
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
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(progressPercentage)}%
                  </p>
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
              <h3 className="text-lg font-semibold text-slate-800">
                Genel İlerleme
              </h3>
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
                    Tüm modülleri başarıyla tamamladınız. Yeni bir öğrenme
                    yolculuğuna başlamak ister misiniz?
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={async () => {
                        if (learningPlan?.id) {
                          try {
                            const token = localStorage.getItem("access_token");
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
                              });
                            }
                          } catch (error) {
                            console.error("Plan deactivation error:", error);
                          }
                        }
                        setShowRegenerateDialog(true);
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
                            const token = localStorage.getItem("access_token");
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
                              });
                            }
                          } catch (error) {
                            console.error("Plan deactivation error:", error);
                          }
                        }
                        setCurrentScreen("questions");
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
              <h3 className="text-xl font-semibold text-slate-800">
                Öğrenme Modülleri
              </h3>
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
                const isActive = currentActiveModule?.id === module.id;
                const isLocked = !module.unlocked;
                const isCompleted = module.completed;
                const canReopen = module.completed; // Tamamlanan modüller tekrar açılabilir

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
                    onClick={() =>
                      (module.unlocked || canReopen) &&
                      handleModuleClick(module)
                    }
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
                          <h4 className="text-lg font-semibold text-slate-800 truncate">
                            {module.title}
                          </h4>
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
                            {module.type === "quiz"
                              ? "Quiz"
                              : module.type === "exam"
                              ? "Sınav"
                              : "Ders"}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-2">
                          {module.description}
                        </p>

                        {/* Status Text */}
                        <div className="flex items-center space-x-4 text-sm">
                          {isCompleted && (
                            <div className="flex items-center space-x-1 text-emerald-600">
                              <FiCheckCircle className="w-4 h-4" />
                              <span className="font-medium">
                                Tamamlandı - Tekrar Aç
                              </span>
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
                              isCompleted
                                ? "text-emerald-500"
                                : isActive
                                ? "text-blue-500"
                                : "text-slate-400"
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
                );
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
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    Tebrikler! 🎉
                  </h3>
                  <p className="text-slate-600 text-lg mb-4">
                    Tüm modülleri başarıyla tamamladın. Öğrenme yolculuğun
                    harika geçti!
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
    );
  }

  // Module Content Screen - Modern Design
  if (currentScreen === "module-content" && currentModule) {
    // Güvenlik kontrolü: contentPages var mı?
    if (!currentModule.contentPages || currentModule.contentPages.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">Modül içeriği yükleniyor...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      );
    }
    
    const currentContent = currentModule.contentPages[currentContentPage];
    const totalPages = currentModule.contentPages.length;
    const contentProgress = (viewedContentPages.size / totalPages) * 100;

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
                <h1 className="text-xl font-bold text-slate-800">
                  {currentModule.title}
                </h1>
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
              <h3 className="text-lg font-semibold text-slate-800">
                İçerik İlerlemesi
              </h3>
              <span className="text-sm text-slate-600">
                {Math.round(contentProgress)}% Tamamlandı
              </span>
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
                  <h2 className="text-2xl font-bold text-slate-800">
                    {currentContent.title}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
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
              {(currentContent.type === "text" || currentContent.type === "video") && (
                <div className="prose prose-slate max-w-none">
                  <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-line">{currentContent.content}</p>
                </div>
              )}

              {/* Content Type Specific Elements */}
              {currentContent.type === "video" && (
                <div className="mt-8 space-y-6">
                  <div className="bg-slate-100 rounded-xl p-8 text-center">
                    <FiVideo className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600">Video içeriği burada görüntülenecek</p>
                  </div>
                </div>
              )}

              {/* Video suggestions for examples section */}
              {(currentContent as any).originalType === "examples" && currentContent.videoSuggestions && currentContent.videoSuggestions.length > 0 && (
                <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                    <FiPlay className="w-5 h-5 mr-2" />
                    Önerilen Video Kaynakları
                  </h4>
                  <div className="space-y-3">
                    {currentContent.videoSuggestions?.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                        <FiVideo className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-700">{suggestion}</span>
                      </div>
                    )) || <div className="text-slate-500">Video önerisi bulunmuyor</div>}
                  </div>
                </div>
              )}

              {currentContent.type === "audio" && (
                <div className="mt-8 bg-slate-100 rounded-xl p-8 text-center">
                  <FiHeadphones className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">Ses içeriği burada çalınacak</p>
                </div>
              )}

              {currentContent.type === "interactive" && (
                <div className="mt-8">
                  <InteractiveTask 
                    task={(() => {
                      try {
                        return currentContent.task || JSON.parse(currentContent.content || '{}');
                      } catch (error) {
                        console.error('JSON parse error for interactive task:', error);
                        return {
                          taskTitle: 'Uygulamalı Görev',
                          taskDescription: 'Bu bölümde öğrendiklerinizi pratiğe dökün.',
                          instructions: ['Konuyu gözden geçirin', 'Uygulamayı deneyin'],
                          completionCriteria: ['Başarılı uygulama'],
                          interactionQuestions: []
                        };
                      }
                    })()}
                    moduleId={currentModule.id}
                    onComplete={(submission) => handleTaskComplete(submission)}
                  />
                </div>
              )}

              {currentContent.type === "evaluation" && (
                <div className="mt-8">
                  <AssessmentSection 
                    assessment={(() => {
                      try {
                        return currentContent.assessment || JSON.parse(currentContent.content || '{}');
                      } catch (error) {
                        console.error('JSON parse error for assessment:', error);
                        return {
                          summary: 'Modül özeti',
                          evaluationQuestions: [
                            {
                              question: 'Bu modülde ne öğrendiniz?',
                              type: 'open',
                              points: 100
                            }
                          ],
                          performanceMetrics: {
                            comprehensionLevel: 'beginner',
                            recommendedNextDifficulty: 'intermediate',
                            estimatedMastery: 0.75
                          }
                        };
                      }
                    })()}
                    moduleId={currentModule.id}
                    onComplete={(answers) => handleAssessmentComplete(answers)}
                  />
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
              {currentModule.contentPages?.map((_, index) => (
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
              )) || null}
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
    );
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
                <h1 className="text-xl font-bold text-slate-800">
                  {currentModule.title}
                </h1>
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
                  <h2 className="text-2xl font-bold text-slate-800">
                    Değerlendirme Sorusu
                  </h2>
                  <p className="text-slate-600 mt-1">
                    Öğrendiklerinizi test edin
                  </p>
                </div>
              </div>
            </div>

            {/* Test Content */}
            <div className="p-8">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 leading-relaxed">
                  {currentModule.quiz.question}
                </h3>

                {currentModule.quiz.type === "multiple" &&
                currentModule.quiz.options ? (
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
                          <span className="text-slate-700 font-medium">
                            {option}
                          </span>
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
                      Düşüncelerinizi ve öğrendiklerinizi açık bir şekilde ifade
                      edin.
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
    );
  }

  // Module Complete Screen - Modern Design
  if (currentScreen === "module-complete" && currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800">
                {currentModule.title}
              </h1>
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
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Tebrikler! 🎉
              </h2>
              <p className="text-slate-600 text-lg">
                Modülü başarıyla tamamladın!
              </p>
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
                <h3 className="text-lg font-semibold text-slate-800">
                  Kazanımlar
                </h3>
              </div>
              <ul className="space-y-3">
                {currentModule.objectives?.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <FiCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{objective}</span>
                  </li>
                )) || <li className="text-slate-500">Kazanım bulunmuyor</li>}
              </ul>
            </div>

            {/* Resources Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FiBookmark className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Kaynaklar
                </h3>
              </div>
              <ul className="space-y-3">
                {currentModule.resources?.map((resource, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <FiPlay className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{resource}</span>
                  </li>
                )) || <li className="text-slate-500">Kaynak bulunmuyor</li>}
              </ul>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <FaBrain className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Test Sonuçları
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {correctAnswers}
                </div>
                <div className="text-sm text-emerald-700 font-medium">
                  Doğru Cevap
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {wrongAnswers}
                </div>
                <div className="text-sm text-red-700 font-medium">
                  Yanlış Cevap
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <FiStar className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Değerlendirme
              </h3>
            </div>
            <Textarea
              placeholder="Bu modül hakkında düşüncelerinizi, öğrendiklerinizi ve önerilerinizi paylaşın..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="input-modern min-h-32 resize-none" // input-modern sınıfını kullan
            />
            <p className="text-sm text-slate-500 mt-2">
              Geri bildiriminiz gelişimimize katkı sağlar ve diğer öğrenciler
              için faydalıdır.
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
    );
  }

  return (
    <AlertDialog
      open={showRegenerateDialog}
      onOpenChange={setShowRegenerateDialog}
    >
      <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-white/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-800">
            Planı Yeniden Oluştur
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            Bu işlem mevcut ilerlemenizi silecek ve yeni bir plan oluşturacak.
            Devam etmek istediğinizden emin misiniz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-800">
            İptal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={regeneratePlan}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            Evet, Yeniden Oluştur
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// İnteraktif Görev Bileşeni
function InteractiveTask({ task, moduleId, onComplete }: {
  task: {
    taskTitle: string
    taskDescription: string
    instructions: string[]
    completionCriteria: string[]
    interactionQuestions: Array<{
      question: string
      expectedResponse: string
      followUpQuestions?: string[]
    }>
  }
  moduleId: string
  onComplete: (submission: any) => void
}) {
  const [currentStep, setCurrentStep] = useState<'instructions' | 'interaction' | 'completed'>('instructions')
  const [responses, setResponses] = useState<{[key: string]: string}>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [startTime] = useState(Date.now())

  const handleStartInteraction = () => {
    setCurrentStep('interaction')
  }

  const handleQuestionResponse = (response: string) => {
    const questionKey = `question_${currentQuestionIndex}`
    setResponses(prev => ({ ...prev, [questionKey]: response }))
    
    if (currentQuestionIndex < task.interactionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setCurrentStep('completed')
    }
  }

  const handleSubmitTask = () => {
    const completionTime = Math.round((Date.now() - startTime) / (1000 * 60)) // dakika cinsinden
    
    const submission = {
      submissionData: {
        responses,
        taskId: task.taskTitle,
        completedInstructions: task.instructions.length,
        interactionCompleted: true
      },
      completionTime
    }
    
    onComplete(submission)
  }

  if (currentStep === 'instructions') {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-blue-600">🎯</span>
            <span>{task.taskTitle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-slate-700">{task.taskDescription}</p>
          
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Talimatlar:</h4>
            <ol className="space-y-2">
              {task.instructions?.map((instruction, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{instruction}</span>
                </li>
              )) || <li className="text-slate-500">Talimat bulunmuyor</li>}
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Tamamlama Kriterleri:</h4>
            <ul className="space-y-1">
              {task.completionCriteria?.map((criteria, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-slate-700">{criteria}</span>
                </li>
              )) || <li className="text-slate-500">Kriter bulunmuyor</li>}
            </ul>
          </div>

          <Button onClick={handleStartInteraction} className="w-full">
            Etkileşimi Başlat
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (currentStep === 'interaction') {
    const currentQuestion = task.interactionQuestions[currentQuestionIndex]
    
    return (
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Etkileşimli Görev</span>
            <span className="text-sm font-normal text-slate-500">
              {currentQuestionIndex + 1} / {task.interactionQuestions.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="font-medium text-orange-800">{currentQuestion.question}</p>
          </div>
          
          <Textarea
            placeholder="Cevabınızı detaylı olarak yazın..."
            className="min-h-32"
            onBlur={(e) => {
              if (e.target.value.trim()) {
                handleQuestionResponse(e.target.value)
              }
            }}
          />
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Önceki
            </Button>
            <Button 
              onClick={() => {
                const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                if (textarea?.value.trim()) {
                  handleQuestionResponse(textarea.value)
                }
              }}
            >
              {currentQuestionIndex === task.interactionQuestions.length - 1 ? 'Tamamla' : 'Sonraki'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-200">
      <CardContent className="p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Görevi Tamamladınız!</h3>
        <p className="text-green-700 mb-4">Harika! Tüm adımları başarıyla tamamladınız.</p>
        <Button onClick={handleSubmitTask} className="bg-green-600 hover:bg-green-700">
          Görevi Teslim Et
        </Button>
      </CardContent>
    </Card>
  )
}

// Değerlendirme Bileşeni
function AssessmentSection({ assessment, moduleId, onComplete }: {
  assessment: {
    summary: string
    evaluationQuestions?: Array<{
      question: string
      type: string
      points: number
    }>
    assessmentQuestions?: Array<{
      question: string
      type: 'multiple_choice' | 'open_ended'
      options?: string[]
      correctAnswer?: string
      concept: string
      difficulty: 'easy' | 'medium' | 'hard'
    }>
    performanceMetrics?: {
      comprehensionLevel: string
      recommendedNextDifficulty: string
      estimatedMastery: number
    }
  }
  moduleId: string
  onComplete: (answers: any) => void
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{[key: string]: string}>({})
  const [showSummary, setShowSummary] = useState(true)

  // API'den gelen format ile uyumlu çalışacak şekilde questions'ı al
  const questions = assessment.evaluationQuestions || assessment.assessmentQuestions || []

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Tüm sorular cevaplandı
      const formattedAnswers = questions.map((question, index) => ({
        questionId: `q_${index}`,
        question: question.question,
        userAnswer: answers[`q_${index}`] || '',
        correctAnswer: (question as any).correctAnswer || '',
        concept: (question as any).concept || 'general',
        difficulty: (question as any).difficulty || 'medium',
        points: (question as any).points || 25
      }))
      
      onComplete(formattedAnswers)
    }
  }

  const handlePrevious = () => {
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
  }

  if (showSummary) {
    return (
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-purple-600">📋</span>
            <span>Özet ve Değerlendirme</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3">Modül Özeti</h4>
            <p className="text-purple-700">{assessment.summary}</p>
          </div>
          
          <div className="text-center">
            <p className="text-slate-600 mb-4">
              Şimdi {questions.length} soruluk değerlendirme bölümüne geçiyoruz.
            </p>
            <Button onClick={() => setShowSummary(false)} className="bg-purple-600 hover:bg-purple-700">
              Değerlendirmeye Başla
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const questionId = `q_${currentQuestionIndex}`

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Değerlendirme</span>
          <span className="text-sm font-normal text-slate-500">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="font-medium text-purple-800">{currentQuestion.question}</p>
        </div>

        {(currentQuestion as any).type === 'multiple_choice' && (currentQuestion as any).options ? (
          <div className="space-y-3">
            {(currentQuestion as any).options.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={questionId}
                  value={option}
                  checked={answers[questionId] === option}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <Textarea
            placeholder="Cevabınızı detaylı olarak yazın..."
            value={answers[questionId] || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            className="min-h-32"
          />
        )}

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Önceki Soru
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!answers[questionId]}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Değerlendirmeyi Tamamla' : 'Sonraki Soru'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
