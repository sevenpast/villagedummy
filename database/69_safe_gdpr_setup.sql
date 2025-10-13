-- ============================================================================
-- SAFE GDPR SETUP - IDEMPOTENT VERSION (NO ERRORS IF EXISTS)
-- PostgreSQL 15+ with Supabase
-- ============================================================================

-- Create tables only if they don't exist
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

-- Enable RLS safely
DO $$ 
BEGIN
    ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create policies safely (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'data_export_requests' 
        AND policyname = 'Users can view own export requests'
    ) THEN
        CREATE POLICY "Users can view own export requests" ON public.data_export_requests
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'data_export_requests' 
        AND policyname = 'Users can create own export requests'
    ) THEN
        CREATE POLICY "Users can create own export requests" ON public.data_export_requests
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'privacy_settings' 
        AND policyname = 'Users can view own privacy settings'
    ) THEN
        CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'privacy_settings' 
        AND policyname = 'Users can update own privacy settings'
    ) THEN
        CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'privacy_settings' 
        AND policyname = 'Users can insert own privacy settings'
    ) THEN
        CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);

-- Success message
SELECT 'SUCCESS: Safe GDPR setup completed - ready for testing!' as status;

