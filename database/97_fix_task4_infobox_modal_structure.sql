-- Fix Task 4 info box and modal structure
-- Info box should only contain text and question with buttons
-- Modal should contain website, checklist, PDF upload, email, and reminder

-- Update Task 4 with_children variant to have correct question text
UPDATE public.task_variants 
SET question_text = 'Have you already registered your child(ren) for school yet?'
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
AND variant_name = 'with_children';

-- Ensure Task 4 with_children has correct actions (Yes/Not yet)
UPDATE public.task_variants 
SET actions = '[{"label": "Yes", "action": "mark_done", "style": "primary"}, {"label": "Not yet", "action": "open_modal", "style": "secondary"}]'
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
AND variant_name = 'with_children';

-- Ensure Task 4 with_children has modal features enabled
UPDATE public.task_variants 
SET 
  modal_has_reminder = true,
  modal_has_pdf_upload = true,
  modal_has_school_email_generator = true
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
AND variant_name = 'with_children';

-- Clear the info_box_content for Task 4 with_children to avoid duplication
-- The content should only come from dynamic-content-generator.ts
UPDATE public.task_variants 
SET info_box_content = ''
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
AND variant_name = 'with_children';

-- Clear the modal_content for Task 4 with_children to remove unwanted text
UPDATE public.task_variants 
SET modal_content = ''
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 4)
AND variant_name = 'with_children';

-- Verify the changes
SELECT 
  t.task_number,
  tv.variant_name,
  tv.question_text,
  tv.actions,
  tv.modal_has_reminder,
  tv.modal_has_pdf_upload,
  tv.modal_has_school_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
AND tv.variant_name = 'with_children';
