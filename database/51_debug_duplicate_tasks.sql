-- ============================================================================
-- DEBUG DUPLICATE TASKS - WHY ARE THERE 3x TASK 1?
-- ============================================================================

-- Check how many Task 1 variants exist
SELECT 'Task 1 variants:' as info, COUNT(*) as count
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1;

-- Show all Task 1 variants
SELECT 
  'Task 1 details:' as info,
  t.task_number,
  t.title,
  tv.variant_name,
  tv.target_segments,
  tv.modal_has_reminder,
  tv.modal_has_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Check what the get_user_tasks function returns for Task 1
-- (This simulates what the frontend receives)
SELECT 
  'Frontend data for Task 1:' as info,
  t.task_number,
  t.title,
  tv.variant_name,
  tv.target_segments,
  tv.modal_has_reminder,
  tv.modal_has_email_generator,
  'pending' as user_status
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 1
ORDER BY tv.variant_name;

-- Check if there are multiple tasks with task_number = 1
SELECT 'All tasks with number 1:' as info, id, title, task_number, is_active
FROM public.tasks 
WHERE task_number = 1;

-- Check the modules table
SELECT 'Modules:' as info, id, module_number, title, is_active
FROM public.modules
ORDER BY module_number;
