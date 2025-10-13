-- ============================================================================
-- CREATE DOCUMENT PROCESSING TABLE FOR PDF OCR DYNAMIC FORM FILLING
-- ============================================================================

-- Create document_processing table
CREATE TABLE IF NOT EXISTS public.document_processing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  ocr_results TEXT,
  form_mapping JSONB,
  extracted_data JSONB,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  confidence_score DECIMAL(3,2),
  processing_time_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_processing_user_id ON public.document_processing(user_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_task_id ON public.document_processing(task_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_status ON public.document_processing(processing_status);
CREATE INDEX IF NOT EXISTS idx_document_processing_created_at ON public.document_processing(created_at);

-- Enable Row Level Security
ALTER TABLE public.document_processing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own document processing" ON public.document_processing
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document processing" ON public.document_processing
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document processing" ON public.document_processing
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own document processing" ON public.document_processing
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_processing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_document_processing_updated_at
  BEFORE UPDATE ON public.document_processing
  FOR EACH ROW
  EXECUTE FUNCTION update_document_processing_updated_at();

-- Verify the table was created
SELECT 'SUCCESS:' as status, 'Document processing table created successfully!' as message;

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'document_processing' 
ORDER BY ordinal_position;
