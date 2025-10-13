-- ============================================================================
-- FIX get_user_tasks FUNCTION - ADD modal_has_email_generator FIELD
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_tasks(UUID, INTEGER);

-- Create the function with modal_has_email_generator field
CREATE OR REPLACE FUNCTION public.get_user_tasks(user_uuid UUID, module_num INTEGER DEFAULT 1)
RETURNS TABLE (
  task_id UUID,
  task_number INTEGER,
  title TEXT,
  priority INTEGER,
  display_order INTEGER,
  variant_id UUID,
  variant_name CHARACTER VARYING,
  intro_text TEXT,
  info_box_content TEXT,
  question_text CHARACTER VARYING,
  actions JSONB,
  modal_title CHARACTER VARYING,
  modal_content TEXT,
  modal_has_reminder BOOLEAN,
  modal_default_reminder_days INTEGER,
  modal_has_email_generator BOOLEAN,  -- ADD THIS FIELD!
  official_link_url TEXT,
  official_link_label CHARACTER VARYING,
  checklist_items JSONB,
  user_status TEXT,
  user_completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as task_id,
    COALESCE(t.task_number, 0) as task_number,
    t.title,
    COALESCE(t.priority, 2) as priority,
    COALESCE(t.display_order, 0) as display_order,
    tv.id as variant_id,
    COALESCE(tv.variant_name, 'default') as variant_name,
    COALESCE(tv.intro_text, '') as intro_text,
    COALESCE(tv.info_box_content, '') as info_box_content,
    tv.question_text,
    tv.actions,
    tv.modal_title,
    tv.modal_content,
    COALESCE(tv.modal_has_reminder, false) as modal_has_reminder,
    COALESCE(tv.modal_default_reminder_days, 7) as modal_default_reminder_days,
    COALESCE(tv.modal_has_email_generator, false) as modal_has_email_generator,  -- ADD THIS LINE!
    tv.official_link_url,
    tv.official_link_label,
    tv.checklist_items,
    COALESCE(utp.status, 'not_started') as user_status,
    utp.completed_at as user_completed_at
  FROM public.tasks t
  JOIN public.modules m ON t.module_id = m.id
  LEFT JOIN public.task_variants tv ON t.id = tv.task_id
  LEFT JOIN public.user_task_progress utp ON t.id = utp.task_id AND utp.user_id = user_uuid
  WHERE COALESCE(m.module_number, 1) = module_num
    AND t.is_active = true
    AND m.is_active = true
  ORDER BY COALESCE(t.display_order, 0), COALESCE(t.task_number, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 'FUNCTION UPDATED:' as status, 'modal_has_email_generator field added' as message;
