-- ============================================================================
-- UPDATE TASK 4 WITH_CHILDREN VARIANT
-- ============================================================================

-- Update Task 4 with_children variant with new content
UPDATE public.task_variants
SET
  title = 'Register your kids for school right after arrival',
  info_box_content = 'Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.

School attendance is compulsory from age 4–6 (varies slightly by canton).

Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).

Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).

You may also apply to private or international schools, but these require direct application and tuition fees.

This task is shown to you because your profile states that you have children between the ages of 4 and 15. If that is incorrect, you can change your information here: change profile.',
  question_text = 'Have you registered your children for school?',
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  modal_title = 'School Registration',
  modal_content = 'Already loaded website of the school authority of the municipality + Checklist for school registration + PDF upload option + Email sending to school authority + text: "Don''t delay! School registration is mandatory immediately after arrival." + Reminder',
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  modal_has_email_generator = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = true,
  checklist_items = '[
    "Birth certificate of the child",
    "Vaccination records",
    "Proof of residence (rental contract or registration certificate)",
    "Previous school records (if applicable)",
    "Language assessment (if required by canton)",
    "Health insurance card",
    "Passport photos of the child"
  ]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'with_children'
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 4);

-- Verify the update
SELECT
  'Task 4 with_children Update Verification:' as info,
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
  tv.modal_has_school_email_generator,
  tv.checklist_items
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
AND tv.variant_name = 'with_children';

