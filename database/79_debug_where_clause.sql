-- ============================================================================
-- DEBUG WHERE CLAUSE - CHECK EXACT VALUES
-- ============================================================================

-- Check all Task 1 entries
SELECT 
  'All Task 1 Entries:' as info,
  id as task_id,
  task_number,
  title
FROM public.tasks 
WHERE task_number = 1;

-- Check all Task 1 variants with exact variant names
SELECT 
  'All Task 1 Variants:' as info,
  tv.id as variant_id,
  tv.variant_name,
  tv.task_id,
  t.task_number,
  t.title
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Check exact variant names (with quotes to see any hidden characters)
SELECT 
  'Variant Names with Quotes:' as info,
  '''' || tv.variant_name || '''' as variant_name_quoted,
  tv.variant_name,
  tv.modal_content
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Check if there are any variants with similar names
SELECT 
  'Similar Variant Names:' as info,
  tv.variant_name,
  LENGTH(tv.variant_name) as name_length,
  tv.modal_content
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
  AND (tv.variant_name LIKE '%visa%' OR tv.variant_name LIKE '%eu%' OR tv.variant_name LIKE '%no%')
ORDER BY tv.variant_name;

-- Test the WHERE clause step by step
SELECT 
  'Testing WHERE clause for visa_required:' as info,
  tv.variant_name = 'visa_required' as exact_match,
  tv.variant_name,
  tv.task_id,
  (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1) as expected_task_id,
  tv.task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1) as task_id_match
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

