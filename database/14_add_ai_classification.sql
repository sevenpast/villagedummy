-- Add AI classification fields to documents table
-- This migration adds fields to store AI analysis results

-- Add AI classification column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS ai_classification JSONB;

-- Add index for AI classification queries
CREATE INDEX IF NOT EXISTS idx_documents_ai_category ON public.documents USING GIN ((ai_classification->>'category'));
CREATE INDEX IF NOT EXISTS idx_documents_ai_confidence ON public.documents USING BTREE ((ai_classification->>'confidence')::float);

-- Add function to extract AI classification data
CREATE OR REPLACE FUNCTION get_ai_classification_stats()
RETURNS TABLE (
  category TEXT,
  count BIGINT,
  avg_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai_classification->>'category' as category,
    COUNT(*) as count,
    AVG((ai_classification->>'confidence')::float) as avg_confidence
  FROM public.documents 
  WHERE ai_classification IS NOT NULL
  GROUP BY ai_classification->>'category'
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Add function to get documents by AI confidence
CREATE OR REPLACE FUNCTION get_documents_by_confidence(min_confidence FLOAT DEFAULT 0.8)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  category TEXT,
  ai_category TEXT,
  confidence FLOAT,
  extracted_fields JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.file_name,
    d.category,
    d.ai_classification->>'category' as ai_category,
    (d.ai_classification->>'confidence')::float as confidence,
    d.ai_classification->'extracted_fields' as extracted_fields
  FROM public.documents d
  WHERE d.ai_classification IS NOT NULL
    AND (d.ai_classification->>'confidence')::float >= min_confidence
  ORDER BY confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_ai_classification_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_documents_by_confidence(FLOAT) TO authenticated;

SELECT 'AI Classification fields added to documents table ✅' as status;
