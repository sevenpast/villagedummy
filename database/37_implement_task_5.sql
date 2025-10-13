-- ============================================================================
-- IMPLEMENT TASK 5: RECEIVE RESIDENCE PERMIT CARD
-- ============================================================================

-- Insert Task 5: Receive residence permit card
INSERT INTO public.tasks (module_id, task_number, title, description, task_type, priority, display_order)
VALUES (
  (SELECT id FROM public.modules WHERE module_number = 1),
  5,
  'Receive residence permit card',
  'Complete the final step to obtain your Swiss residence permit card',
  'information',
  3, -- 3 = HIGH priority
  5
)
ON CONFLICT (module_id, task_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  task_type = EXCLUDED.task_type,
  priority = EXCLUDED.priority,
  display_order = EXCLUDED.display_order;

-- Insert Task 5 Variant: All Users
INSERT INTO public.task_variants (
  task_id, 
  title,
  description,
  variant_name, 
  target_segments, 
  intro_text,
  info_box_content,
  question_text,
  actions,
  modal_title,
  modal_content,
  modal_has_reminder,
  modal_default_reminder_days,
  modal_has_email_generator,
  official_link_url,
  official_link_label,
  checklist_items
) VALUES (
  (SELECT id FROM public.tasks WHERE task_number = 5),
  'Receive residence permit card',
  'The last step to your Swiss residence permit',
  'all_users',
  '[]'::jsonb, -- Shown to all users
  'The last step to your Swiss residence permit.',
  'After you register at your Gemeinde, your data goes to the cantonal migration office.

You''ll receive a letter which requires a signature upon receipt. Missing the delivery means you''ll have to pick it up at the post office. The letter will provide an appointment to collect biometric data (fingerprints + photo). Appointments are given usually within the first 1–2 weeks after registration.

After biometrics, the permit card (plastic ID card) is produced by the federal authorities and sent to your Swiss address by registered post.

Processing can take 2–8 weeks depending on canton.

Children also receive a card and are required to provide data at the appointment (no fingerprints for younger kids).

This card is needed for many admin tasks (opening bank account, long-term housing, some insurances, travel).

Fees: usually around CHF 60 - 150 per adult, depending on the canton and permit type',
  'Have you received your permit card yet?',
  '[
    {
      "type": "button",
      "label": "Yes, I have it",
      "behavior": "mark_done",
      "style": "primary"
    },
    {
      "type": "button", 
      "label": "Not yet",
      "behavior": "open_modal",
      "style": "secondary"
    }
  ]'::jsonb,
  'Reminder',
  'If you haven''t received your biometric appointment letter 3 weeks after registration, consider contacting your cantonal migration office.

Generate ready-to send email to your cantonal office [canton provided in profile]

Tip: Keep the biometric appointment letter safe: you''ll need it for the appointment.

Reminder
We''ll remind you to check on the status:',
  true,
  7,
  true,
  'https://www.sem.admin.ch/sem/en/home/themen/aufenthalt.html',
  'Official SEM Information',
  '[
    {"text": "Biometric appointment letter", "required": true},
    {"text": "Valid passport or ID", "required": true},
    {"text": "Proof of address in Switzerland", "required": true},
    {"text": "Payment for permit fees (CHF 60-150)", "required": true}
  ]'::jsonb
)
ON CONFLICT (task_id, variant_name) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  target_segments = EXCLUDED.target_segments,
  intro_text = EXCLUDED.intro_text,
  info_box_content = EXCLUDED.info_box_content,
  question_text = EXCLUDED.question_text,
  actions = EXCLUDED.actions,
  modal_title = EXCLUDED.modal_title,
  modal_content = EXCLUDED.modal_content,
  modal_has_reminder = EXCLUDED.modal_has_reminder,
  modal_default_reminder_days = EXCLUDED.modal_default_reminder_days,
  modal_has_email_generator = EXCLUDED.modal_has_email_generator,
  official_link_url = EXCLUDED.official_link_url,
  official_link_label = EXCLUDED.official_link_label,
  checklist_items = EXCLUDED.checklist_items;

-- Verify the insertion
SELECT 
  t.task_number,
  t.title,
  tv.variant_name,
  tv.intro_text,
  tv.question_text
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5;
