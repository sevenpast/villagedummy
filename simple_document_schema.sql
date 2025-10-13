-- Simple Document Vault Schema (No Encryption, No OCR/AI)

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can only see their own documents
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'documents_own_documents') THEN
        CREATE POLICY "documents_own_documents" ON public.documents
            FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.documents TO anon;

-- Create storage bucket (run this in Supabase Storage)
-- Bucket name: documents
-- Public: No

SELECT 'Simple Document Vault Schema Created ✅' as status;
