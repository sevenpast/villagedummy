# 🔧 Database Permission Fix Instructions

## Problem
The error "permission denied for schema public" indicates that the Row Level Security (RLS) policies are not properly configured for the `user_profiles` table.

## Solution
You need to run the database migration in your Supabase project.

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Village project
3. Go to **SQL Editor** in the left sidebar

### Step 2: Run the Migration
Copy and paste the following SQL code into the SQL Editor and click **Run**:

```sql
-- Fix RLS policies specifically for user_profiles table
-- This migration only fixes the permissions without recreating the table

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_profiles;

-- Create new RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- Ensure the table has proper indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Verify the policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

### Step 3: Verify the Fix
After running the migration:
1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Make sure you have a test user account
3. Go back to your application at `http://localhost:3002/profile`
4. Try to save the profile form

### Expected Result
- ✅ No more "permission denied" errors
- ✅ Profile data saves successfully
- ✅ User can view and edit their own profile

## Alternative: Check Current Policies
If you want to see what policies currently exist, run this query in the SQL Editor:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

## Troubleshooting
If you still get errors:
1. Make sure you're logged in as the correct user
2. Check that the `user_profiles` table exists in **Table Editor**
3. Verify that RLS is enabled for the table
4. Check the browser console for more detailed error messages
