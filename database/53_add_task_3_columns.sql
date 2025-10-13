-- ============================================================================
-- ADD NEW COLUMNS FOR TASK 3 FEATURES
-- ============================================================================

-- Add columns for PDF upload functionality
ALTER TABLE public.task_variants 
ADD COLUMN IF NOT EXISTS modal_has_pdf_upload BOOLEAN DEFAULT false;

-- Add columns for school email generator functionality
ALTER TABLE public.task_variants 
ADD COLUMN IF NOT EXISTS modal_has_school_email_generator BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_variants' 
AND column_name IN ('modal_has_pdf_upload', 'modal_has_school_email_generator');
