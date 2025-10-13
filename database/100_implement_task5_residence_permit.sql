-- Implement Task 5: Receive residence permit card
-- All users see the same content

-- Insert Task 5 (check if exists first)
INSERT INTO public.tasks (id, task_number, title, description, priority, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  5,
  'Receive residence permit card',
  'The last step to your Swiss residence permit.',
  3,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE task_number = 5
);

-- Insert Task 5 variant for all users
INSERT INTO public.task_variants (
  id,
  task_id,
  variant_name,
  title,
  intro_text,
  info_box_content,
  modal_content,
  question_text,
  actions,
  target_segments,
  modal_has_reminder,
  modal_has_pdf_upload,
  modal_has_email_generator,
  modal_has_school_email_generator,
  checklist_items,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  t.id,
  'all_users',
  t.title,
  '',
  'After you register at your Gemeinde, your data goes to the cantonal migration office.

You''ll receive a letter which requires a signature upon receipt. Missing the delivery means you''ll have to pick it up at the post office. The letter will to provide an appointment to collect biometric data (fingerprints + photo). Appointments are given usually within the first 1–2 weeks after registration.

After biometrics, the permit card (plastic ID card) is produced by the federal authorities and sent to your Swiss address by registered post.

Processing can take 2–8 weeks depending on canton.

Children also receive a card and are required to provide data at the appointment (no fingerprints for younger kids). 

This card is needed for many admin tasks (opening bank account, long-term housing, some insurances, travel).

Fees: usually around CHF 60 - 150 per adult, depending on the canton and permit type',
  'If you haven''t received your biometric appointment letter 3 weeks after registration, consider contacting your cantonal migration office.

Tip: Keep the biometric appointment letter safe: you''ll need it for the appointment.',
  'Have you received your residence permit card?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["all"]',
  true,
  false,
  true,
  false,
  '[]',
  NOW(),
  NOW()
FROM public.tasks t
WHERE t.task_number = 5
AND NOT EXISTS (
  SELECT 1 FROM public.task_variants tv2 
  WHERE tv2.task_id = t.id AND tv2.variant_name = 'all_users'
);

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
