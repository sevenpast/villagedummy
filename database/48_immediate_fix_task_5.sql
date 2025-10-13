-- ============================================================================
-- IMMEDIATE FIX TASK 5 - GUARANTEED TO WORK
-- ============================================================================

-- Step 1: Make sure the column exists
ALTER TABLE public.task_variants 
ADD COLUMN IF NOT EXISTS modal_has_email_generator BOOLEAN DEFAULT false;

-- Step 2: Check current state
SELECT 'BEFORE FIX:' as status, variant_name, modal_has_email_generator, modal_has_reminder
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 5;

-- Step 3: Force update ALL Task 5 variants
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

-- Step 4: Verify the fix
SELECT 'AFTER FIX:' as status, variant_name, modal_has_email_generator, modal_has_reminder
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 5;

-- Step 5: Show the exact data that should be returned to frontend
SELECT 
  'FRONTEND DATA:' as info,
  t.task_number,
  tv.variant_name,
  tv.modal_has_email_generator,
  tv.modal_has_reminder,
  tv.modal_title,
  LEFT(tv.modal_content, 50) || '...' as modal_content_preview
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;
