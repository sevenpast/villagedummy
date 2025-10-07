# Supabase Setup Guide

## Problem
The ZIP download functionality is failing with "permission denied for schema public" error. This means the Supabase database is not properly configured.

## Solution

### 1. Create Environment Variables File
Create a `.env.local` file in your project root with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API (optional)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Get Your Supabase Credentials
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your project
3. Go to Settings → API
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create the Documents Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- Grant permissions
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT USAGE ON SEQUENCE documents_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE documents_id_seq TO service_role;
```

### 4. Create Storage Bucket
1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `documents`
3. Set it to public if you want public access, or private for secure access

### 5. Restart Development Server
```bash
npm run dev
```

## Testing
After setup, the ZIP download should work properly. You can test by:
1. Going to `/vault`
2. Uploading a document
3. Clicking "Download All" button

## Troubleshooting
- **Permission denied**: Check that the service role key is correct
- **Table not found**: Make sure you ran the SQL to create the documents table
- **Storage errors**: Verify the storage bucket exists and has proper permissions
