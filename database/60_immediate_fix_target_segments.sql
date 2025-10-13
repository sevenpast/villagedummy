-- ============================================================================
-- IMMEDIATE FIX FOR TARGET_SEGMENTS ERROR
-- ============================================================================

-- Quick fix: Set all target_segments to NULL to avoid the JSONB error
UPDATE public.task_variants 
SET target_segments = NULL
WHERE target_segments IS NOT NULL;

-- Verify the fix
SELECT 
  id,
  variant_name,
  target_segments
FROM public.task_variants 
ORDER BY variant_name;

-- Test message
SELECT 'TARGET_SEGMENTS FIXED:' as status, 'All target_segments set to NULL to avoid JSONB errors' as message;
