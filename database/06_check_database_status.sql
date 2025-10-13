-- Check database status and configuration
-- This will help us understand what's configured and what's missing

-- 1. Check if user_profiles table exists
SELECT 
    table_name, 
    table_schema,
    CASE 
        WHEN table_name = 'user_profiles' THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- 2. Check if RLS is enabled on user_profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN 'ENABLED ✅'
        ELSE 'DISABLED ❌'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 3. Check existing policies on user_profiles
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname IS NOT NULL THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if we have any data
SELECT COUNT(*) as user_count FROM user_profiles;

-- 6. Summary
SELECT 
    'SUMMARY' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
        THEN 'Table exists'
        ELSE 'Table missing'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true)
        THEN 'RLS enabled'
        ELSE 'RLS disabled'
    END as rls_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles')
        THEN 'Policies exist'
        ELSE 'No policies'
    END as policy_status;
