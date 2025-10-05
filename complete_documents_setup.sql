-- Complete Documents Setup for Supabase
-- This script creates the documents table and related functionality

-- First, let's create the documents table with proper structure
CREATE TABLE IF NOT EXISTS public.documents_vault (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_data BYTEA NOT NULL, -- Store the actual file content
    document_type VARCHAR(100) NOT NULL, -- AI-detected type (passport, driver_license, etc.)
    tags TEXT[], -- Array of tags
    confidence DECIMAL(3,2), -- AI confidence score (0.00 to 1.00)
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to existing users table
    CONSTRAINT fk_documents_vault_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_vault_user_id ON public.documents_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_vault_document_type ON public.documents_vault(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_vault_uploaded_at ON public.documents_vault(uploaded_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_documents_vault_updated_at
    BEFORE UPDATE ON public.documents_vault
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_vault_updated_at();

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE public.documents_vault ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own documents
CREATE POLICY "Users can view their own documents" ON public.documents_vault
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own documents" ON public.documents_vault
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own documents" ON public.documents_vault
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own documents" ON public.documents_vault
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Grant necessary permissions
GRANT ALL ON public.documents_vault TO authenticated;
GRANT ALL ON public.documents_vault TO service_role;

-- Add some sample data (optional - for testing)
-- Note: Replace 'your-user-id-here' with an actual user ID from your users table
-- INSERT INTO public.documents_vault (user_id, file_name, original_name, file_type, file_size, file_data, document_type, tags, confidence, description)
-- VALUES (
--     'your-user-id-here'::uuid, 
--     'passport_scan_20250103.jpg', 
--     'My Swiss Passport.jpg', 
--     'image/jpeg', 
--     1024000, 
--     '\x89504E470D0A1A0A0000000D4948445200000001000000010802000000907753DE0000000A49444154789C6300010000050001'::bytea, 
--     'passport', 
--     ARRAY['official', 'government', 'identity', 'travel'], 
--     0.95, 
--     'Swiss passport scan for visa application'
-- );

-- Create a view for easy document access (without file_data for performance)
CREATE OR REPLACE VIEW public.documents_vault_summary AS
SELECT 
    id,
    user_id,
    file_name,
    original_name,
    file_type,
    file_size,
    document_type,
    tags,
    confidence,
    description,
    uploaded_at,
    created_at,
    updated_at
FROM public.documents_vault;

-- Grant access to the view
GRANT SELECT ON public.documents_vault_summary TO authenticated;
GRANT SELECT ON public.documents_vault_summary TO service_role;

-- Create a function to get document count per user
CREATE OR REPLACE FUNCTION get_user_document_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.documents_vault 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_document_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_document_count(UUID) TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Documents vault setup completed successfully!';
    RAISE NOTICE 'Table: public.documents_vault';
    RAISE NOTICE 'View: public.documents_vault_summary';
    RAISE NOTICE 'Function: get_user_document_count(UUID)';
    RAISE NOTICE 'RLS policies enabled for data security';
END $$;


