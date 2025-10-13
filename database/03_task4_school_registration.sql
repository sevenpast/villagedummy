-- Task 4: Register your kids for school
-- Register your children for school right after arrival

-- Insert Task 4
INSERT INTO public.tasks (id, task_number, title, description, priority, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  4,
  'Register your kids for school',
  'Register your children for school right after arrival.',
  3,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.tasks WHERE task_number = 4);

-- Task 4 - With children variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'with_children', t.title, '',
  'Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.

School attendance is compulsory from age 4–6 (varies slightly by canton).

Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).

Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).

You may also apply to private or international schools, but these require direct application and tuition fees.

This task is shown to you because your profile states that you have children between the ages of 4 and 15. If that is incorrect, you can change your information here: change profile.',
  '',
  'Have you already registered your child(ren) for school yet?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["with_children"]', true, true, false, true, '["Birth certificate of the child", "Vaccination records", "Proof of residence", "Previous school records", "Language assessment", "Health insurance card", "Passport photos of the child"]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 4
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'with_children');

-- Task 4 - Without children variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'without_children', t.title, '',
  'This task is not relevant for you. You can mark it as completed since your profile indicates you do not have children. School registration is only required for families with children aged 4-16.',
  '',
  'Have you already registered your child(ren) for school yet?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not applicable", "action": "mark_done", "style": "secondary"}]',
  '["without_children"]', false, false, false, false, '[]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 4
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'without_children');

-- Task 4 - Unknown children variant
INSERT INTO public.task_variants (
  id, task_id, variant_name, title, intro_text, info_box_content, modal_content,
  question_text, actions, target_segments, modal_has_reminder, modal_has_pdf_upload,
  modal_has_email_generator, modal_has_school_email_generator, checklist_items,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(), t.id, 'unknown_children', t.title, '',
  'Enrolling your child(ren) in the local school/kindergarten is a separate step from the Gemeinde registration. It does not happen automatically.

School attendance is compulsory from age 4–6 (varies slightly by canton).

Kindergarten usually starts at age 4 or 5 and is mandatory in most cantons (2 years before primary school).

Registration happens at your Gemeinde (municipality). They will assign a public school based on your home address (catchment system).

You may also apply to private or international schools, but these require direct application and tuition fees.

This task is shown to you because your profile states that you have children between the ages of 4 and 15. If that is incorrect, you can change your information here: change profile.',
  '',
  'Have you already registered your child(ren) for school yet?',
  '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]',
  '["unknown_children"]', true, true, false, true, '["Birth certificate of the child", "Vaccination records", "Proof of residence", "Previous school records", "Language assessment", "Health insurance card", "Passport photos of the child"]', NOW(), NOW()
FROM public.tasks t WHERE t.task_number = 4
AND NOT EXISTS (SELECT 1 FROM public.task_variants tv WHERE tv.task_id = t.id AND tv.variant_name = 'unknown_children');
