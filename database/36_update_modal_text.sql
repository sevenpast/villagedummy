-- ============================================================================
-- UPDATE MODAL TEXT FOR TASK REMINDERS
-- ============================================================================

-- Update the modal text for the EU/EFTA variant of Task 1
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'We''ll remind you to check on the status.'
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);

-- Verify the update
SELECT 
  variant_name,
  modal_title,
  modal_content
FROM public.task_variants 
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);
