-- ============================================================================
-- CREATE SUPABASE STORAGE BUCKET FOR DOCUMENT VAULT
-- ============================================================================

-- Create the documents bucket (matching the code) - only if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents');

-- Create RLS policies for the storage bucket - only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload their own documents') THEN
        CREATE POLICY "Users can upload their own documents"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'documents'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view their own documents') THEN
        CREATE POLICY "Users can view their own documents"
        ON storage.objects FOR SELECT
        USING (
          bucket_id = 'documents'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their own documents') THEN
        CREATE POLICY "Users can update their own documents"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'documents'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their own documents') THEN
        CREATE POLICY "Users can delete their own documents"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'documents'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Service role can access all documents') THEN
        CREATE POLICY "Service role can access all documents"
        ON storage.objects FOR ALL
        TO service_role
        USING (bucket_id = 'documents');
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'STORAGE BUCKET CREATED ✅' as status;
SELECT 'Bucket exists: ' || CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN 'YES ✅' ELSE 'NO ❌' END as bucket_check;
SELECT 'RLS policies created: ' || COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
