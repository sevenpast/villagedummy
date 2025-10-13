-- ============================================================================
-- FIX DUPLICATE TASKS - REMOVE DUPLICATE TASK 1 VARIANTS
-- ============================================================================

-- First, let's see what we have
SELECT 'BEFORE FIX - Task 1 variants:' as info, variant_name, COUNT(*) as count
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
GROUP BY variant_name;

-- Keep only one variant per task (the most complete one)
-- For Task 1, we'll keep the 'eu_efta' variant and remove others
DELETE FROM public.task_variants 
WHERE task_id = (SELECT id FROM public.tasks WHERE task_number = 1)
AND variant_name NOT IN ('eu_efta');

-- If eu_efta doesn't exist, keep the first one we find
DO $$
DECLARE
    task_1_id UUID;
    first_variant_name TEXT;
BEGIN
    -- Get Task 1 ID
    SELECT id INTO task_1_id FROM public.tasks WHERE task_number = 1;
    
    -- Get the first variant name for Task 1
    SELECT variant_name INTO first_variant_name 
    FROM public.task_variants 
    WHERE task_id = task_1_id 
    LIMIT 1;
    
    -- If we have a variant, keep only that one
    IF first_variant_name IS NOT NULL THEN
        DELETE FROM public.task_variants 
        WHERE task_id = task_1_id 
        AND variant_name != first_variant_name;
    END IF;
END $$;

-- Verify the fix
SELECT 'AFTER FIX - Task 1 variants:' as info, variant_name, COUNT(*) as count
FROM public.task_variants tv
JOIN public.tasks t ON tv.task_id = t.id
WHERE t.task_number = 1
GROUP BY variant_name;

-- Show the final Task 1 variant
SELECT 
  'Final Task 1:' as info,
  t.task_number,
  t.title,
  tv.variant_name,
  tv.modal_has_reminder,
  tv.modal_has_email_generator
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 1;
