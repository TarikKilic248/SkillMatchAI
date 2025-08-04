import { FiTarget, FiClock, FiCalendar, FiTrendingUp } from "react-icons/fi";
import { FaBrain } from "react-icons/fa";
import { UserData } from "./types";

export interface Question {
  title: string;
  subtitle: string;
  field: keyof UserData;
  type: "input" | "select";
  placeholder?: string;
  options?: Array<{ value: string; label: string; desc: string }>;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

export const questions: Question[] = [
  {
    title: "Öğrenme Hedefin",
    subtitle: "Hangi alanda uzmanlaşmak istiyorsun?",
    field: "learningGoal",
    type: "input",
    placeholder: "Örnek: Frontend geliştirme uzmanı olmak",
    icon: FiTarget,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Günlük Zaman",
    subtitle: "Öğrenmeye ne kadar zaman ayırabilirsin?",
    field: "dailyTime",
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
    field: "duration",
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
    field: "learningStyle",
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
    field: "targetLevel",
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