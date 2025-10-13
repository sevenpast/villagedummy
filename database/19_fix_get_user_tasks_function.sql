-- =====
-- FIX get_user_tasks FUNCTION
-- =====

-- Function to calculate user segments based on profile data
CREATE OR REPLACE FUNCTION public.calculate_user_segments(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  user_profile RECORD;
  segments TEXT[] := '{}';
BEGIN
  -- Get user profile data
  SELECT * INTO user_profile 
  FROM public.user_profiles 
  WHERE user_id = user_uuid;
  
  -- If no profile exists, return basic segment
  IF user_profile IS NULL THEN
    RETURN ARRAY['profile_incomplete'];
  END IF;
  
  -- Family status segments
  IF user_profile.family_status = 'single' THEN
    segments := segments || 'single';
  ELSIF user_profile.family_status = 'married' THEN
    segments := segments || 'married';
  ELSIF user_profile.family_status = 'with_children' THEN
    segments := segments || 'with_children';
  END IF;
  
  -- Country-based segments
  IF user_profile.country_of_origin IS NULL THEN
    segments := segments || 'profile_incomplete';
  ELSIF user_profile.country_of_origin IN ('Germany', 'France', 'Italy', 'Austria', 'Switzerland') THEN
    segments := segments || 'eu_efta';
  ELSIF user_profile.country_of_origin IN ('USA', 'Canada', 'Australia', 'Japan', 'South Korea') THEN
    segments := segments || 'non_eu_visa_exempt';
  ELSE
    segments := segments || 'non_eu_visa_required';
  END IF;
  
  -- Work permit segments
  IF user_profile.work_permit_type = 'B' THEN
    segments := segments || 'permit_b';
  ELSIF user_profile.work_permit_type = 'L' THEN
    segments := segments || 'permit_l';
  ELSIF user_profile.work_permit_type = 'G' THEN
    segments := segments || 'permit_g';
  END IF;
  
  -- Language preference segments
  IF user_profile.language_preference = 'de' THEN
    segments := segments || 'german_speaker';
  ELSIF user_profile.language_preference = 'fr' THEN
    segments := segments || 'french_speaker';
  ELSIF user_profile.language_preference = 'it' THEN
    segments := segments || 'italian_speaker';
  ELSIF user_profile.language_preference = 'en' THEN
    segments := segments || 'english_speaker';
  END IF;
  
  RETURN segments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized tasks for a user
CREATE OR REPLACE FUNCTION public.get_user_tasks(user_uuid UUID, module_num INTEGER DEFAULT 1)
RETURNS TABLE (
  task_id UUID,
  task_number INTEGER,
  title VARCHAR(300),
  priority INTEGER,
  display_order INTEGER,
  variant_id UUID,
  variant_name VARCHAR(100),
  intro_text TEXT,
  info_box_content TEXT,
  question_text VARCHAR(300),
  actions JSONB,
  modal_title VARCHAR(200),
  modal_content TEXT,
  modal_has_reminder BOOLEAN,
  modal_default_reminder_days INTEGER,
  official_link_url TEXT,
  official_link_label VARCHAR(200),
  checklist_items JSONB,
  user_status VARCHAR(20),
  user_completed_at TIMESTAMPTZ
) AS $$
DECLARE
  user_segments TEXT[];
BEGIN
  -- Calculate user segments
  user_segments := public.calculate_user_segments(user_uuid);
  
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
    AND (tv.target_segments IS NULL OR tv.target_segments = '[]'::jsonb OR 
         EXISTS (
           SELECT 1 FROM jsonb_array_elements_text(tv.target_segments) AS segment
           WHERE segment = ANY(user_segments)
         ))
  ORDER BY COALESCE(t.display_order, 0), COALESCE(t.task_number, 0), COALESCE(tv.priority, 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
