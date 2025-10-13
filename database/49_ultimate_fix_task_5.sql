-- ============================================================================
-- ULTIMATE FIX TASK 5 - GUARANTEED TO WORK
-- ============================================================================

-- Step 1: Make sure the column exists
ALTER TABLE public.task_variants 
ADD COLUMN IF NOT EXISTS modal_has_email_generator BOOLEAN DEFAULT false;

-- Step 2: Check what we have now
SELECT 'CURRENT STATE:' as info, variant_name, modal_has_email_generator, modal_has_reminder
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 5;

-- Step 3: Force update Task 5 with ALL required fields
UPDATE public.task_variants 
SET 
  modal_has_email_generator = true,
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_title = 'Reminder',
  modal_content = 'If you haven''t received your biometric appointment letter 3 weeks after registration, consider contacting your cantonal migration office.

Tip: Keep the biometric appointment letter safe: you''ll need it for the appointment.

Reminder
We''ll remind you to check on the status:'
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 5);

-- Step 4: Verify the update worked
SELECT 'AFTER UPDATE:' as info, variant_name, modal_has_email_generator, modal_has_reminder
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 5;

-- Step 5: Show the exact data that should be returned to frontend
SELECT 
  'FRONTEND DATA:' as info,
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_has_email_generator,
  tv.modal_has_reminder,
  tv.modal_title,
  tv.modal_content
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;

-- Step 6: Test the get_user_tasks function (if you have a user)
-- SELECT * FROM get_user_tasks('your-user-id', 1) WHERE task_number = 5;
