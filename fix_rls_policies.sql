-- Fix Storage RLS Policies for Documents Bucket
-- Run this in Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop all existing policies on storage.objects
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Create simple permissive policies for the documents bucket
CREATE POLICY "Allow all operations on documents bucket"
ON storage.objects FOR ALL
TO authenticated, anon
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Service role can do everything
CREATE POLICY "Service role can do everything"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
