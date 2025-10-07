-- Enable RLS on existing documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents (if they don't exist)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "users_select_own_docs" ON public.documents;
    DROP POLICY IF EXISTS "users_insert_own_docs" ON public.documents;
    DROP POLICY IF EXISTS "users_update_own_docs" ON public.documents;
    DROP POLICY IF EXISTS "users_delete_own_docs" ON public.documents;
    
    -- Create new policies
    CREATE POLICY "users_select_own_docs" ON public.documents 
        FOR SELECT TO authenticated 
        USING (auth.uid() = user_id);
    
    CREATE POLICY "users_insert_own_docs" ON public.documents 
        FOR INSERT TO authenticated 
        WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "users_update_own_docs" ON public.documents 
        FOR UPDATE TO authenticated 
        USING (auth.uid() = user_id);
    
    CREATE POLICY "users_delete_own_docs" ON public.documents 
        FOR DELETE TO authenticated 
        USING (auth.uid() = user_id);
END $$;
