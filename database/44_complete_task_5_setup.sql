-- ============================================================================
-- COMPLETE TASK 5 SETUP - ALL STEPS IN ORDER
-- ============================================================================

-- Step 1: Add the missing column if it doesn't exist
ALTER TABLE public.task_variants 
ADD COLUMN IF NOT EXISTS modal_has_email_generator BOOLEAN DEFAULT false;

-- Step 2: Update Task 5 modal with email generator enabled
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'If you haven''t received your biometric appointment letter 3 weeks after registration, consider contacting your cantonal migration office.

Tip: Keep the biometric appointment letter safe: you''ll need it for the appointment.

Reminder
We''ll remind you to check on the status:',
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true
WHERE variant_name = 'all_users' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 5);

-- Step 3: Verify the setup
SELECT 
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_title,
  tv.modal_has_reminder,
  tv.modal_has_email_generator,
  CASE 
    WHEN tv.modal_has_email_generator = true THEN '✅ Email Generator ENABLED'
    ELSE '❌ Email Generator DISABLED'
  END as email_generator_status
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;

-- Step 4: Show the modal content (truncated for readability)
SELECT 
  t.task_number,
  tv.variant_name,
  LEFT(tv.modal_content, 100) || '...' as modal_content_preview
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;
