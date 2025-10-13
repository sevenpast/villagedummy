-- ============================================================================
-- UPDATE TASK 3 VISA_EXEMPT VARIANT
-- ============================================================================

-- Update Task 3 visa_exempt variant with new content
UPDATE public.task_variants
SET
  title = 'Make your residence official within 14 days of arrival',
  info_box_content = 'Since you are a citizen of "country of origin":

To live and work in Switzerland, you must register at your Gemeinde (municipality) within 14 days of arrival after your residence/work permit has been approved.

At registration you will be issued your L (short-term) or B (longer-term) permit card.

Registration is mandatory for access to services (insurance, bank account, schooling, etc.).

Online services: Some municipalities use eUmzugCH (emoving.ch) for online address changes within Switzerland. But if you are moving from abroad, you must always appear in person at the Gemeinde office.

Documents usually required at the Gemeinde (municipality):
-Passport/ID for each family member
-For families: documents on marital status (family book, marriage certificate, birth certificates)
-Employment contract (with length and hours)
-Rental contract or landlord confirmation
-Passport photos (sometimes required)
-Proof of health insurance (or provide it within 3 months)',
  question_text = 'Have you registered at your Gemeinde?',
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  modal_title = 'Municipality Registration',
  modal_content = 'Official website of the municipality',
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = false,
  checklist_items = '[
    "Passport/ID for each family member",
    "For families: documents on marital status (family book, marriage certificate, birth certificates)",
    "Employment contract (with length and hours)",
    "Rental contract or landlord confirmation",
    "Passport photos (sometimes required)",
    "Proof of health insurance (or provide it within 3 months)"
  ]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'visa_exempt'
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 3);

-- Verify the update
SELECT
  'Task 3 visa_exempt Update Verification:' as info,
  t.task_number,
  t.title as task_title,
  tv.variant_name,
  tv.title as variant_title,
  tv.info_box_content,
  tv.question_text,
  tv.modal_title,
  tv.modal_content,
  tv.modal_has_reminder,
  tv.modal_has_email_generator,
  tv.modal_has_pdf_upload,
  tv.checklist_items
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 3
AND tv.variant_name = 'visa_exempt';

