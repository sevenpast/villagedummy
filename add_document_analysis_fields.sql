-- Add intelligent document analysis fields to documents table
-- This script adds tags and confidence fields for Gemini AI analysis

-- Add tags column (JSON array of strings)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["unrecognized"]';

-- Add confidence column (float between 0 and 1)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.50;

-- Add index on tags for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN (tags);

-- Add index on confidence for filtering
CREATE INDEX IF NOT EXISTS idx_documents_confidence ON documents (confidence);

-- Update existing documents with default values
UPDATE documents 
SET tags = '["unrecognized"]', confidence = 0.50 
WHERE tags IS NULL OR confidence IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN documents.tags IS 'AI-generated tags for document categorization (JSON array)';
COMMENT ON COLUMN documents.confidence IS 'AI confidence score for document analysis (0.00 to 1.00)';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('tags', 'confidence');
