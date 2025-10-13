-- ============================================================================
-- TASK 3 COMPLETE OVERHAUL
-- ============================================================================

-- 1. Update Task 3 main title
UPDATE public.tasks 
SET 
  title = 'Register at your Gemeinde (municipality)',
  description = 'Make your residence official within 14 days of arrival',
  updated_at = NOW()
WHERE task_number = 3;

-- 2. Update Task 3 EU/EFTA variant with new content
UPDATE public.task_variants 
SET 
  title = 'Make your residence official within 14 days of arrival',
  info_box_content = 'Since you are a citizen of "country of origin":

To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.

You will usually receive an L permit (short-term) or B permit (longer-term).

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.',
  
  question_text = 'Have you registered at your Gemeinde?',
  
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  
  modal_title = 'Municipality Registration',
  
  modal_content = 'Please check here for your municipality website and requirements.',
  
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = false,
  
  checklist_items = '[
    "Passport/ID for each family member",
    "For families: documents on marital status (family book, marriage certificate, birth certificates, divorce certificate)",
    "Employment contract (with length and hours)",
    "Rental contract or landlord confirmation",
    "Passport photos (sometimes required)",
    "Proof of health insurance (or provide it within 3 months)"
  ]'::jsonb,
  
  updated_at = NOW()
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 3);

-- 3. Update Task 3 visa_exempt variant
UPDATE public.task_variants 
SET 
  title = 'Make your residence official within 14 days of arrival',
  info_box_content = 'Since you are a citizen of "country of origin":

To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.

You will usually receive an L permit (short-term) or B permit (longer-term).

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.',
  
  question_text = 'Have you registered at your Gemeinde?',
  
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  
  modal_title = 'Municipality Registration',
  
  modal_content = 'Please check here for your municipality website and requirements.',
  
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = false,
  
  checklist_items = '[
    "Passport/ID for each family member",
    "For families: documents on marital status (family book, marriage certificate, birth certificates, divorce certificate)",
    "Employment contract (with length and hours)",
    "Rental contract or landlord confirmation",
    "Passport photos (sometimes required)",
    "Proof of health insurance (or provide it within 3 months)"
  ]'::jsonb,
  
  updated_at = NOW()
WHERE variant_name = 'visa_exempt' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 3);

-- 4. Update Task 3 visa_required variant
UPDATE public.task_variants 
SET 
  title = 'Make your residence official within 14 days of arrival',
  info_box_content = 'Since you are a citizen of "country of origin":

To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.

You will usually receive an L permit (short-term) or B permit (longer-term).

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.',
  
  question_text = 'Have you registered at your Gemeinde?',
  
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  
  modal_title = 'Municipality Registration',
  
  modal_content = 'Please check here for your municipality website and requirements.',
  
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = false,
  
  checklist_items = '[
    "Passport/ID for each family member",
    "For families: documents on marital status (family book, marriage certificate, birth certificates, divorce certificate)",
    "Employment contract (with length and hours)",
    "Rental contract or landlord confirmation",
    "Passport photos (sometimes required)",
    "Proof of health insurance (or provide it within 3 months)"
  ]'::jsonb,
  
  updated_at = NOW()
WHERE variant_name = 'visa_required' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 3);

-- 5. Update Task 3 no_info variant
UPDATE public.task_variants 
SET 
  title = 'Make your residence official within 14 days of arrival',
  info_box_content = 'To move to Switzerland for work or residence, you must register at your Gemeinde (municipality) within 14 days of arrival.

You will usually receive an L permit (short-term) or B permit (longer-term).

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.

Please complete your profile with your country of origin to get personalized information.',
  
  question_text = 'Have you registered at your Gemeinde?',
  
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  
  modal_title = 'Municipality Registration',
  
  modal_content = 'Please check here for your municipality website and requirements.',
  
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = false,
  
  checklist_items = '[
    "Passport/ID for each family member",
    "For families: documents on marital status (family book, marriage certificate, birth certificates, divorce certificate)",
    "Employment contract (with length and hours)",
    "Rental contract or landlord confirmation",
    "Passport photos (sometimes required)",
    "Proof of health insurance (or provide it within 3 months)"
  ]'::jsonb,
  
  updated_at = NOW()
WHERE variant_name = 'no_info' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 3);

-- 6. Verify the updates
SELECT 
  'Task 3 Complete Overhaul - Verification:' as info,
  t.task_number,
  t.title as main_title,
  t.description,
  tv.variant_name,
  tv.title as variant_title,
  tv.question_text,
  tv.modal_has_email_generator,
  tv.modal_has_pdf_upload,
  tv.modal_has_school_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 3
ORDER BY tv.variant_name;
