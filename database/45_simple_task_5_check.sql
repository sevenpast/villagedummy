-- ============================================================================
-- SIMPLE TASK 5 CHECK - STEP BY STEP
-- ============================================================================

-- 1. Check if Task 5 exists
SELECT 'Task 5 exists:' as check_type, COUNT(*) as count
FROM public.tasks 
WHERE task_number = 5;

-- 2. Check Task 5 variants
SELECT 'Task 5 variants:' as check_type, variant_name, modal_has_email_generator
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 5;

-- 3. Check if column exists
SELECT 'Column exists:' as check_type, column_name
FROM information_schema.columns 
WHERE table_name = 'task_variants' 
AND column_name = 'modal_has_email_generator';

-- 4. Show current Task 5 modal settings
SELECT 
  'Current settings:' as check_type,
  t.task_number,
  tv.variant_name,
  tv.modal_title,
  tv.modal_has_reminder,
  tv.modal_has_email_generator,
  tv.modal_content
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;
