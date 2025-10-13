-- Fix Task 5 content to match the correct implementation
-- Update the task and variant with the correct content

-- Update Task 5 title and description
UPDATE public.tasks 
SET 
  title = 'Receive residence permit card',
  description = 'The last step to your Swiss residence permit.',
  updated_at = NOW()
WHERE task_number = 5;

-- Update Task 5 variant with correct content
UPDATE public.task_variants 
SET 
  title = 'Receive residence permit card',
  info_box_content = 'After you register at your Gemeinde, your data goes to the cantonal migration office.

You''ll receive a letter which requires a signature upon receipt. Missing the delivery means you''ll have to pick it up at the post office. The letter will to provide an appointment to collect biometric data (fingerprints + photo). Appointments are given usually within the first 1–2 weeks after registration.

After biometrics, the permit card (plastic ID card) is produced by the federal authorities and sent to your Swiss address by registered post.

Processing can take 2–8 weeks depending on canton.

Children also receive a card and are required to provide data at the appointment (no fingerprints for younger kids). 

This card is needed for many admin tasks (opening bank account, long-term housing, some insurances, travel).

Fees: usually around CHF 60 - 150 per adult, depending on the canton and permit type',
  modal_content = 'If you haven''t received your biometric appointment letter 3 weeks after registration, consider contacting your cantonal migration office.

Tip: Keep the biometric appointment letter safe: you''ll need it for the appointment.',
  question_text = 'Have you received your residence permit card?',
  actions = '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  modal_has_reminder = true,
  modal_has_email_generator = true,
  updated_at = NOW()
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 5)
AND variant_name = 'all_users';

-- Verify the changes
SELECT 
  t.task_number,
  t.title,
  t.description,
  tv.variant_name,
  tv.question_text,
  tv.actions,
  tv.modal_has_reminder,
  tv.modal_has_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;
