-- ============================================================================
-- DEBUG TASK 1 MODAL CONTENT
-- ============================================================================

-- Check current modal content for all Task 1 variants
SELECT 
  'Current Task 1 Modal Content:' as info,
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_title,
  tv.modal_content,
  tv.modal_has_reminder
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Check if there are multiple Task 1 entries
SELECT 
  'Task 1 Count Check:' as info,
  COUNT(*) as task_count
FROM public.tasks 
WHERE task_number = 1;

-- Check if there are multiple Task 1 variants
SELECT 
  'Task 1 Variants Count:' as info,
  COUNT(*) as variant_count
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1;

-- Force update the modal content for visa_required
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your application with your employer. Once it''s approved by the authorities, you must contact the Swiss embassy/consulate in your home country to obtain a D visa before traveling.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'visa_required' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);

-- Verify the update
SELECT 
  'After Update - visa_required:' as info,
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_content
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 1 AND tv.variant_name = 'visa_required';

