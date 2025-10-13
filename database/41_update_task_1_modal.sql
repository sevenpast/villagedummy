-- ============================================================================
-- UPDATE TASK 1 MODAL CONTENT
-- ============================================================================

-- Update Task 1 modal with the new content
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.

We''ll remind you to check on the status:',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);

-- Also update the other variants for Task 1
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.

We''ll remind you to check on the status:',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 1)
AND variant_name IN ('visa_required', 'profile_incomplete');

-- Verify the updates
SELECT 
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
