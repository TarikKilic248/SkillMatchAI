"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLearningPlan } from "@/hooks/use-learning-plan";
import { UserData, ScreenType, Module } from "@/lib/types";
import WelcomePage from "./welcome/page";
import QuestionsPage from "./questions/page";
import LoadingPage from "./loading/page";
import DashboardPage from "./dashboard/page";
import ModuleContentPage from "./module-content/page";
import ModuleTestPage from "./module-test/page";
import ModuleCompletePage from "./module-complete/page";

export default function MicroLearningPlatform() {
  const { user, signOut, loading: authLoading } = useAuth();
  const {
    learningPlan,
    setLearningPlan,
    hasAttemptedPlanLoad,
    loadUserPlans,
    generateLearningPlan,
    updateModuleCompletion,
    saveFeedback,
    deactivatePlan,
    clearLocalData,
  } = useLearningPlan();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>("loading");
  const [userData, setUserData] = useState<UserData>({
    learningGoal: "",
    dailyTime: "",
    duration: "",
    learningStyle: "",
    targetLevel: "",
  });
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(
    "Senin için program oluşturuyoruz..."
  );
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [moduleProgress, setModuleProgress] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [currentContentPage, setCurrentContentPage] = useState(0);
  const [viewedContentPages, setViewedContentPages] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadUserPlans().then((hasPlan) => {
          if (hasPlan) {
            setCurrentScreen("dashboard");
          } else {
            setCurrentScreen("questions");
          }
        });
      } else {
        setCurrentScreen("welcome");
      }
    }
  }, [user, authLoading, loadUserPlans]);

  const handleSignOut = async () => {
    try {
      clearLocalData();
      await signOut();
      setCurrentScreen("welcome");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
    }
  };

  const handleGeneratePlan = async () => {
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

      await generateLearningPlan(userData);
      clearInterval(loadingInterval);

      setLoadingText("Tamamlandı!");
      setLoadingProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentScreen("dashboard");
    } catch (error) {
      console.error("Error generating plan:", error);
      setLoadingText("Hata oluştu, lütfen tekrar deneyin...");

      await new Promise((resolve) => setTimeout(resolve, 2000));
      setCurrentScreen("questions");
    }
  };

  const handleModuleClick = (module: Module) => {
    if (module.unlocked || module.completed) {
      if (!module.contentPages || module.contentPages.length === 0) {
        console.error("Modül içeriği bulunamadı");
        return;
      }

      setCurrentContentPage(0);
      setViewedContentPages(new Set([0]));
      setModuleProgress(0);
      setCurrentModule(module);
      setCurrentScreen("module-content");
    }
  };

  const handleContentNext = () => {
    if (currentModule && currentContentPage < currentModule.contentPages.length - 1) {
      const nextPage = currentContentPage + 1;
      setCurrentContentPage(nextPage);
      setViewedContentPages((prev) => new Set([...prev, nextPage]));

      const totalPages = currentModule.contentPages.length;
      const viewedCount = viewedContentPages.size + 1;
      const progress = (viewedCount / totalPages) * 100;
      setModuleProgress(progress);
    } else {
      setCurrentScreen("module-test");
    }
  };

  const handleContentPrevious = () => {
    if (currentContentPage > 0) {
      setCurrentContentPage(currentContentPage - 1);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const submitTest = () => {
    const isCorrect = Math.random() > 0.5;
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
        if (feedback.trim()) {
          await saveFeedback(currentModule.id, feedback.trim());
        }

        await updateModuleCompletion(currentModule.id, true);

        setCurrentScreen("dashboard");
        setCurrentModule(null);
        setFeedback("");
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setSelectedAnswer("");
        setCurrentContentPage(0);
        setViewedContentPages(new Set());
        setModuleProgress(0);
      } catch (error) {
        console.error("Modül tamamlama hatası:", error);
      }
    }
  };

  const regeneratePlan = async () => {
    setShowRegenerateDialog(false);

    if (learningPlan?.id) {
      await deactivatePlan(learningPlan.id);
    }
    
    setCurrentScreen("questions");
  };

  // Render appropriate page based on current screen
  switch (currentScreen) {
    case "welcome":
      return <WelcomePage />;

    case "questions":
      return (
        <QuestionsPage
          userData={userData}
          setUserData={setUserData}
          onComplete={handleGeneratePlan}
        />
      );

    case "loading":
      return (
        <LoadingPage
          loadingText={loadingText}
          loadingProgress={loadingProgress}
        />
      );

    case "dashboard":
      if (!learningPlan) return null;
      return (
        <DashboardPage
          learningPlan={learningPlan}
          user={user}
          onSignOut={handleSignOut}
          onModuleClick={handleModuleClick}
          onRegeneratePlan={() => setShowRegenerateDialog(true)}
          showRegenerateDialog={showRegenerateDialog}
          onRegenerateConfirm={regeneratePlan}
        />
      );

    case "module-content":
      if (!currentModule) return null;
      return (
        <ModuleContentPage
          currentModule={currentModule}
          currentContentPage={currentContentPage}
          totalPages={currentModule.contentPages.length}
          contentProgress={moduleProgress}
          viewedContentPages={viewedContentPages}
          onPrevious={handleContentPrevious}
          onNext={handleContentNext}
          onBack={() => setCurrentScreen("dashboard")}
        />
      );

    case "module-test":
      if (!currentModule) return null;
      return (
        <ModuleTestPage
          currentModule={currentModule}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
          onSubmit={submitTest}
          onBack={() => setCurrentScreen("module-content")}
        />
      );

    case "module-complete":
      if (!currentModule) return null;
      return (
        <ModuleCompletePage
          currentModule={currentModule}
          correctAnswers={correctAnswers}
          wrongAnswers={wrongAnswers}
          feedback={feedback}
          onFeedbackChange={setFeedback}
          onComplete={completeModule}
        />
      );

    default:
      return null;
  }
}
