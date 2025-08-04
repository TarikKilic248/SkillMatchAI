"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiArrowLeft, FiArrowRight, FiEye, FiVideo, FiHeadphones, FiPlay } from "react-icons/fi";
import { Module } from "@/lib/types";
import { getContentIcon, getContentTypeLabel } from "@/lib/utils";

interface ModuleContentPageProps {
  currentModule: Module;
  currentContentPage: number;
  totalPages: number;
  contentProgress: number;
  viewedContentPages: Set<number>;
  onPrevious: () => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ModuleContentPage({
  currentModule,
  currentContentPage,
  totalPages,
  contentProgress,
  viewedContentPages,
  onPrevious,
  onNext,
  onBack,
}: ModuleContentPageProps) {
  const currentContent = currentModule.contentPages[currentContentPage];

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
                    <FiEye className="w-4 h-4" />
                    <span>{currentContent.duration} dakika</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-8">
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed">
                {currentContent.content}
              </p>
            </div>

            {/* Content Type Specific Elements */}
            {currentContent.type === "video" && (
              <div className="mt-8 bg-slate-100 rounded-xl p-8 text-center">
                <FiVideo className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600">
                  Video içeriği burada görüntülenecek
                </p>
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
                <p className="text-slate-700 font-medium">
                  İnteraktif içerik burada yer alacak
                </p>
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
            onClick={onPrevious}
            disabled={currentContentPage === 0}
            variant="outline-modern"
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
            onClick={onNext}
            variant="modern"
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