-- ============================================================================
-- DEBUG TASK 5 MODAL SETTINGS
-- ============================================================================

-- Check Task 5 modal settings
SELECT 
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_title,
  tv.modal_content,
  tv.modal_has_reminder,
  tv.modal_default_reminder_days,
  tv.modal_has_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;

-- Check if the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_variants' 
AND column_name = 'modal_has_email_generator';

-- Check all task variants for Task 5
SELECT 
  tv.id,
  tv.variant_name,
  tv.modal_has_email_generator,
  tv.modal_has_reminder
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 5;
