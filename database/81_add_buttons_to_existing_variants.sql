-- ============================================================================
-- ADD BUTTONS TO EXISTING TASK 1 VARIANTS
-- ============================================================================

-- Check current state of all Task 1 variants
SELECT 
  'Current Task 1 Variants:' as info,
  tv.variant_name,
  tv.question_text,
  tv.actions,
  tv.modal_content
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Update all Task 1 variants to add question_text and actions
UPDATE public.task_variants 
SET 
  question_text = 'Do you have your residence permit?',
  actions = '[
    {"label": "Yes", "action": "mark_done", "style": "primary"},
    {"label": "Not yet", "action": "open_modal", "style": "secondary"}
  ]'::jsonb,
  updated_at = NOW()
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 1 LIMIT 1);

-- Verify the updates
SELECT 
  'Updated Task 1 Variants:' as info,
  tv.variant_name,
  tv.question_text,
  tv.actions,
  tv.modal_content
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

