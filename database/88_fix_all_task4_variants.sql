-- ============================================================================
-- FIX ALL TASK 4 VARIANTS - COMPLETE UPDATE
-- ============================================================================

-- First, let's check what Task 4 variants exist
SELECT 
  'Current Task 4 Variants:' as info,
  t.task_number,
  t.title as task_title,
  tv.variant_name,
  tv.title as variant_title,
  tv.actions
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
ORDER BY tv.variant_name;

-- Update Task 4 with_children variant with correct buttons
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

-- Update Task 4 without_children variant
UPDATE public.task_variants
SET
  title = 'Register your kids for school right after arrival',
  info_box_content = 'This task is not relevant for you. You can mark it as completed since your profile indicates you do not have children. School registration is only required for families with children aged 4-16.',
  question_text = 'Have you registered your children for school?',
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not applicable", "action": "mark_done", "style": "secondary"}
  ]'::jsonb,
  modal_title = 'School Registration',
  modal_content = 'This task is not relevant for you since you do not have children.',
  modal_has_reminder = false,
  modal_default_reminder_days = 7,
  modal_has_email_generator = false,
  modal_has_pdf_upload = false,
  modal_has_school_email_generator = false,
  checklist_items = '[]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'without_children'
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 4);

-- Update Task 4 unknown_children variant
UPDATE public.task_variants
SET
  title = 'Register your kids for school right after arrival',
  info_box_content = 'You are seeing this task because we don''t know whether you have children. If you have children aged 4-16, school registration is mandatory in Switzerland. If you do not have children, you can mark this task as completed. Please update your profile to help us provide more personalized guidance.',
  question_text = 'Have you registered your children for school?',
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not applicable", "action": "mark_done", "style": "secondary"}
  ]'::jsonb,
  modal_title = 'School Registration',
  modal_content = 'Please update your profile to indicate whether you have children so we can provide appropriate guidance.',
  modal_has_reminder = false,
  modal_default_reminder_days = 7,
  modal_has_email_generator = false,
  modal_has_pdf_upload = false,
  modal_has_school_email_generator = false,
  checklist_items = '[]'::jsonb,
  updated_at = NOW()
WHERE variant_name = 'unknown_children'
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 4);

-- Verify all updates
SELECT 
  'Final Task 4 Variants Verification:' as info,
  t.task_number,
  t.title as task_title,
  tv.variant_name,
  tv.title as variant_title,
  tv.question_text,
  tv.actions,
  tv.modal_has_reminder,
  tv.modal_has_email_generator,
  tv.modal_has_pdf_upload,
  tv.modal_has_school_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
ORDER BY tv.variant_name;

