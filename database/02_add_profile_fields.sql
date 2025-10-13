-- Add missing profile fields to user_profiles table
-- This migration adds all the fields from the profile form

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS moved_to_switzerland DATE,
ADD COLUMN IF NOT EXISTS planning_to_stay TEXT,
ADD COLUMN IF NOT EXISTS last_residence_country TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS living_with TEXT,
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS work_address TEXT,
ADD COLUMN IF NOT EXISTS children_ages TEXT,
ADD COLUMN IF NOT EXISTS current_situation TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS primary_language TEXT,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add check constraints for the new columns
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_gender_check CHECK (gender IN ('female', 'male', 'non-binary', 'other', 'prefer-not-to-say'));

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_planning_to_stay_check CHECK (planning_to_stay IN ('<1', '1-3', '3+', 'not-sure'));

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_living_with_check CHECK (living_with IN ('alone', 'partner', 'family', 'roommates', 'other'));

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_current_situation_check CHECK (current_situation IN ('student', 'working', 'freelancer', 'entrepreneur', 'retired', 'looking-for-work', 'other'));

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_primary_language_check CHECK (primary_language IN ('german', 'english', 'french', 'italian', 'spanish', 'other'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_postal_code ON user_profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_municipality ON user_profiles(municipality);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country_of_origin ON user_profiles(country_of_origin);

-- Add RLS policies for user_profiles (only if they don't exist)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own profile
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON user_profiles
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON user_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON user_profiles
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can delete own profile') THEN
        CREATE POLICY "Users can delete own profile" ON user_profiles
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
