-- Setup Documents System
-- Run this in your Supabase SQL Editor

-- 1. Ensure documents table exists with correct structure
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    file_name character varying NOT NULL,
    file_size integer,
    file_type character varying,
    storage_path text NOT NULL,
    document_type character varying,
    task_id integer,
    is_verified boolean DEFAULT false,
    verified_by uuid,
    verified_at timestamp without time zone,
    uploaded_at timestamp without time zone DEFAULT NOW(),
    expires_at timestamp without time zone,
    CONSTRAINT documents_pkey PRIMARY KEY (id),
    CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT documents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
    CONSTRAINT documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);

-- 2. Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies
-- Allow authenticated users to upload documents
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Grant permissions to service_role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Specifically grant permissions on the documents table
GRANT ALL ON public.documents TO service_role;

-- Grant permissions on sequences that exist
GRANT USAGE ON SEQUENCE tasks_id_seq TO service_role;
GRANT USAGE ON SEQUENCE modules_id_seq TO service_role;

-- Make sure the service_role can create tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON public.documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);

-- 6. Grant storage permissions to service_role
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;

COMMENT ON TABLE public.documents IS 'User document storage with metadata and file references';
COMMENT ON COLUMN public.documents.storage_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN public.documents.document_type IS 'Auto-detected document type (Passport, ID Card, etc.)';
