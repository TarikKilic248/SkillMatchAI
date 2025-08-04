"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { FaBrain } from "react-icons/fa";
import { Module } from "@/lib/types";

interface ModuleTestPageProps {
  currentModule: Module;
  selectedAnswer: string;
  onAnswerSelect: (answer: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function ModuleTestPage({
  currentModule,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  onBack,
}: ModuleTestPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="outline-modern"
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
                      onClick={() => onAnswerSelect(option)}
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
                    onChange={(e) => onAnswerSelect(e.target.value)}
                    className="input-modern min-h-32 resize-none"
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
                onClick={onSubmit}
                disabled={!selectedAnswer}
                variant="modern"
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