import React from "react";
import { FiBookOpen, FiCheckCircle, FiCircle, FiAward, FiVideo, FiHeadphones, FiPlay, FiFileText } from "react-icons/fi";
import { FaBrain } from "react-icons/fa";
import { Module } from "./types";

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const getModuleIcon = (
  type: string,
  completed: boolean,
  unlocked: boolean
): React.ReactElement => {
  if (completed)
    return <FiCheckCircle className="w-6 h-6 text-emerald-400" />;
  if (!unlocked) return <FiCircle className="w-6 h-6 text-slate-400" />;

  switch (type) {
    case "quiz":
      return <FaBrain className="w-6 h-6 text-violet-400" />;
    case "exam":
      return <FiAward className="w-6 h-6 text-amber-400" />;
    default:
      return <FiBookOpen className="w-6 h-6 text-sky-400" />;
  }
};

export const getContentIcon = (type: string): React.ReactElement => {
  switch (type) {
    case "video":
      return <FiVideo className="w-5 h-5" />;
    case "audio":
      return <FiHeadphones className="w-5 h-5" />;
    case "interactive":
      return <FiPlay className="w-5 h-5" />;
    default:
      return <FiFileText className="w-5 h-5" />;
  }
};

export const getContentTypeLabel = (type: string): string => {
  switch (type) {
    case "video":
      return "Video İçerik";
    case "audio":
      return "Ses İçeriği";
    case "interactive":
      return "İnteraktif İçerik";
    default:
      return "Metin İçeriği";
  }
};

export const getNumericId = (id: string): number => {
  const match = id.match(/\d+/);
  return match ? Number.parseInt(match[0]) : 0;
}; 