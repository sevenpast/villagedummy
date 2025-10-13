-- ============================================================================
-- FIX MISSING TASK 1 VARIANTS - CREATE MISSING VARIANTS
-- ============================================================================

-- First, let's see what variants we actually have
SELECT 
  'Current Task 1 Variants:' as info,
  tv.variant_name,
  tv.id as variant_id,
  tv.task_id
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Get the Task 1 ID
SELECT 
  'Task 1 ID:' as info,
  id as task_id,
  task_number,
  title
FROM public.tasks 
WHERE task_number = 1;

-- Create missing visa_required variant
INSERT INTO public.task_variants (
  task_id,
  title,
  variant_name,
  target_segments,
  info_box_content,
  question_text,
  modal_title,
  modal_content,
  modal_has_reminder,
  modal_default_reminder_days,
  actions,
  created_at,
  updated_at
)
SELECT 
  t.id as task_id,
  t.title as title,
  'visa_required' as variant_name,
  '["visa_required"]'::jsonb as target_segments,
  'Dynamic content will be generated based on user profile' as info_box_content,
  'Do you have your residence permit?' as question_text,
  'Reminder' as modal_title,
  'Check the status of your application with your employer. Once it''s approved by the authorities, you must contact the Swiss embassy/consulate in your home country to obtain a D visa before traveling.' as modal_content,
  true as modal_has_reminder,
  7 as modal_default_reminder_days,
  '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb as actions,
  NOW() as created_at,
  NOW() as updated_at
FROM public.tasks t
WHERE t.task_number = 1
AND NOT EXISTS (
  SELECT 1 FROM public.task_variants tv 
  WHERE tv.task_id = t.id AND tv.variant_name = 'visa_required'
);

-- Create missing visa_exempt variant
INSERT INTO public.task_variants (
  task_id,
  title,
  variant_name,
  target_segments,
  info_box_content,
  question_text,
  modal_title,
  modal_content,
  modal_has_reminder,
  modal_default_reminder_days,
  actions,
  created_at,
  updated_at
)
SELECT 
  t.id as task_id,
  t.title as title,
  'visa_exempt' as variant_name,
  '["visa_exempt"]'::jsonb as target_segments,
  'Dynamic content will be generated based on user profile' as info_box_content,
  'Do you have your residence permit?' as question_text,
  'Reminder' as modal_title,
  'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.' as modal_content,
  true as modal_has_reminder,
  7 as modal_default_reminder_days,
  '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb as actions,
  NOW() as created_at,
  NOW() as updated_at
FROM public.tasks t
WHERE t.task_number = 1
AND NOT EXISTS (
  SELECT 1 FROM public.task_variants tv 
  WHERE tv.task_id = t.id AND tv.variant_name = 'visa_exempt'
);

-- Create missing no_info variant
INSERT INTO public.task_variants (
  task_id,
  title,
  variant_name,
  target_segments,
  info_box_content,
  question_text,
  modal_title,
  modal_content,
  modal_has_reminder,
  modal_default_reminder_days,
  actions,
  created_at,
  updated_at
)
SELECT 
  t.id as task_id,
  t.title as title,
  'no_info' as variant_name,
  '["no_info"]'::jsonb as target_segments,
  'Dynamic content will be generated based on user profile' as info_box_content,
  'Do you have your residence permit?' as question_text,
  'Reminder' as modal_title,
  'Please update your profile with your country of origin so we can give you the exact next steps.' as modal_content,
  true as modal_has_reminder,
  7 as modal_default_reminder_days,
  '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb as actions,
  NOW() as created_at,
  NOW() as updated_at
FROM public.tasks t
WHERE t.task_number = 1
AND NOT EXISTS (
  SELECT 1 FROM public.task_variants tv 
  WHERE tv.task_id = t.id AND tv.variant_name = 'no_info'
);

-- Update existing eu_efta variant
UPDATE public.task_variants 
SET 
  question_text = 'Do you have your residence permit?',
  modal_title = 'Reminder',
  modal_content = 'Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved.',
  modal_has_reminder = true,
  modal_default_reminder_days = 7,
  updated_at = NOW()
WHERE variant_name = 'eu_efta' 
AND task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

-- Verify all variants now exist
SELECT 
  'Final Task 1 Variants:' as info,
  tv.variant_name,
  tv.modal_title,
  tv.modal_content,
  tv.modal_has_reminder
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;
