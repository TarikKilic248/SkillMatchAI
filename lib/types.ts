export interface UserData {
  learningGoal: string;
  dailyTime: string;
  duration: string;
  learningStyle: string;
  targetLevel: string;
}

export interface ContentPage {
  id: string;
  title: string;
  type: "text" | "video" | "audio" | "interactive";
  content: string;
  duration: number; // minutes
}

export interface Module {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  resources: string[];
  contentPages: ContentPage[];
  quiz: {
    question: string;
    options?: string[];
    type: "multiple" | "open";
  };
  completed: boolean;
  unlocked: boolean;
  position: { x: number; y: number };
  type: "lesson" | "quiz" | "exam";
}

export interface LearningPlan {
  id?: string;
  title: string;
  modules: Module[];
  learningGoal?: string;
  dailyTime?: string;
  duration?: string;
  learningStyle?: string;
  targetLevel?: string;
}

export type ScreenType = 
  | "welcome"
  | "questions"
  | "loading"
  | "dashboard"
  | "module"
  | "module-content"
  | "module-test"
  | "module-complete"; 