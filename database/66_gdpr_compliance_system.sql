-- ============================================================================
-- DSGVO/GDPR COMPLIANCE SYSTEM - DATABASE SCHEMA EXTENSIONS
-- PostgreSQL 15+ with Supabase
-- ============================================================================

-- =====
-- GDPR-SPECIFIC TABLES
-- =====

-- Data Processing Activities (DSGVO Art. 30)
CREATE TABLE IF NOT EXISTS public.data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(200) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(100) NOT NULL, -- 'consent', 'contract', 'legal_obligation', 'legitimate_interest'
    data_categories TEXT[] NOT NULL, -- ['personal_data', 'biometric_data', 'financial_data']
    data_subjects TEXT[] NOT NULL, -- ['users', 'children', 'employees']
    recipients TEXT[] NOT NULL, -- ['supabase', 'google_cloud', 'resend']
    third_country_transfers TEXT[] DEFAULT '{}', -- ['usa', 'eu']
    retention_period VARCHAR(100) NOT NULL, -- '1_year', '7_years', 'indefinite'
    security_measures TEXT[] NOT NULL, -- ['encryption', 'access_control', 'audit_logging']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Consents (DSGVO Art. 6, 7)
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- 'document_processing', 'email_marketing', 'analytics'
    consent_given BOOLEAN NOT NULL,
    consent_method VARCHAR(50) NOT NULL, -- 'explicit', 'opt_in', 'opt_out'
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_withdrawal_timestamp TIMESTAMPTZ,
    consent_version VARCHAR(20) NOT NULL, -- '1.0', '1.1'
    ip_address INET,
    user_agent TEXT,
    legal_basis VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    retention_period VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Export Requests (DSGVO Art. 20 - Right to Data Portability)
CREATE TABLE IF NOT EXISTS public.data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'full_export', -- 'full_export', 'specific_data'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'expired', 'failed'
    requested_data_types TEXT[] NOT NULL, -- ['profile', 'documents', 'tasks', 'emails']
    file_format VARCHAR(20) NOT NULL DEFAULT 'json', -- 'json', 'csv', 'zip'
    file_path TEXT, -- Path to generated export file
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

-- Account Deletion Requests (DSGVO Art. 17 - Right to Erasure)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'processing', 'completed', 'cancelled'
    verification_token VARCHAR(100) UNIQUE,
    verification_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    deletion_reason TEXT,
    deletion_type VARCHAR(50) NOT NULL DEFAULT 'full_deletion', -- 'full_deletion', 'anonymization'
    data_retention_legal_basis TEXT, -- Legal reason for keeping some data
    retention_period VARCHAR(100), -- How long to keep anonymized data
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    verification_email_sent_at TIMESTAMPTZ,
    final_notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy Settings (DSGVO Art. 21 - Right to Object)
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

-- Legal Document Versions (DSGVO Art. 12 - Transparent Information)
CREATE TABLE IF NOT EXISTS public.legal_document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(50) NOT NULL, -- 'privacy_policy', 'terms_of_service', 'cookie_policy', 'data_processing_agreement'
    version VARCHAR(20) NOT NULL,
    language VARCHAR(5) NOT NULL, -- 'de', 'en', 'fr', 'it'
    content TEXT NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    changes_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_type, version, language)
);

-- User Legal Acceptances (DSGVO Art. 7 - Conditions for Consent)
CREATE TABLE IF NOT EXISTS public.user_legal_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_version VARCHAR(20) NOT NULL,
    language VARCHAR(5) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    acceptance_method VARCHAR(50) NOT NULL, -- 'signup', 'update', 'explicit_consent'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Document Access Logs (DSGVO Art. 30 - Records of Processing)
CREATE TABLE IF NOT EXISTS public.document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.uploaded_documents(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'delete', 'share', 'classify'
    access_method VARCHAR(50) NOT NULL, -- 'web_ui', 'api', 'bulk_export', 'admin'
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    data_categories_accessed TEXT[] NOT NULL, -- ['personal_data', 'biometric_data']
    legal_basis VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====
-- HELPER FUNCTIONS
-- =====

-- Get all user data for export (DSGVO Art. 20)
CREATE OR REPLACE FUNCTION public.get_all_user_data(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    user_profile JSONB;
    user_tasks JSONB;
    user_documents JSONB;
    user_consents JSONB;
    user_settings JSONB;
    user_legal JSONB;
    user_logs JSONB;
BEGIN
    -- Get user profile data
    SELECT to_jsonb(p.*) INTO user_profile
    FROM public.user_profiles p
    WHERE p.user_id = user_uuid;
    
    -- Get user task progress
    SELECT jsonb_agg(to_jsonb(utp.*)) INTO user_tasks
    FROM public.user_task_progress utp
    WHERE utp.user_id = user_uuid;
    
    -- Get user documents (metadata only, not file content)
    -- Check if uploaded_documents table exists first
    BEGIN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ud.id,
                'filename', ud.filename,
                'file_type', ud.file_type,
                'file_size', ud.file_size,
                'classification', ud.classification,
                'tags', ud.tags,
                'uploaded_at', ud.uploaded_at,
                'last_accessed', ud.last_accessed_at
            )
        ) INTO user_documents
        FROM public.uploaded_documents ud
        WHERE ud.user_id = user_uuid;
    EXCEPTION
        WHEN undefined_table THEN
            user_documents := NULL;
    END;
    
    -- Get user consents
    SELECT jsonb_agg(to_jsonb(uc.*)) INTO user_consents
    FROM public.user_consents uc
    WHERE uc.user_id = user_uuid;
    
    -- Get privacy settings
    SELECT to_jsonb(ps.*) INTO user_settings
    FROM public.privacy_settings ps
    WHERE ps.user_id = user_uuid;
    
    -- Get legal acceptances
    SELECT jsonb_agg(to_jsonb(ula.*)) INTO user_legal
    FROM public.user_legal_acceptances ula
    WHERE ula.user_id = user_uuid;
    
    -- Get access logs (last 100 entries)
    SELECT jsonb_agg(to_jsonb(dal.*)) INTO user_logs
    FROM (
        SELECT * FROM public.document_access_logs dal
        WHERE dal.user_id = user_uuid
        ORDER BY dal.created_at DESC
        LIMIT 100
    ) dal;
    
    -- Build complete export
    result := jsonb_build_object(
        'export_info', jsonb_build_object(
            'exported_at', NOW(),
            'user_id', user_uuid,
            'data_categories', ARRAY['personal_data', 'task_progress', 'document_metadata', 'consents', 'privacy_settings', 'legal_acceptances', 'access_logs'],
            'legal_basis', 'consent',
            'purpose', 'data_portability_request',
            'retention_period', '30_days'
        ),
        'user_profile', user_profile,
        'task_progress', user_tasks,
        'documents', user_documents,
        'consents', user_consents,
        'privacy_settings', user_settings,
        'legal_acceptances', user_legal,
        'access_logs', user_logs
    );
    
    RETURN result;
END;
$$;

-- Soft delete user data (DSGVO Art. 17 - Right to Erasure)
CREATE OR REPLACE FUNCTION public.soft_delete_user_data(user_uuid UUID, deletion_type VARCHAR(50) DEFAULT 'anonymization')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    deleted_count INTEGER := 0;
BEGIN
    -- Log the deletion request
    INSERT INTO public.account_deletion_requests (
        user_id, status, deletion_type, processing_started_at
    ) VALUES (
        user_uuid, 'processing', deletion_type, NOW()
    );
    
    IF deletion_type = 'full_deletion' THEN
        -- Full deletion: Remove all personal data
        -- Note: This will cascade delete due to foreign key constraints
        
        -- Delete user documents from storage (handled by application)
        -- Try to delete from uploaded_documents if table exists
        BEGIN
            DELETE FROM public.uploaded_documents WHERE user_id = user_uuid;
        EXCEPTION
            WHEN undefined_table THEN
                -- Table doesn't exist, skip
                NULL;
        END;
        
        -- Delete user profile
        DELETE FROM public.user_profiles WHERE user_id = user_uuid;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Delete task progress
        DELETE FROM public.user_task_progress WHERE user_id = user_uuid;
        
        -- Delete consents
        DELETE FROM public.user_consents WHERE user_id = user_uuid;
        
        -- Delete privacy settings
        DELETE FROM public.privacy_settings WHERE user_id = user_uuid;
        
        -- Delete legal acceptances
        DELETE FROM public.user_legal_acceptances WHERE user_id = user_uuid;
        
        -- Delete access logs
        DELETE FROM public.document_access_logs WHERE user_id = user_uuid;
        
        -- Delete export requests
        DELETE FROM public.data_export_requests WHERE user_id = user_uuid;
        
        -- Delete deletion request
        DELETE FROM public.account_deletion_requests WHERE user_id = user_uuid;
        
    ELSIF deletion_type = 'anonymization' THEN
        -- Anonymization: Keep data but remove personal identifiers
        
        -- Anonymize user profile
        UPDATE public.user_profiles SET
            first_name = 'ANONYMIZED',
            last_name = 'ANONYMIZED',
            email = 'anonymized_' || user_uuid || '@deleted.local',
            phone = NULL,
            home_address = NULL,
            work_address = NULL,
            profile_image_url = NULL,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Anonymize access logs
        UPDATE public.document_access_logs SET
            ip_address = NULL,
            user_agent = 'ANONYMIZED',
            session_id = NULL
        WHERE user_id = user_uuid;
        
        -- Keep other data for legal/statistical purposes but mark as anonymized
        UPDATE public.user_consents SET
            ip_address = NULL,
            user_agent = 'ANONYMIZED'
        WHERE user_id = user_uuid;
        
        UPDATE public.user_legal_acceptances SET
            ip_address = NULL,
            user_agent = 'ANONYMIZED'
        WHERE user_id = user_uuid;
    END IF;
    
    -- Update deletion request status
    UPDATE public.account_deletion_requests SET
        status = 'completed',
        processing_completed_at = NOW()
    WHERE user_id = user_uuid;
    
    result := jsonb_build_object(
        'success', true,
        'deletion_type', deletion_type,
        'deleted_records', deleted_count,
        'processed_at', NOW(),
        'user_id', user_uuid
    );
    
    RETURN result;
END;
$$;

-- =====
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====

-- Enable RLS on all GDPR tables
ALTER TABLE public.data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- User consents policies
CREATE POLICY "Users can view own consents" ON public.user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own consents" ON public.user_consents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" ON public.user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Data export requests policies
CREATE POLICY "Users can view own export requests" ON public.data_export_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export requests" ON public.data_export_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Account deletion requests policies
CREATE POLICY "Users can view own deletion requests" ON public.account_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests" ON public.account_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deletion requests" ON public.account_deletion_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Privacy settings policies
CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User legal acceptances policies
CREATE POLICY "Users can view own legal acceptances" ON public.user_legal_acceptances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own legal acceptances" ON public.user_legal_acceptances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Document access logs policies
CREATE POLICY "Users can view own access logs" ON public.document_access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Legal document versions (public read)
CREATE POLICY "Anyone can view active legal documents" ON public.legal_document_versions
    FOR SELECT USING (is_active = true);

-- Data processing activities (public read for transparency)
CREATE POLICY "Anyone can view data processing activities" ON public.data_processing_activities
    FOR SELECT USING (true);

-- =====
-- INDEXES FOR PERFORMANCE
-- =====

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_timestamp ON public.user_consents(consent_timestamp);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON public.data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_expires ON public.data_export_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_token ON public.account_deletion_requests(verification_token);

CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_id ON public.user_legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_document ON public.user_legal_acceptances(document_type, document_version);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON public.document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON public.document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_created_at ON public.document_access_logs(created_at);

-- =====
-- SEED DATA
-- =====

-- Insert data processing activities
INSERT INTO public.data_processing_activities (
    activity_name, purpose, legal_basis, data_categories, data_subjects, recipients,
    third_country_transfers, retention_period, security_measures
) VALUES 
(
    'User Profile Management',
    'Providing personalized onboarding tasks and services',
    'consent',
    ARRAY['personal_data', 'contact_data', 'demographic_data'],
    ARRAY['users'],
    ARRAY['supabase', 'vercel'],
    ARRAY['usa'],
    '7_years',
    ARRAY['encryption', 'access_control', 'audit_logging']
),
(
    'Document Processing',
    'OCR and AI-powered document classification and form filling',
    'consent',
    ARRAY['personal_data', 'biometric_data', 'financial_data'],
    ARRAY['users'],
    ARRAY['supabase', 'google_cloud', 'gemini'],
    ARRAY['usa'],
    '1_year',
    ARRAY['encryption', 'access_control', 'audit_logging', 'client_side_encryption']
),
(
    'Email Communications',
    'Sending task reminders and important notifications',
    'legitimate_interest',
    ARRAY['personal_data', 'contact_data'],
    ARRAY['users'],
    ARRAY['supabase', 'resend'],
    ARRAY['usa'],
    '2_years',
    ARRAY['encryption', 'access_control']
),
(
    'Analytics and Usage Tracking',
    'Improving service quality and user experience',
    'consent',
    ARRAY['usage_data', 'technical_data'],
    ARRAY['users'],
    ARRAY['vercel', 'supabase'],
    ARRAY['usa'],
    '2_years',
    ARRAY['anonymization', 'access_control']
)
ON CONFLICT DO NOTHING;

-- Insert default legal document versions
INSERT INTO public.legal_document_versions (
    document_type, version, language, content, effective_date, changes_summary
) VALUES 
(
    'privacy_policy',
    '1.0',
    'en',
    'Privacy Policy content will be inserted here...',
    CURRENT_DATE,
    'Initial version'
),
(
    'terms_of_service',
    '1.0',
    'en',
    'Terms of Service content will be inserted here...',
    CURRENT_DATE,
    'Initial version'
),
(
    'cookie_policy',
    '1.0',
    'en',
    'Cookie Policy content will be inserted here...',
    CURRENT_DATE,
    'Initial version'
)
ON CONFLICT (document_type, version, language) DO NOTHING;

-- Success message
SELECT 'SUCCESS: DSGVO/GDPR Compliance System implemented successfully!' as status;
