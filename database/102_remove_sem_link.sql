-- Remove "Official SEM Information" link from info boxes
-- This link should be removed from all tasks

-- Update all task variants to remove SEM link
UPDATE public.task_variants 
SET info_box_content = REPLACE(info_box_content, 'Official SEM Information', '')
WHERE info_box_content LIKE '%Official SEM Information%';

-- Also check if it's in the main task description
UPDATE public.tasks 
SET description = REPLACE(description, 'Official SEM Information', '')
WHERE description LIKE '%Official SEM Information%';

-- Verify the changes
SELECT 
  t.task_number,
  t.title,
  t.description,
  tv.variant_name,
  tv.info_box_content
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.description LIKE '%SEM%' OR tv.info_box_content LIKE '%SEM%';
