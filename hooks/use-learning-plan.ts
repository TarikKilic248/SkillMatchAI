import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LearningPlan, Module, UserData } from "@/lib/types";

export const useLearningPlan = () => {
  const { user, loading: authLoading } = useAuth();
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [hasAttemptedPlanLoad, setHasAttemptedPlanLoad] = useState(false);

  const getNumericId = (id: string) => {
    const match = id.match(/\d+/);
    return match ? Number.parseInt(match[0]) : 0;
  };

  const loadUserPlans = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return false;
      }

      // Önce local storage'dan mevcut modülleri kontrol et
      const savedModules = localStorage.getItem("currentModules");
      if (savedModules) {
        try {
          const modules = JSON.parse(savedModules);
          setLearningPlan((prev) => ({
            ...prev,
            modules: modules,
            title: prev?.title || "Öğrenme Planı",
          }));
          return true;
        } catch (parseError) {
          console.error("Local storage parse error:", parseError);
          localStorage.removeItem("currentModules");
        }
      }

      const response = await fetch("/api/get-user-plans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText);
        return false;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", contentType);
        return false;
      }

      try {
        const data = await response.json();
        const { plans } = data;
        
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

          // Modülleri sırala ve kaydet
          const sortedModules = modulesWithContent.sort(
            (a: Module, b: Module) => getNumericId(a.id) - getNumericId(b.id)
          );
          localStorage.setItem("currentModules", JSON.stringify(sortedModules));

          setLearningPlan({
            ...activePlan,
            modules: sortedModules,
          });
          return true;
        }
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        return false;
      }
      
      return false;
    } catch (error) {
      console.error("Plan yükleme hatası:", error);
      return false;
    } finally {
      setHasAttemptedPlanLoad(true);
    }
  };

  const generateLearningPlan = async (userData: UserData) => {
    try {
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

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API yanıtı JSON formatında değil");
      }

      const planData = await response.json();

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

      // Modülleri id'ye göre sırala
      const sortedModules = modulesWithContent.sort(
        (a: Module, b: Module) => getNumericId(a.id) - getNumericId(b.id)
      );

      // Local storage'a modül verilerini kaydet
      localStorage.setItem("currentModules", JSON.stringify(sortedModules));

      setLearningPlan({ ...planData, modules: sortedModules });
      return true;
    } catch (error) {
      console.error("Error generating plan:", error);
      throw error;
    }
  };

  const updateModuleCompletion = async (moduleId: string, completed: boolean) => {
    if (learningPlan) {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await fetch("/api/update-module", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            moduleId: moduleId,
            completed: completed,
            unlockNext: true,
          }),
        });

        if (!response.ok) {
          console.error("Module update failed:", response.status);
          return;
        }

        // Update local state
        const updatedModules = learningPlan.modules.map((m) => {
          if (m.id === moduleId) {
            return { ...m, completed: completed };
          }
          return m;
        });

        // Find current module index and unlock next
        const currentIndex = updatedModules.findIndex(
          (m) => m.id === moduleId
        );
        if (currentIndex < updatedModules.length - 1) {
          updatedModules[currentIndex + 1].unlocked = true;
        }

        setLearningPlan({ ...learningPlan, modules: updatedModules });
        
        // Update localStorage
        localStorage.setItem("currentModules", JSON.stringify(updatedModules));
      } catch (error) {
        console.error("Modül güncelleme hatası:", error);
      }
    }
  };

  const saveFeedback = async (moduleId: string, feedback: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await fetch("/api/save-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleId: moduleId,
          feedback: feedback.trim(),
        }),
      });

      if (!response.ok) {
        console.error("Feedback save failed:", response.status);
      }
    } catch (error) {
      console.error("Feedback kaydetme hatası:", error);
    }
  };

  const deactivatePlan = async (planId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const response = await fetch("/api/deactivate-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planId: planId,
          }),
        });

        if (!response.ok) {
          console.error("Plan deactivation failed:", response.status);
        }
      }
    } catch (error) {
      console.error("Plan deactivation error:", error);
    }
  };

  const clearLocalData = () => {
    localStorage.removeItem('currentModules');
    setLearningPlan(null);
  };

  return {
    learningPlan,
    setLearningPlan,
    hasAttemptedPlanLoad,
    loadUserPlans,
    generateLearningPlan,
    updateModuleCompletion,
    saveFeedback,
    deactivatePlan,
    clearLocalData,
  };
}; 