-- ============================================================================
-- FIX DUPLICATE TASK 3 - SHOW ONLY ONE VARIANT PER TASK
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_tasks(UUID, INTEGER);

-- Create the function that shows only one variant per task
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
  modal_has_email_generator BOOLEAN,
  modal_has_pdf_upload BOOLEAN,
  modal_has_school_email_generator BOOLEAN,
  official_link_url TEXT,
  official_link_label CHARACTER VARYING,
  checklist_items JSONB,
  user_status TEXT,
  user_completed_at TIMESTAMPTZ
) AS $$
DECLARE
  user_segments TEXT[];
BEGIN
  -- Calculate user segments
  user_segments := public.calculate_user_segments(user_uuid);
  
  RETURN QUERY
  SELECT DISTINCT ON (t.id)
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
    COALESCE(tv.modal_has_email_generator, false) as modal_has_email_generator,
    COALESCE(tv.modal_has_pdf_upload, false) as modal_has_pdf_upload,
    COALESCE(tv.modal_has_school_email_generator, false) as modal_has_school_email_generator,
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
    AND (tv.target_segments IS NULL OR tv.target_segments = '[]'::jsonb OR 
         EXISTS (
           SELECT 1 FROM jsonb_array_elements_text(tv.target_segments) AS segment
           WHERE segment = ANY(user_segments)
         ))
  ORDER BY t.id, 
    -- Priority order for variants: eu_efta > visa_exempt > visa_required > no_info
    CASE tv.variant_name 
      WHEN 'eu_efta' THEN 1
      WHEN 'visa_exempt' THEN 2
      WHEN 'visa_required' THEN 3
      WHEN 'no_info' THEN 4
      ELSE 5
    END,
    COALESCE(t.display_order, 0), 
    COALESCE(t.task_number, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 'FUNCTION UPDATED:' as status, 'Now shows only one variant per task' as message;
