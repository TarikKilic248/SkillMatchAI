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

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
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

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
