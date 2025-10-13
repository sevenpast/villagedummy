-- ============================================================================
-- ADD modal_has_email_generator COLUMN TO task_variants TABLE
-- ============================================================================

-- Add the missing column to task_variants table
ALTER TABLE public.task_variants 
ADD COLUMN IF NOT EXISTS modal_has_email_generator BOOLEAN DEFAULT false;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_variants' 
AND column_name = 'modal_has_email_generator';
