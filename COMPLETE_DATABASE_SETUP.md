# 🚀 COMPLETE DATABASE SETUP - Village App

## The Problem
Your database is **NOT configured** for the `user_profiles` table. That's why you're getting permission errors.

## The Solution (3 minutes)

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your **Village project**
3. Click **SQL Editor** in the left menu

### Step 2: Run the Complete Setup
Copy this **entire code block** and paste it into the SQL Editor:

```sql
-- COMPLETE DATABASE SETUP FOR VILLAGE APP
-- This migration sets up everything needed for the user_profiles functionality

-- Step 1: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    gender TEXT CHECK (gender IN ('female', 'male', 'non-binary', 'other', 'prefer-not-to-say')),
    moved_to_switzerland DATE,
    planning_to_stay TEXT CHECK (planning_to_stay IN ('<1', '1-3', '3+', 'not-sure')),
    country_of_origin TEXT,
    last_residence_country TEXT,
    date_of_birth DATE,
    living_with TEXT CHECK (living_with IN ('alone', 'partner', 'family', 'roommates', 'other')),
    home_address TEXT,
    work_address TEXT,
    has_children BOOLEAN DEFAULT FALSE,
    children_ages TEXT,
    current_situation TEXT CHECK (current_situation IN ('student', 'working', 'freelancer', 'entrepreneur', 'retired', 'looking-for-work', 'other')),
    interests TEXT,
    primary_language TEXT CHECK (primary_language IN ('german', 'english', 'french', 'italian', 'spanish', 'other')),
    about_me TEXT,
    profile_image_url TEXT,
    postal_code TEXT,
    municipality TEXT,
    canton TEXT,
    family_status TEXT CHECK (family_status IN ('single', 'married', 'divorced', 'widowed', 'other')),
    arrival_date DATE,
    work_permit_type TEXT,
    language_preference TEXT DEFAULT 'de',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add columns one by one to avoid conflicts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'gender') THEN
        ALTER TABLE user_profiles ADD COLUMN gender TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'moved_to_switzerland') THEN
        ALTER TABLE user_profiles ADD COLUMN moved_to_switzerland DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'planning_to_stay') THEN
        ALTER TABLE user_profiles ADD COLUMN planning_to_stay TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_residence_country') THEN
        ALTER TABLE user_profiles ADD COLUMN last_residence_country TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE user_profiles ADD COLUMN date_of_birth DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'living_with') THEN
        ALTER TABLE user_profiles ADD COLUMN living_with TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'home_address') THEN
        ALTER TABLE user_profiles ADD COLUMN home_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'work_address') THEN
        ALTER TABLE user_profiles ADD COLUMN work_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'children_ages') THEN
        ALTER TABLE user_profiles ADD COLUMN children_ages TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_situation') THEN
        ALTER TABLE user_profiles ADD COLUMN current_situation TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'interests') THEN
        ALTER TABLE user_profiles ADD COLUMN interests TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'primary_language') THEN
        ALTER TABLE user_profiles ADD COLUMN primary_language TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'about_me') THEN
        ALTER TABLE user_profiles ADD COLUMN about_me TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'profile_image_url') THEN
        ALTER TABLE user_profiles ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;

-- Step 3: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing policies (clean slate)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON user_profiles';
    END LOOP;
END $$;

-- Step 5: Create RLS policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Step 8: Verify setup
SELECT 'SETUP COMPLETE ✅' as status;
SELECT 'Table exists: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN 'YES ✅' ELSE 'NO ❌' END as table_check;
SELECT 'RLS enabled: ' || CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN 'YES ✅' ELSE 'NO ❌' END as rls_check;
SELECT 'Policies exist: ' || CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles') THEN 'YES ✅' ELSE 'NO ❌' END as policy_check;
SELECT 'Policies count: ' || COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'user_profiles';
```

### Step 3: Click "Run"
Click the **Run** button in the SQL Editor.

### Step 4: Check the Results
You should see:
- ✅ **SETUP COMPLETE**
- ✅ **Table exists: YES**
- ✅ **RLS enabled: YES**
- ✅ **Policies exist: YES**
- ✅ **Policies count: 4**

### Step 5: Test Your App
1. Go to `http://localhost:3002/profile`
2. Fill out the profile form
3. Click "Save Profile"
4. **It should work now!** ✅

## What This Setup Does

### ✅ **Creates the Table**
- `user_profiles` table with all necessary columns
- Proper data types and constraints
- Foreign key relationship to `auth.users`

### ✅ **Sets Up Security**
- Row Level Security (RLS) enabled
- 4 policies: SELECT, INSERT, UPDATE, DELETE
- Users can only access their own profiles

### ✅ **Grants Permissions**
- `authenticated` users can read/write
- `anon` users can read/write (for signup)
- Proper database permissions

### ✅ **Optimizes Performance**
- Indexes on `user_id` and `email`
- Efficient queries

## Troubleshooting

### If you get errors:
1. **Make sure you're in the right project** in Supabase
2. **Check that you copied the entire code block**
3. **Look at the error message** - it will tell you what's wrong

### If it still doesn't work:
1. **Check the browser console** for error messages
2. **Make sure you're logged in** to the app
3. **Try refreshing the page** after running the migration

## Success! 🎉
After running this migration, your Village app will have a fully functional profile system with proper database security and permissions.
