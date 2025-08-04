"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FiBookOpen,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiUserPlus,
  FiLogIn,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

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