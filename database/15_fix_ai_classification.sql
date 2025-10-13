-- Fix AI classification column for documents table
-- This script adds the missing ai_classification column and related fields

-- Add ai_classification column (JSONB for storing AI analysis results)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS ai_classification JSONB;

-- Add other missing columns from the working system
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["unrecognized"]',
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'DE',
ADD COLUMN IF NOT EXISTS is_swiss_document BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS extracted_text TEXT DEFAULT '';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_ai_classification ON public.documents USING GIN (ai_classification);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_documents_confidence ON public.documents (confidence);

-- Update existing documents with default values
UPDATE public.documents 
SET 
  ai_classification = '{"category": "unknown", "confidence": 0.5, "extracted_fields": {}, "suggested_tags": ["unrecognized"], "reasoning": ["Legacy document - no AI analysis available"], "processed_at": "' || NOW()::text || '"}'::jsonb,
  tags = '["unrecognized"]'::jsonb,
  confidence = 0.5,
  description = 'Legacy document - no AI analysis available',
  language = 'DE',
  is_swiss_document = true,
  extracted_text = ''
WHERE ai_classification IS NULL OR tags IS NULL OR confidence IS NULL;

-- Grant permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO service_role;

SELECT 'AI Classification fields added to documents table ✅' as status;
