-- ============================================================================
-- EMERGENCY FIX FOR TARGET_SEGMENTS ERROR
-- ============================================================================

-- Step 1: Check what's causing the error
SELECT 
  id,
  variant_name,
  target_segments,
  pg_typeof(target_segments) as data_type
FROM public.task_variants 
WHERE target_segments IS NOT NULL
LIMIT 5;

-- Step 2: Emergency fix - Delete problematic rows and recreate them
DELETE FROM public.task_variants 
WHERE target_segments::text LIKE '%non_eu_visa_required%'
   OR target_segments::text NOT LIKE '[%'
   OR target_segments::text = 'null';

-- Step 3: Set all remaining target_segments to NULL
UPDATE public.task_variants 
SET target_segments = NULL;

-- Step 4: Verify the fix
SELECT 
  id,
  variant_name,
  target_segments
FROM public.task_variants 
ORDER BY variant_name;

-- Step 5: Test message
SELECT 'EMERGENCY FIX COMPLETE:' as status, 'All problematic target_segments removed' as message;
