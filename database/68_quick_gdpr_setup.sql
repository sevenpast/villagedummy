-- ============================================================================
-- QUICK GDPR SETUP - MINIMAL VERSION FOR TESTING
-- PostgreSQL 15+ with Supabase
-- ============================================================================

-- Create only the essential tables for testing
CREATE TABLE IF NOT EXISTS public.data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'full_export',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_data_types TEXT[] NOT NULL,
    file_format VARCHAR(20) NOT NULL DEFAULT 'json',
    file_path TEXT,
    file_size_bytes BIGINT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 3,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    data_processing_consent BOOLEAN NOT NULL DEFAULT true,
    email_marketing_consent BOOLEAN NOT NULL DEFAULT false,
    analytics_consent BOOLEAN NOT NULL DEFAULT true,
    document_processing_consent BOOLEAN NOT NULL DEFAULT true,
    ai_processing_consent BOOLEAN NOT NULL DEFAULT true,
    data_sharing_consent BOOLEAN NOT NULL DEFAULT false,
    automated_decision_making_consent BOOLEAN NOT NULL DEFAULT false,
    profiling_consent BOOLEAN NOT NULL DEFAULT false,
    third_party_data_sharing BOOLEAN NOT NULL DEFAULT false,
    data_retention_consent BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple function to get user data
CREATE OR REPLACE FUNCTION public.get_all_user_data(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    user_profile JSONB;
    user_tasks JSONB;
    user_settings JSONB;
BEGIN
    -- Get user profile data
    SELECT to_jsonb(p.*) INTO user_profile
    FROM public.user_profiles p
    WHERE p.user_id = user_uuid;
    
    -- Get user task progress
    SELECT jsonb_agg(to_jsonb(utp.*)) INTO user_tasks
    FROM public.user_task_progress utp
    WHERE utp.user_id = user_uuid;
    
    -- Get privacy settings
    SELECT to_jsonb(ps.*) INTO user_settings
    FROM public.privacy_settings ps
    WHERE ps.user_id = user_uuid;
    
    -- Build complete export
    result := jsonb_build_object(
        'export_info', jsonb_build_object(
            'exported_at', NOW(),
            'user_id', user_uuid,
            'data_categories', ARRAY['personal_data', 'task_progress', 'privacy_settings'],
            'legal_basis', 'consent',
            'purpose', 'data_portability_request',
            'retention_period', '30_days'
        ),
        'user_profile', user_profile,
        'task_progress', user_tasks,
        'privacy_settings', user_settings
    );
    
    RETURN result;
END;
$$;

-- Enable RLS
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own export requests" ON public.data_export_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export requests" ON public.data_export_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);

-- Success message
SELECT 'SUCCESS: Quick GDPR setup completed - ready for testing!' as status;

