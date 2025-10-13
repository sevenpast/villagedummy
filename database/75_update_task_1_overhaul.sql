-- ============================================================================
-- TASK 1 OVERHAUL - UPDATE MODAL CONTENT AND BUTTON TEXTS
-- ============================================================================

-- Update Task 1 modal content for visa_required variant
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your application with your employer. Once it''s approved by the authorities, you must contact the Swiss embassy/consulate in your home country to obtain a D visa before traveling.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'visa_required' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);

-- Update Task 1 modal content for eu_efta variant (keep existing)
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.

We''ll remind you to check on the status:',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);

-- Update Task 1 modal content for visa_exempt variant (keep existing)
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.

We''ll remind you to check on the status:',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'visa_exempt' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);

-- Update Task 1 modal content for no_info variant (keep existing)
UPDATE public.task_variants 
SET 
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.

We''ll remind you to check on the status:',
  modal_has_reminder = true,
  modal_default_reminder_days = 7
WHERE variant_name = 'no_info' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1);

-- Update button texts for all Task 1 variants
-- Change "Yes, I have" to "Yes" in the actions JSONB
UPDATE public.task_variants 
SET actions = jsonb_set(
  actions, 
  '{0,label}', 
  '"Yes"'
)
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 1)
AND actions->0->>'label' = 'Yes, I have';

-- Also update any other variations of "Yes, I have"
UPDATE public.task_variants 
SET actions = jsonb_set(
  actions, 
  '{0,label}', 
  '"Yes"'
)
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 1)
AND actions->0->>'label' LIKE '%Yes%have%';

-- Verify the updates
SELECT 
  'Task 1 Modal Updates:' as info,
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_title,
  tv.modal_content,
  tv.actions
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 1
ORDER BY tv.variant_name;
