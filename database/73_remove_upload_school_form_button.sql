-- ============================================================================
-- REMOVE "Upload School Form" BUTTON FROM TASK 4
-- ============================================================================
-- This script removes the "Upload School Form" button from Task 4 actions
-- since we now have a dedicated PDF upload field in the modal

-- Update Task 4 actions to remove the "Upload School Form" button
UPDATE public.task_variants 
SET actions = '[
    {"label": "Yes", "action": "complete", "style": "success"},
    {"label": "Not yet", "action": "open_modal", "style": "warning"}
]'::jsonb
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
  AND variant_name IN ('with_children', 'without_children', 'unknown_children');

-- Verify the update
SELECT 
  t.task_number,
  tv.variant_name,
  tv.actions
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
ORDER BY tv.variant_name;
