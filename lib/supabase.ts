import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      learning_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          learning_goal: string
          daily_time: string
          duration: string
          learning_style: string
          target_level: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          learning_goal: string
          daily_time: string
          duration: string
          learning_style: string
          target_level: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          learning_goal?: string
          daily_time?: string
          duration?: string
          learning_style?: string
          target_level?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          plan_id: string
          module_order: number
          title: string
          description: string
          objectives: string[]
          resources: string[]
          quiz_question: string
          quiz_options: string[] | null
          quiz_type: "multiple" | "open"
          module_type: "lesson" | "quiz" | "exam"
          completed: boolean
          unlocked: boolean
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          module_order: number
          title: string
          description: string
          objectives?: string[]
          resources?: string[]
          quiz_question: string
          quiz_options?: string[] | null
          quiz_type: "multiple" | "open"
          module_type: "lesson" | "quiz" | "exam"
          completed?: boolean
          unlocked?: boolean
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          module_order?: number
          title?: string
          description?: string
          objectives?: string[]
          resources?: string[]
          quiz_question?: string
          quiz_options?: string[] | null
          quiz_type?: "multiple" | "open"
          module_type?: "lesson" | "quiz" | "exam"
          completed?: boolean
          unlocked?: boolean
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_feedbacks: {
        Row: {
          id: string
          user_id: string
          module_id: string
          feedback: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          feedback: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          feedback?: string
          created_at?: string
        }
      }
    }
  }
}
