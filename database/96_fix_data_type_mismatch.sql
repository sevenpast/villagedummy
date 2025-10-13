-- ============================================================================
-- FIX DATA TYPE MISMATCH IN get_user_tasks FUNCTION
-- ============================================================================

-- First, let's check the actual column types in the database
SELECT 
  'Column types in tasks table:' as info,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'Column types in task_variants table:' as info,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'task_variants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_tasks(UUID);

-- Create the function with explicit type casting to match the database schema
CREATE OR REPLACE FUNCTION public.get_user_tasks(p_user_id UUID)
RETURNS TABLE (
  task_id UUID,
  task_number INTEGER,
  title TEXT,
  description TEXT,
  variant_name TEXT,
  info_box_content TEXT,
  question_text TEXT,
  actions JSONB,
  modal_title TEXT,
  modal_content TEXT,
  modal_has_reminder BOOLEAN,
  modal_default_reminder_days INTEGER,
  modal_has_email_generator BOOLEAN,
  modal_has_pdf_upload BOOLEAN,
  modal_has_school_email_generator BOOLEAN,
  checklist_items JSONB,
  is_completed BOOLEAN,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (t.task_number)
    t.id as task_id,
    t.task_number,
    t.title::TEXT as title,
    t.description::TEXT as description,
    tv.variant_name::TEXT as variant_name,
    tv.info_box_content::TEXT as info_box_content,
    tv.question_text::TEXT as question_text,
    tv.actions,
    tv.modal_title::TEXT as modal_title,
    tv.modal_content::TEXT as modal_content,
    tv.modal_has_reminder,
    tv.modal_default_reminder_days,
    tv.modal_has_email_generator,
    tv.modal_has_pdf_upload,
    tv.modal_has_school_email_generator,
    tv.checklist_items,
    false as is_completed,  -- Default to not completed since we don't have user_tasks table
    NULL::TIMESTAMPTZ as completed_at
  FROM public.tasks t
  JOIN public.task_variants tv ON t.id = tv.task_id
  WHERE t.is_active = true
  AND (
    -- Task 1: Based on country_of_origin
    (t.task_number = 1 AND (
      (tv.variant_name = 'eu_efta' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.country_of_origin IN ('germany', 'austria', 'france', 'italy', 'spain', 'portugal', 'netherlands', 'belgium', 'luxembourg', 'denmark', 'sweden', 'norway', 'finland', 'iceland', 'liechtenstein', 'switzerland')
      ))
      OR (tv.variant_name = 'visa_exempt' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.country_of_origin IN ('united-kingdom', 'united-states', 'canada', 'australia', 'new-zealand', 'japan', 'south-korea', 'singapore', 'malaysia', 'thailand', 'mauritius', 'seychelles', 'costa-rica', 'panama', 'venezuela', 'ecuador', 'peru', 'macau', 'brunei', 'andorra', 'monaco', 'san-marino', 'vatican-city')
      ))
      OR (tv.variant_name = 'visa_required' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.country_of_origin IN ('china', 'india', 'brazil', 'russia', 'south-africa', 'turkey', 'egypt', 'nigeria', 'philippines', 'vietnam', 'indonesia', 'sri-lanka', 'bangladesh', 'pakistan', 'iran', 'iraq', 'afghanistan', 'ethiopia', 'kenya', 'morocco', 'algeria', 'tunisia', 'ukraine', 'belarus', 'moldova', 'georgia', 'armenia', 'azerbaijan', 'kazakhstan', 'uzbekistan', 'kyrgyzstan', 'tajikistan', 'turkmenistan', 'mongolia', 'nepal', 'bhutan', 'myanmar', 'cambodia', 'laos', 'north-korea', 'taiwan', 'hong-kong', 'macau')
      ))
      OR (tv.variant_name = 'no_info' AND (
        NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = p_user_id AND up.country_of_origin IS NOT NULL AND up.country_of_origin != '' AND up.country_of_origin != 'other')
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = p_user_id AND up.country_of_origin = 'other')
      ))
    ))
    -- Task 3: Based on country_of_origin (same logic as Task 1)
    OR (t.task_number = 3 AND (
      (tv.variant_name = 'eu_efta' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.country_of_origin IN ('germany', 'austria', 'france', 'italy', 'spain', 'portugal', 'netherlands', 'belgium', 'luxembourg', 'denmark', 'sweden', 'norway', 'finland', 'iceland', 'liechtenstein', 'switzerland')
      ))
      OR (tv.variant_name = 'visa_exempt' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.country_of_origin IN ('united-kingdom', 'united-states', 'canada', 'australia', 'new-zealand', 'japan', 'south-korea', 'singapore', 'malaysia', 'thailand', 'mauritius', 'seychelles', 'costa-rica', 'panama', 'venezuela', 'ecuador', 'peru', 'macau', 'brunei', 'andorra', 'monaco', 'san-marino', 'vatican-city')
      ))
      OR (tv.variant_name = 'visa_required' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.country_of_origin IN ('china', 'india', 'brazil', 'russia', 'south-africa', 'turkey', 'egypt', 'nigeria', 'philippines', 'vietnam', 'indonesia', 'sri-lanka', 'bangladesh', 'pakistan', 'iran', 'iraq', 'afghanistan', 'ethiopia', 'kenya', 'morocco', 'algeria', 'tunisia', 'ukraine', 'belarus', 'moldova', 'georgia', 'armenia', 'azerbaijan', 'kazakhstan', 'uzbekistan', 'kyrgyzstan', 'tajikistan', 'turkmenistan', 'mongolia', 'nepal', 'bhutan', 'myanmar', 'cambodia', 'laos', 'north-korea', 'taiwan', 'hong-kong', 'macau')
      ))
      OR (tv.variant_name = 'no_info' AND (
        NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = p_user_id AND up.country_of_origin IS NOT NULL AND up.country_of_origin != '' AND up.country_of_origin != 'other')
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = p_user_id AND up.country_of_origin = 'other')
      ))
    ))
    -- Task 4: Based on has_children
    OR (t.task_number = 4 AND (
      (tv.variant_name = 'with_children' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.has_children = true
      ))
      OR (tv.variant_name = 'without_children' AND EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = p_user_id 
        AND up.has_children = false
      ))
      OR (tv.variant_name = 'unknown_children' AND (
        NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = p_user_id AND up.has_children IS NOT NULL)
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.user_id = p_user_id AND up.has_children IS NULL)
      ))
    ))
    -- Other tasks: Use default variant
    OR (t.task_number NOT IN (1, 3, 4) AND tv.variant_name = 'default')
  )
  ORDER BY t.task_number, 
    CASE 
      WHEN t.task_number = 1 THEN 
        CASE tv.variant_name 
          WHEN 'eu_efta' THEN 1
          WHEN 'visa_exempt' THEN 2
          WHEN 'visa_required' THEN 3
          WHEN 'no_info' THEN 4
          ELSE 5
        END
      WHEN t.task_number = 3 THEN 
        CASE tv.variant_name 
          WHEN 'eu_efta' THEN 1
          WHEN 'visa_exempt' THEN 2
          WHEN 'visa_required' THEN 3
          WHEN 'no_info' THEN 4
          ELSE 5
        END
      WHEN t.task_number = 4 THEN 
        CASE tv.variant_name 
          WHEN 'with_children' THEN 1
          WHEN 'without_children' THEN 2
          WHEN 'unknown_children' THEN 3
          ELSE 4
        END
      ELSE 1
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with the user ID
SELECT 
  'Test get_user_tasks function (with type casting):' as info,
  task_number,
  variant_name,
  question_text,
  actions,
  is_completed
FROM public.get_user_tasks('fd0e0428-d23b-4bb5-8067-f196cb241906'::UUID)
ORDER BY task_number;

