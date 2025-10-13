-- ============================================================================
-- FIX TARGET SEGMENTS FOR TASK 1 VARIANTS
-- ============================================================================

-- Check current target_segments
SELECT 
  'Current Task 1 Variants with target_segments:' as info,
  tv.variant_name,
  tv.target_segments,
  tv.modal_content
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Update target_segments for all variants to be more comprehensive
UPDATE public.task_variants 
SET 
  target_segments = '["eu_efta"]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

UPDATE public.task_variants 
SET 
  target_segments = '["visa_exempt"]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'visa_exempt' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

UPDATE public.task_variants 
SET 
  target_segments = '["visa_required"]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'visa_required' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

UPDATE public.task_variants 
SET 
  target_segments = '["no_info", "other", "select country", ""]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'no_info' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

-- Verify the updates
SELECT 
  'Updated Task 1 Variants with target_segments:' as info,
  tv.variant_name,
  tv.target_segments,
  tv.modal_content
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

