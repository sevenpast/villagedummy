-- ============================================================================
-- CHECK AND ACTIVATE TASK 4 - SCHOOL REGISTRATION
-- ============================================================================

-- First, let's check the actual schema of the tasks table
SELECT 'Tasks table schema:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- Check the task_variants table schema too
SELECT 'Task variants table schema:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'task_variants' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- Now let's see what tasks currently exist (using correct column names)
SELECT 'Current tasks:' as info;
SELECT id, task_number, title, is_active FROM public.tasks ORDER BY task_number;

-- Check if Task 4 exists
SELECT 'Task 4 check:' as info;
SELECT id, task_number, title, is_active FROM public.tasks WHERE task_number = 4;

-- Check task variants for Task 4 (we need to see how they're linked)
SELECT 'Task 4 variants:' as info;
SELECT tv.id, tv.task_id, tv.variant_name, tv.is_active 
FROM public.task_variants tv 
WHERE tv.task_id IN (
    SELECT id::text FROM public.tasks WHERE task_number = 4
);

-- If Task 4 exists, activate it
UPDATE public.tasks 
SET is_active = true 
WHERE task_number = 4;

-- Activate Task 4 variants
UPDATE public.task_variants 
SET is_active = true 
WHERE task_id IN (
    SELECT id::text FROM public.tasks WHERE task_number = 4
);

-- Show final status
SELECT 'Final Task 4 status:' as info;
SELECT id, task_number, title, is_active FROM public.tasks WHERE task_number = 4;

SELECT 'SUCCESS: Task 4 activation completed!' as status;
