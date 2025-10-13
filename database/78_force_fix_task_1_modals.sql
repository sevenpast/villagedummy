-- ============================================================================
-- FORCE FIX TASK 1 ALL MODAL TEXTS - ROBUST VERSION
-- ============================================================================

-- First, let's see what we have
SELECT 
  'BEFORE UPDATE - Current Task 1 Modals:' as info,
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

-- Get the task ID for Task 1
SELECT 
  'Task 1 ID:' as info,
  id as task_id,
  task_number,
  title
FROM public.tasks 
WHERE task_number = 1;

-- Force update visa_exempt modal content (using task_id directly)
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'visa_exempt' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

-- Force update visa_required modal content
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your application with your employer. Once it''s approved by the authorities, you must contact the Swiss embassy/consulate in your home country to obtain a D visa before traveling.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'visa_required' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

-- Force update no_info modal content
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Please update your profile with your country of origin so we can give you the exact next steps.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'no_info' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

-- Force update eu_efta modal content
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

-- Verify all updates
SELECT 
  'AFTER UPDATE - Task 1 Modal Updates Verification:' as info,
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

