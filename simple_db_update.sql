-- Simple database update for document analysis fields
-- Run this in Supabase SQL Editor

-- Add tags column
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["unrecognized"]';

-- Add confidence column  
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0.50;

-- Update existing documents
UPDATE documents SET tags = '["unrecognized"]', confidence = 0.50 WHERE tags IS NULL OR confidence IS NULL;
