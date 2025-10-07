-- Add missing columns to existing documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'done', 'error')),
ADD COLUMN IF NOT EXISTS signals jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS error_message text;

-- Create index on status for job processing
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents (status);

-- Update existing documents to have 'done' status
UPDATE public.documents SET status = 'done' WHERE status IS NULL;
