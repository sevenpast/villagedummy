-- ============================================================================
-- UPDATE TASK 5 MODAL - REMOVE EMAIL GENERATOR TEXT (NOW IT'S A BUTTON)
-- ============================================================================

-- Update Task 5 modal to remove the email generator text since it's now a button
UPDATE public.task_variants 
SET 
  modal_content = 'If you haven''t received your biometric appointment letter 3 weeks after registration, consider contacting your cantonal migration office.

Tip: Keep the biometric appointment letter safe: you''ll need it for the appointment.

Reminder
We''ll remind you to check on the status:',
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true
WHERE variant_name = 'all_users' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 5);

-- Verify the update
SELECT 
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_title,
  tv.modal_content,
  tv.modal_has_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;
