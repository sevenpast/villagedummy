-- ============================================================================
-- FIX TARGET_SEGMENTS JSONB ARRAY FORMATTING ERROR
-- ============================================================================

-- First, let's check what's in the target_segments column
SELECT 
  id,
  variant_name,
  target_segments,
  pg_typeof(target_segments) as data_type
FROM public.task_variants 
WHERE target_segments IS NOT NULL;

-- Fix any malformed target_segments by updating them to proper JSONB arrays
UPDATE public.task_variants 
SET target_segments = '["eu_efta"]'::jsonb
WHERE variant_name = 'eu_efta' 
  AND (target_segments IS NULL OR target_segments::text NOT LIKE '[%');

UPDATE public.task_variants 
SET target_segments = '["visa_exempt"]'::jsonb
WHERE variant_name = 'visa_exempt' 
  AND (target_segments IS NULL OR target_segments::text NOT LIKE '[%');

UPDATE public.task_variants 
SET target_segments = '["visa_required"]'::jsonb
WHERE variant_name = 'visa_required' 
  AND (target_segments IS NULL OR target_segments::text NOT LIKE '[%');

UPDATE public.task_variants 
SET target_segments = '["no_info"]'::jsonb
WHERE variant_name = 'no_info' 
  AND (target_segments IS NULL OR target_segments::text NOT LIKE '[%');

-- Also fix any variants that might have "non_eu_visa_required" instead of "visa_required"
UPDATE public.task_variants 
SET target_segments = '["visa_required"]'::jsonb
WHERE target_segments::text LIKE '%non_eu_visa_required%';

-- Verify the fixes
SELECT 
  id,
  variant_name,
  target_segments,
  pg_typeof(target_segments) as data_type
FROM public.task_variants 
WHERE target_segments IS NOT NULL
ORDER BY variant_name;

-- Test the get_user_tasks function
SELECT 'TARGET_SEGMENTS FIXED:' as status, 'All target_segments are now proper JSONB arrays' as message;
