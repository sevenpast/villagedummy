-- ============================================================================
-- ACTIVATE TASK 4 - SCHOOL REGISTRATION
-- ============================================================================

-- First, let's check what tasks exist
SELECT id, task_id, title, is_active FROM public.tasks WHERE task_id LIKE '%task-4%' OR title LIKE '%school%';

-- Check if Task 4 exists in task_variants
SELECT task_id, variant_name, is_active FROM public.task_variants WHERE task_id LIKE '%task-4%' OR task_id LIKE '%school%';

-- If Task 4 doesn't exist, we need to create it first
-- Let's check the current task structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' AND table_schema = 'public';
