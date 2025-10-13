-- ============================================================================
-- UPDATE TASK 3 NO_INFO VARIANT
-- ============================================================================

-- Update Task 3 no_info variant with new content
UPDATE public.task_variants
SET
  title = 'Make your residence official within 14 days of arrival',
  info_box_content = 'You haven''t shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.

Would you like to complete your profile, so you get the most out of your experience on Village?',
  question_text = 'Have you registered at your Gemeinde?',
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  modal_title = 'Municipality Registration',
  modal_content = 'Please update your profile with your country of origin so we can give you the exact next steps.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = false,
  modal_has_pdf_upload = false,
  modal_has_school_email_generator = false,
  checklist_items = '[]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'no_info'
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 3);

-- Verify the update
SELECT
  'Task 3 no_info Update Verification:' as info,
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
AND tv.variant_name = 'no_info';

