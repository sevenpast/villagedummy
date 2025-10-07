-- Add AI analysis columns to documents table
-- This script adds the necessary columns for intelligent document recognition
-- Compatible with the current database schema using gen_random_uuid()

-- Add tags column (JSONB for storing array of tags)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["unrecognized"]';

-- Add confidence column (DECIMAL for storing confidence score 0.0-1.0)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.5;

-- Add description column (TEXT for storing AI-generated description)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add language column (VARCHAR for detected language)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'DE';

-- Add is_swiss_document column (BOOLEAN for Swiss document detection)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_swiss_document BOOLEAN DEFAULT true;

-- Add extracted_text column (TEXT for storing first 1000 chars of extracted text)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT DEFAULT '';

-- Create index on tags for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN (tags);

-- Create index on document_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents (document_type);

-- Create index on confidence for quality filtering
CREATE INDEX IF NOT EXISTS idx_documents_confidence ON documents (confidence);

-- Update existing documents with default values
UPDATE documents 
SET 
  tags = '["unrecognized"]',
  confidence = 0.5,
  description = 'Legacy document - no AI analysis available',
  language = 'DE',
  is_swiss_document = true,
  extracted_text = ''
WHERE tags IS NULL OR confidence IS NULL;

-- Grant permissions to service role (documents table uses gen_random_uuid(), no sequence needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO service_role;
