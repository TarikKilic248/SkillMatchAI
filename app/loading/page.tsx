"use client";

import { Card, CardContent } from "@/components/ui/card";

interface LoadingPageProps {
  loadingText: string;
  loadingProgress: number;
}

export default function LoadingPage({ loadingText, loadingProgress }: LoadingPageProps) {
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
              <div className="spinner-modern"></div>
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