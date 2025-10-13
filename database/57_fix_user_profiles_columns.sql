-- ============================================================================
-- FIX USER_PROFILES COLUMNS FOR TASK 3
-- ============================================================================

-- Ensure all required columns exist in user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS canton TEXT,
ADD COLUMN IF NOT EXISTS municipality TEXT,
ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false;

-- Verify the columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('canton', 'municipality', 'has_children')
ORDER BY column_name;

-- Test query to make sure the columns are accessible
SELECT 'TEST QUERY:' as status, 'user_profiles columns are accessible' as message;
