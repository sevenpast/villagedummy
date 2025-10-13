-- Remove unwanted intro text from Task 4 and fix buttons
-- Clear the intro_text for all Task 4 variants and set correct buttons

-- Remove intro text and unwanted modal content
UPDATE public.task_variants 
SET 
  intro_text = '',
  modal_content = ''
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4);

-- Set correct buttons for all Task 4 variants (Yes and Not yet)
UPDATE public.task_variants 
SET actions = '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]'
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4);

-- Ensure all Task 4 variants have modal features enabled
UPDATE public.task_variants 
SET 
  modal_has_reminder = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = true
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4);

-- Verify the changes
SELECT 
  t.task_number,
  tv.variant_name,
  tv.intro_text,
  tv.modal_content,
  tv.actions,
  tv.modal_has_reminder,
  tv.modal_has_pdf_upload,
  tv.modal_has_school_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4;
