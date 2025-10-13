-- Task 1: Check permit application status
-- Verify your work permit application status with your employer

-- Insert Task 1
INSERT INTO public.tasks (id, task_number, title, description, priority, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  1,
  'Check permit application status',
  'Verify your work permit application status with your employer.',
  4,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE task_number = 1);

-- Task 1 - EU/EFTA variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'eu_efta', t.title, '',
  'As an EU/EFTA citizen, you can start working immediately. Your employer will handle the permit application process.',
  'Please check with your employer about the permit application status.',
  'Have you checked your permit application status?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["eu_efta"]', true, false, false, false, '[]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 1
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'eu_efta');

-- Task 1 - Visa exempt variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'visa_exempt', t.title, '',
  'Since you are a citizen of a visa-exempt country, you can enter Switzerland without a visa but need a work permit to start working.',
  'Please check with your employer about the permit application status.',
  'Have you checked your permit application status?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["visa_exempt"]', true, false, false, false, '[]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 1
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'visa_exempt');

-- Task 1 - Visa required variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'visa_required', t.title, '',
  'Since you are a citizen of a visa-required country, you need both a visa and work permit before starting work.',
  'Please check with your employer about the permit application status.',
  'Have you checked your permit application status?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["visa_required"]', true, false, false, false, '[]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 1
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'visa_required');

-- Task 1 - No info variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'no_info', t.title, '',
  'You haven''t shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic. Would you like to complete your profile, so you get the most out of your experience on Village?',
  'Please update your profile to get personalized information.',
  'Have you checked your permit application status?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["no_info", "other", "select country", ""]', true, false, false, false, '[]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 1
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'no_info');
