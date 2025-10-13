-- Task 3: Register at your Gemeinde (municipality)
-- Make your residence official within 14 days of arrival

-- Insert Task 3
INSERT INTO public.tasks (id, task_number, title, description, priority, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  3,
  'Register at your Gemeinde (municipality)',
  'Make your residence official within 14 days of arrival.',
  4,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE task_number = 3);

-- Task 3 - EU/EFTA variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'eu_efta', t.title, '',
  'As an EU/EFTA citizen, you can register online via eUmzugCH or in person at your municipality. You''ll receive an L or B permit.',
  'Please check here for your municipality website and requirements.',
  'Have you registered at your municipality?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["eu_efta"]', true, true, true, false, '["Passport/ID", "Marital status documents", "Employment contract", "Rental contract", "Passport photos", "Health insurance proof"]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 3
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'eu_efta');

-- Task 3 - Visa exempt variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'visa_exempt', t.title, '',
  'As a visa-exempt citizen, you must register within 14 days. Bring all required documents to your municipality.',
  'Please check here for your municipality website and requirements.',
  'Have you registered at your municipality?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["visa_exempt"]', true, true, true, false, '["Passport/ID", "Marital status documents", "Employment contract", "Rental contract", "Passport photos", "Health insurance proof"]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 3
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'visa_exempt');

-- Task 3 - Visa required variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'visa_required', t.title, '',
  'As a visa-required citizen, you must register within 14 days. Bring all required documents to your municipality.',
  'Please check here for your municipality website and requirements.',
  'Have you registered at your municipality?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["visa_required"]', true, true, true, false, '["Passport/ID", "Marital status documents", "Employment contract", "Rental contract", "Passport photos", "Health insurance proof"]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 3
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'visa_required');

-- Task 3 - No info variant
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
  'Have you registered at your municipality?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["no_info", "other", "select country", ""]', true, false, false, false, '[]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 3
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'no_info');
