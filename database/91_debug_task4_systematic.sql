-- ============================================================================
-- SYSTEMATIC DEBUG OF TASK 4 BUTTONS ISSUE
-- ============================================================================

-- Step 1: Check what Task 4 variants exist and their current state
SELECT 
  'STEP 1: Current Task 4 Variants' as debug_step,
  t.task_number,
  t.title as task_title,
  tv.variant_name,
  tv.title as variant_title,
  tv.target_segments,
  tv.actions,
  tv.question_text
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
ORDER BY tv.variant_name;

-- Step 2: Check user profile for has_children value
SELECT 
  'STEP 2: User Profile has_children' as debug_step,
  user_id,
  email,
  has_children,
  children_ages,
  updated_at
FROM public.user_profiles 
WHERE user_id = 'fd0e0428-d23b-4bb5-8067-f196cb241906';

-- Step 3: Test the get_user_tasks function directly
SELECT 
  'STEP 3: get_user_tasks Function Result' as debug_step,
  task_number,
  variant_name,
  question_text,
  actions,
  is_completed
FROM public.get_user_tasks('fd0e0428-d23b-4bb5-8067-f196cb241906')
WHERE task_number = 4;

-- Step 4: Check if there are any user_tasks entries for Task 4
SELECT 
  'STEP 4: User Tasks for Task 4' as debug_step,
  ut.user_id,
  ut.task_id,
  ut.is_completed,
  ut.completed_at,
  t.task_number,
  t.title
FROM public.user_tasks ut
JOIN public.tasks t ON ut.task_id = t.id
WHERE ut.user_id = 'fd0e0428-d23b-4bb5-8067-f196cb241906'
AND t.task_number = 4;

-- Step 5: Check the exact logic that should be applied
SELECT 
  'STEP 5: Variant Selection Logic Test' as debug_step,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = 'fd0e0428-d23b-4bb5-8067-f196cb241906' 
      AND up.has_children = true
    ) THEN 'with_children'
    WHEN EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = 'fd0e0428-d23b-4bb5-8067-f196cb241906' 
      AND up.has_children = false
    ) THEN 'without_children'
    ELSE 'unknown_children'
  END as expected_variant,
  (SELECT has_children FROM public.user_profiles WHERE user_id = 'fd0e0428-d23b-4bb5-8067-f196cb241906') as actual_has_children;

