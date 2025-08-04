"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FiAward,
  FiTarget,
  FiBookmark,
  FiPlay,
  FiCheckCircle,
  FiStar,
} from "react-icons/fi";
import { FaBrain } from "react-icons/fa";
import { Module } from "@/lib/types";

interface ModuleCompletePageProps {
  currentModule: Module;
  correctAnswers: number;
  wrongAnswers: number;
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  onComplete: () => void;
}

export default function ModuleCompletePage({
  currentModule,
  correctAnswers,
  wrongAnswers,
  feedback,
  onFeedbackChange,
  onComplete,
}: ModuleCompletePageProps) {
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
              <h3 className="text-lg font-semibold text-slate-800">
                Kaynaklar
              </h3>
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
            onChange={(e) => onFeedbackChange(e.target.value)}
            className="input-modern min-h-32 resize-none"
          />
          <p className="text-sm text-slate-500 mt-2">
            Geri bildiriminiz gelişimimize katkı sağlar ve diğer öğrenciler
            için faydalıdır.
          </p>
        </div>

        {/* Complete Button */}
        <div className="text-center">
          <Button
            onClick={onComplete}
            variant="modern"
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