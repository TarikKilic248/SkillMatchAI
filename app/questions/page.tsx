"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiArrowRight, FiArrowLeft, FiStar } from "react-icons/fi";
import { UserData } from "@/lib/types";
import { questions } from "@/lib/questions";

interface QuestionsPageProps {
  userData: UserData;
  setUserData: (data: UserData) => void;
  onComplete: () => void;
}

export default function QuestionsPage({ userData, setUserData, onComplete }: QuestionsPageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setIsAnimating(true);
      setSlideDirection("right");
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
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
                variant="outline-modern"
                className="px-6 py-3 rounded-xl disabled:opacity-50"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <Button
                onClick={handleNext}
                disabled={!userData[currentQ.field]}
                variant="modern"
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