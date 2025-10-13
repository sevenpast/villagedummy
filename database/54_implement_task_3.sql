-- ============================================================================
-- IMPLEMENT TASK 3: Make your residence official within 14 days of arrival
-- ============================================================================

-- Insert Task 3: Make your residence official within 14 days of arrival
INSERT INTO public.tasks (module_id, task_number, title, description, task_type, priority, display_order)
VALUES (
  (SELECT id FROM public.modules WHERE module_number = 1),
  3,
  'Make your residence official within 14 days of arrival',
  'Register with your local municipality within 14 days of arrival',
  'form',
  4, -- URGENT priority
  3
)
ON CONFLICT (module_id, task_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  task_type = EXCLUDED.task_type,
  priority = EXCLUDED.priority,
  display_order = EXCLUDED.display_order;

-- Insert Task 3 Variant: EU/EFTA Citizens
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
  modal_has_pdf_upload,
  modal_has_school_email_generator,
  official_link_url,
  official_link_label,
  checklist_items
) VALUES (
  (SELECT id FROM public.tasks WHERE task_number = 3),
  'EU/EFTA Citizens - Municipality Registration',
  'Personalized guidance for EU/EFTA citizens registering with municipality',
  'eu_efta',
  '["eu_efta"]'::jsonb,
  'Register with your local municipality within 14 days of arrival.',
  'As an EU/EFTA citizen, you have the right to live and work in Switzerland. You must register with your local municipality (Gemeinde) within 14 days of arrival.

What you need to do:
- Visit your local municipality office
- Bring required documents (see checklist below)
- Complete the registration form
- Pay any applicable fees

Important: This registration is mandatory and must be done within 14 days of your arrival date.',
  'Have you already registered yourself?',
  '[
    {
      "type": "button",
      "label": "Yes",
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
  'Registration Help',
  'Here you can find information about your municipality registration process.

Official Website: [Municipality website will be loaded here]

Required Documents Checklist:
- Valid passport or national ID card
- Proof of address (rental agreement, property deed)
- Employment contract or proof of financial means
- Health insurance certificate
- Marriage certificate (if applicable)
- Birth certificates of children (if applicable)

Note: Required documents may vary by municipality. Please check with your local office for specific requirements.',
  true,
  3,
  false,
  true,
  true,
  NULL, -- Will be populated dynamically
  'Municipality Information',
  '[
    {"text": "Valid passport or national ID", "required": true},
    {"text": "Proof of address", "required": true},
    {"text": "Employment contract", "required": true},
    {"text": "Health insurance certificate", "required": true},
    {"text": "Marriage certificate (if married)", "required": false},
    {"text": "Birth certificates of children", "required": false}
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
  modal_has_pdf_upload = EXCLUDED.modal_has_pdf_upload,
  modal_has_school_email_generator = EXCLUDED.modal_has_school_email_generator,
  official_link_url = EXCLUDED.official_link_url,
  official_link_label = EXCLUDED.official_link_label,
  checklist_items = EXCLUDED.checklist_items;

-- Insert Task 3 Variant: Non-EU/EFTA Visa-Exempt
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
  modal_has_pdf_upload,
  modal_has_school_email_generator,
  official_link_url,
  official_link_label,
  checklist_items
) VALUES (
  (SELECT id FROM public.tasks WHERE task_number = 3),
  'Visa-Exempt Citizens - Municipality Registration',
  'Personalized guidance for visa-exempt citizens registering with municipality',
  'visa_exempt',
  '["visa_exempt"]'::jsonb,
  'Register with your local municipality within 14 days of arrival.',
  'As a non-EU/EFTA citizen from a visa-exempt country, you must register with your local municipality (Gemeinde) within 14 days of arrival.

What you need to do:
- Visit your local municipality office
- Bring required documents (see checklist below)
- Complete the registration form
- Pay any applicable fees

Important: This registration is mandatory and must be done within 14 days of your arrival date. You may need to apply for a residence permit after registration.',
  'Have you already registered yourself?',
  '[
    {
      "type": "button",
      "label": "Yes",
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
  'Registration Help',
  'Here you can find information about your municipality registration process.

Official Website: [Municipality website will be loaded here]

Required Documents Checklist:
- Valid passport
- Proof of address (rental agreement, property deed)
- Employment contract or proof of financial means
- Health insurance certificate
- Marriage certificate (if applicable)
- Birth certificates of children (if applicable)

Note: Required documents may vary by municipality. Please check with your local office for specific requirements.',
  true,
  3,
  false,
  true,
  true,
  NULL, -- Will be populated dynamically
  'Municipality Information',
  '[
    {"text": "Valid passport", "required": true},
    {"text": "Proof of address", "required": true},
    {"text": "Employment contract", "required": true},
    {"text": "Health insurance certificate", "required": true},
    {"text": "Marriage certificate (if married)", "required": false},
    {"text": "Birth certificates of children", "required": false}
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
  modal_has_pdf_upload = EXCLUDED.modal_has_pdf_upload,
  modal_has_school_email_generator = EXCLUDED.modal_has_school_email_generator,
  official_link_url = EXCLUDED.official_link_url,
  official_link_label = EXCLUDED.official_link_label,
  checklist_items = EXCLUDED.checklist_items;

-- Insert Task 3 Variant: Non-EU/EFTA Visa-Required
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
  modal_has_pdf_upload,
  modal_has_school_email_generator,
  official_link_url,
  official_link_label,
  checklist_items
) VALUES (
  (SELECT id FROM public.tasks WHERE task_number = 3),
  'Visa-Required Citizens - Municipality Registration',
  'Personalized guidance for visa-required citizens registering with municipality',
  'visa_required',
  '["visa_required"]'::jsonb,
  'Register with your local municipality within 14 days of arrival.',
  'As a non-EU/EFTA citizen requiring a visa, you must register with your local municipality (Gemeinde) within 14 days of arrival.

What you need to do:
- Visit your local municipality office
- Bring required documents (see checklist below)
- Complete the registration form
- Pay any applicable fees

Important: This registration is mandatory and must be done within 14 days of your arrival date. You must have a valid visa before registration.',
  'Have you already registered yourself?',
  '[
    {
      "type": "button",
      "label": "Yes",
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
  'Registration Help',
  'Here you can find information about your municipality registration process.

Official Website: [Municipality website will be loaded here]

Required Documents Checklist:
- Valid passport with visa
- Proof of address (rental agreement, property deed)
- Employment contract or proof of financial means
- Health insurance certificate
- Marriage certificate (if applicable)
- Birth certificates of children (if applicable)

Note: Required documents may vary by municipality. Please check with your local office for specific requirements.',
  true,
  3,
  false,
  true,
  true,
  NULL, -- Will be populated dynamically
  'Municipality Information',
  '[
    {"text": "Valid passport with visa", "required": true},
    {"text": "Proof of address", "required": true},
    {"text": "Employment contract", "required": true},
    {"text": "Health insurance certificate", "required": true},
    {"text": "Marriage certificate (if married)", "required": false},
    {"text": "Birth certificates of children", "required": false}
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
  modal_has_pdf_upload = EXCLUDED.modal_has_pdf_upload,
  modal_has_school_email_generator = EXCLUDED.modal_has_school_email_generator,
  official_link_url = EXCLUDED.official_link_url,
  official_link_label = EXCLUDED.official_link_label,
  checklist_items = EXCLUDED.checklist_items;

-- Insert Task 3 Variant: No Info (Default)
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
  modal_has_pdf_upload,
  modal_has_school_email_generator,
  official_link_url,
  official_link_label,
  checklist_items
) VALUES (
  (SELECT id FROM public.tasks WHERE task_number = 3),
  'General Municipality Registration',
  'General guidance for municipality registration',
  'no_info',
  '["no_info"]'::jsonb,
  'Register with your local municipality within 14 days of arrival.',
  'You must register with your local municipality (Gemeinde) within 14 days of arrival.

What you need to do:
- Visit your local municipality office
- Bring required documents (see checklist below)
- Complete the registration form
- Pay any applicable fees

Important: This registration is mandatory and must be done within 14 days of your arrival date. Please complete your profile to get personalized information.',
  'Have you already registered yourself?',
  '[
    {
      "type": "button",
      "label": "Yes",
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
  'Registration Help',
  'Here you can find information about your municipality registration process.

Official Website: [Municipality website will be loaded here]

Required Documents Checklist:
- Valid passport or national ID
- Proof of address (rental agreement, property deed)
- Employment contract or proof of financial means
- Health insurance certificate
- Marriage certificate (if applicable)
- Birth certificates of children (if applicable)

Note: Required documents may vary by municipality. Please check with your local office for specific requirements.',
  true,
  3,
  false,
  true,
  true,
  NULL, -- Will be populated dynamically
  'Municipality Information',
  '[
    {"text": "Valid passport or national ID", "required": true},
    {"text": "Proof of address", "required": true},
    {"text": "Employment contract", "required": true},
    {"text": "Health insurance certificate", "required": true},
    {"text": "Marriage certificate (if married)", "required": false},
    {"text": "Birth certificates of children", "required": false}
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
  modal_has_pdf_upload = EXCLUDED.modal_has_pdf_upload,
  modal_has_school_email_generator = EXCLUDED.modal_has_school_email_generator,
  official_link_url = EXCLUDED.official_link_url,
  official_link_label = EXCLUDED.official_link_label,
  checklist_items = EXCLUDED.checklist_items;

-- Verify Task 3 was created
SELECT 
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_has_pdf_upload,
  tv.modal_has_school_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 3
ORDER BY tv.variant_name;
