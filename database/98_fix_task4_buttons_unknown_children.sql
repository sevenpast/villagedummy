-- Fix Task 4 buttons for unknown_children variant
-- Ensure "Yes" and "Not yet" buttons for users without children

-- Update Task 4 unknown_children variant to have correct actions
UPDATE public.task_variants 
SET actions = '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]'
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
AND variant_name = 'unknown_children';

-- Ensure Task 4 unknown_children has modal features enabled
UPDATE public.task_variants 
SET 
  modal_has_reminder = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = true
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
AND variant_name = 'unknown_children';

-- Verify the changes
SELECT 
  t.task_number,
  tv.variant_name,
  tv.actions,
  tv.modal_has_reminder,
  tv.modal_has_pdf_upload,
  tv.modal_has_school_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
AND tv.variant_name = 'unknown_children';
