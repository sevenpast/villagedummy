-- ============================================================================
-- FIX TASK 4 TARGET SEGMENTS
-- ============================================================================

-- Get the task_id for Task 4
DO $$
DECLARE
    task4_id UUID;
BEGIN
    SELECT id INTO task4_id FROM public.tasks WHERE task_number = 4 LIMIT 1;

    IF task4_id IS NOT NULL THEN
        RAISE NOTICE 'Found Task 4 ID: %', task4_id;

        -- Update with_children variant
        UPDATE public.task_variants 
        SET 
          target_segments = '["with_children"]'::jsonb,
          updated_at = NOW()
        WHERE variant_name = 'with_children' 
        AND task_id = task4_id;
        RAISE NOTICE 'Updated with_children variant target_segments.';

        -- Update without_children variant
        UPDATE public.task_variants 
        SET 
          target_segments = '["without_children"]'::jsonb,
          updated_at = NOW()
        WHERE variant_name = 'without_children' 
        AND task_id = task4_id;
        RAISE NOTICE 'Updated without_children variant target_segments.';

        -- Update unknown_children variant
        UPDATE public.task_variants 
        SET 
          target_segments = '["unknown_children"]'::jsonb,
          updated_at = NOW()
        WHERE variant_name = 'unknown_children' 
        AND task_id = task4_id;
        RAISE NOTICE 'Updated unknown_children variant target_segments.';

    ELSE
        RAISE WARNING 'Task 4 not found. Please ensure task_number 4 exists in public.tasks.';
    END IF;
END $$;

-- Verify the updates
SELECT 
  'Final Task 4 Target Segments Verification:' as info,
  tv.variant_name,
  tv.target_segments,
  tv.actions
FROM public.tasks t
JOIN public.task_variants tv ON t.id = tv.task_id
WHERE t.task_number = 4
ORDER BY tv.variant_name;

