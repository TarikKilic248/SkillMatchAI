-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_plans table
CREATE TABLE IF NOT EXISTS learning_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  learning_goal TEXT NOT NULL,
  daily_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  learning_style TEXT NOT NULL,
  target_level TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES learning_plans(id) ON DELETE CASCADE NOT NULL,
  module_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT[] DEFAULT '{}',
  resources TEXT[] DEFAULT '{}',
  quiz_question TEXT NOT NULL,
  quiz_options TEXT[],
  quiz_type TEXT CHECK (quiz_type IN ('multiple', 'open')) NOT NULL,
  module_type TEXT CHECK (module_type IN ('lesson', 'quiz', 'exam')) NOT NULL,
  completed BOOLEAN DEFAULT false,
  unlocked BOOLEAN DEFAULT false,
  position_x NUMERIC DEFAULT 50,
  position_y NUMERIC DEFAULT 50,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  content_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_feedbacks table
CREATE TABLE IF NOT EXISTS user_feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create module_contents table for adaptive content
CREATE TABLE IF NOT EXISTS module_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT CHECK (content_type IN ('introduction', 'detailed_explanation', 'practical_task', 'summary_evaluation')) NOT NULL,
  content_data JSONB NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, content_type)
);

-- Create student_progress table for tracking learning performance
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  understanding_level INTEGER CHECK (understanding_level BETWEEN 1 AND 5) DEFAULT 3,
  completion_time INTEGER, -- in minutes
  struggled_concepts TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  performance_score NUMERIC(3,2) CHECK (performance_score BETWEEN 0 AND 100),
  next_module_difficulty TEXT CHECK (next_module_difficulty IN ('easier', 'same', 'harder')) DEFAULT 'same',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Create practical_tasks table for interactive assignments
CREATE TABLE IF NOT EXISTS practical_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  instructions TEXT[] DEFAULT '{}',
  completion_criteria TEXT[] DEFAULT '{}',
  interaction_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_submissions table for student task completions
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES practical_tasks(id) ON DELETE CASCADE NOT NULL,
  submission_data JSONB NOT NULL,
  completion_status TEXT CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'needs_review')) DEFAULT 'not_started',
  ai_feedback TEXT,
  completion_score NUMERIC(3,2) CHECK (completion_score BETWEEN 0 AND 100),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_learning_plans_updated_at ON learning_plans;
CREATE TRIGGER update_learning_plans_updated_at 
    BEFORE UPDATE ON learning_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
CREATE TRIGGER update_modules_updated_at 
    BEFORE UPDATE ON modules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_contents_updated_at ON module_contents;
CREATE TRIGGER update_module_contents_updated_at 
    BEFORE UPDATE ON module_contents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_progress_updated_at ON student_progress;
CREATE TRIGGER update_student_progress_updated_at 
    BEFORE UPDATE ON student_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practical_tasks_updated_at ON practical_tasks;
CREATE TRIGGER update_practical_tasks_updated_at 
    BEFORE UPDATE ON practical_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_submissions_updated_at ON task_submissions;
CREATE TRIGGER update_task_submissions_updated_at 
    BEFORE UPDATE ON task_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practical_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own learning plans" ON learning_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view modules of their plans" ON modules
    FOR SELECT USING (
        plan_id IN (
            SELECT id FROM learning_plans WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update modules of their plans" ON modules
    FOR UPDATE USING (
        plan_id IN (
            SELECT id FROM learning_plans WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own feedbacks" ON user_feedbacks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view module contents for their modules" ON module_contents
    FOR SELECT USING (
        module_id IN (
            SELECT m.id FROM modules m
            JOIN learning_plans lp ON m.plan_id = lp.id
            WHERE lp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own progress" ON student_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view practical tasks for their modules" ON practical_tasks
    FOR SELECT USING (
        module_id IN (
            SELECT m.id FROM modules m
            JOIN learning_plans lp ON m.plan_id = lp.id
            WHERE lp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own task submissions" ON task_submissions
    FOR ALL USING (auth.uid() = user_id);
ALTER TABLE user_feedbacks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can insert own learning plans" ON learning_plans;
DROP POLICY IF EXISTS "Users can view own learning plans" ON learning_plans;
DROP POLICY IF EXISTS "Users can update own learning plans" ON learning_plans;

DROP POLICY IF EXISTS "Users can view own modules" ON modules;
DROP POLICY IF EXISTS "Users can update own modules" ON modules;

DROP POLICY IF EXISTS "Users can insert own feedback" ON user_feedbacks;
DROP POLICY IF EXISTS "Users can view own feedback" ON user_feedbacks;

-- Create policies for profiles
CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for learning_plans
CREATE POLICY "Users can insert own learning plans" ON learning_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own learning plans" ON learning_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own learning plans" ON learning_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for modules
CREATE POLICY "Users can view own modules" ON modules
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM learning_plans WHERE id = modules.plan_id
    ));

CREATE POLICY "Users can update own modules" ON modules
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM learning_plans WHERE id = modules.plan_id
    ));

-- Create policies for user_feedbacks
CREATE POLICY "Users can insert own feedback" ON user_feedbacks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON user_feedbacks
    FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle new user signup with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if profile doesn't already exist
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
