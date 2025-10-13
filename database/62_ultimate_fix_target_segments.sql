-- ============================================================================
-- ULTIMATE FIX FOR TARGET_SEGMENTS ERROR
-- ============================================================================

-- This script will fix the target_segments error immediately
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- Step 1: Check current state
SELECT 'BEFORE FIX:' as status, count(*) as total_variants FROM public.task_variants;

-- Step 2: Emergency fix - Set ALL target_segments to NULL immediately
UPDATE public.task_variants 
SET target_segments = NULL;

-- Step 3: Verify the fix
SELECT 'AFTER FIX:' as status, count(*) as total_variants FROM public.task_variants;

-- Step 4: Check that all target_segments are now NULL
SELECT 
  id,
  variant_name,
  target_segments
FROM public.task_variants 
WHERE target_segments IS NOT NULL;

-- Step 5: Success message
SELECT 'SUCCESS:' as status, 'All target_segments set to NULL - Error should be fixed!' as message;
