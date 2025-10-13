-- =====
-- DROP AND RECREATE get_user_tasks FUNCTION
-- =====

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.get_user_tasks(UUID, INTEGER);

-- Now create the function with correct datatypes
CREATE OR REPLACE FUNCTION public.get_user_tasks(user_uuid UUID, module_num INTEGER DEFAULT 1)
RETURNS TABLE (
  task_id UUID,
  task_number INTEGER,
  title TEXT,  -- Changed from VARCHAR(300) to TEXT
  priority INTEGER,
  display_order INTEGER,
  variant_id UUID,
  variant_name TEXT,  -- Changed from VARCHAR(100) to TEXT
  intro_text TEXT,
  info_box_content TEXT,
  question_text TEXT,  -- Changed from VARCHAR(300) to TEXT
  actions JSONB,
  modal_title TEXT,  -- Changed from VARCHAR(200) to TEXT
  modal_content TEXT,
  modal_has_reminder BOOLEAN,
  modal_default_reminder_days INTEGER,
  official_link_url TEXT,
  official_link_label TEXT,  -- Changed from VARCHAR(200) to TEXT
  checklist_items JSONB,
  user_status TEXT,  -- Changed from VARCHAR(20) to TEXT
  user_completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as task_id,
    COALESCE(t.task_number, 0) as task_number,
    t.title,
    COALESCE(t.priority, 2) as priority, -- 2 = MEDIUM
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
    -- For now, just return the first variant (we'll add segmentation later)
    AND (tv.id IS NULL OR tv.id = (
      SELECT tv2.id 
      FROM public.task_variants tv2 
      WHERE tv2.task_id = t.id 
      ORDER BY tv2.priority DESC, tv2.created_at ASC 
      LIMIT 1
    ))
  ORDER BY COALESCE(t.display_order, 0), COALESCE(t.task_number, 0), COALESCE(tv.priority, 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
