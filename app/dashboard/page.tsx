"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  FiTrendingUp,
  FiPlay,
  FiCheckCircle,
  FiCircle,
  FiRotateCcw,
  FiArrowRight,
  FiLogIn,
  FiAward,
  FiPlus,
} from "react-icons/fi";
import { LearningPlan, Module } from "@/lib/types";
import { getModuleIcon } from "@/lib/utils";

interface DashboardPageProps {
  learningPlan: LearningPlan;
  user: any;
  onSignOut: () => void;
  onModuleClick: (module: Module) => void;
  onRegeneratePlan: () => void;
  showRegenerateDialog: boolean;
  onRegenerateConfirm: () => void;
}

export default function DashboardPage({
  learningPlan,
  user,
  onSignOut,
  onModuleClick,
  onRegeneratePlan,
  showRegenerateDialog,
  onRegenerateConfirm,
}: DashboardPageProps) {
  const completedCount = learningPlan.modules.filter(
    (m) => m.completed
  ).length;
  const totalCount = learningPlan.modules.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const sequentialModules = learningPlan.modules;

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
                onClick={onSignOut}
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
              onClick={onRegeneratePlan}
              variant="outline-modern"
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
                    onClick={onRegeneratePlan}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Yeni Plan Oluştur
                  </Button>
                  <Button
                    onClick={onRegeneratePlan}
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
              const canReopen = module.completed;

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
                    (module.unlocked || canReopen) && onModuleClick(module)
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
                            module.type === "quiz"
                              ? "bg-purple-500 text-white"
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
                    onClick={onRegeneratePlan}
                    variant="modern"
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

      {/* Regenerate Dialog */}
      <AlertDialog
        open={showRegenerateDialog}
        onOpenChange={onRegeneratePlan}
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
              onClick={onRegenerateConfirm}
              variant="modern"
              className="text-white"
            >
              Evet, Yeniden Oluştur
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
