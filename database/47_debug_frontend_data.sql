-- ============================================================================
-- DEBUG FRONTEND DATA - CHECK WHAT THE FRONTEND RECEIVES
-- ============================================================================

-- This simulates what the get_user_tasks function returns for Task 5
SELECT 
  t.id as task_id,
  t.task_number,
  t.title,
  t.priority,
  t.display_order,
  tv.id as variant_id,
  tv.variant_name,
  tv.intro_text,
  tv.info_box_content,
  tv.question_text,
  tv.actions,
  tv.modal_title,
  tv.modal_content,
  tv.modal_has_reminder,
  tv.modal_default_reminder_days,
  tv.modal_has_email_generator,  -- This is the key field!
  tv.official_link_url,
  tv.official_link_label,
  tv.checklist_items,
  'pending' as user_status,
  NULL as user_completed_at
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 5
ORDER BY tv.variant_name;

-- Also check what the get_user_tasks function actually returns
-- (This will only work if you have a user logged in)
-- SELECT * FROM get_user_tasks('some-user-id', 1) WHERE task_number = 5;
