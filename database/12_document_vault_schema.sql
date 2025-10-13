-- ============================================================================
-- DOCUMENT VAULT - SECURE DOCUMENT MANAGEMENT SYSTEM
-- PostgreSQL 15+ with Supabase + Encryption Extensions
-- ============================================================================

-- Enable crypto extension for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. DOCUMENT CATEGORIES (Master Data)
-- ============================================================================

CREATE TABLE public.document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category Info
  category_code VARCHAR(50) NOT NULL UNIQUE, -- 'passport', 'id_card', 'invoice', etc.
  category_name VARCHAR(100) NOT NULL, -- 'Passport', 'ID Card', 'Invoice'
  category_group VARCHAR(50), -- 'identity', 'financial', 'legal', 'other'
  
  -- Display
  icon_name VARCHAR(50), -- For UI
  color_code VARCHAR(20), -- Hex color for tags
  
  -- Classification
  keywords TEXT[], -- Keywords for Gemini classification
  typical_fields JSONB, -- Expected fields in this doc type
  
  -- Retention Policy
  default_retention_days INTEGER, -- NULL = keep forever
  auto_delete_after_expiry BOOLEAN DEFAULT false,
  
  -- Security Level
  sensitivity_level VARCHAR(20) DEFAULT 'HIGH', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  requires_encryption BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common categories
INSERT INTO document_categories (category_code, category_name, category_group, sensitivity_level, keywords) VALUES
('passport', 'Passport', 'identity', 'CRITICAL', ARRAY['passport', 'reisepass', 'passeport']),
('id_card', 'ID Card / Residence Permit', 'identity', 'CRITICAL', ARRAY['ausweis', 'identity', 'residence permit', 'aufenthaltsbewilligung']),
('drivers_license', 'Driver''s License', 'identity', 'HIGH', ARRAY['driving', 'license', 'führerschein', 'permis']),
('work_contract', 'Work Contract', 'legal', 'HIGH', ARRAY['employment', 'contract', 'arbeitsvertrag']),
('insurance_policy', 'Insurance Policy', 'financial', 'MEDIUM', ARRAY['insurance', 'versicherung', 'assurance']),
('bank_statement', 'Bank Statement', 'financial', 'HIGH', ARRAY['bank', 'statement', 'kontoauszug']),
('invoice', 'Invoice / Bill', 'financial', 'MEDIUM', ARRAY['invoice', 'rechnung', 'facture', 'bill']),
('tax_document', 'Tax Document', 'financial', 'HIGH', ARRAY['tax', 'steuer', 'impôt']),
('lease_agreement', 'Lease Agreement', 'legal', 'MEDIUM', ARRAY['lease', 'rent', 'mietvertrag']),
('medical_record', 'Medical Record', 'medical', 'CRITICAL', ARRAY['medical', 'health', 'arzt', 'doctor']),
('certificate', 'Certificate / Diploma', 'education', 'LOW', ARRAY['certificate', 'diploma', 'zeugnis']),
('other', 'Other Document', 'other', 'MEDIUM', ARRAY[]);

-- ============================================================================
-- 2. DOCUMENT VAULT (Main Storage Table)
-- ============================================================================

CREATE TABLE public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File Info
  original_filename VARCHAR(500) NOT NULL,
  file_extension VARCHAR(10), -- 'pdf', 'jpg', 'png'
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  
  -- Storage Location (Supabase Storage)
  storage_bucket VARCHAR(100) DEFAULT 'private-documents', -- Supabase bucket name
  storage_path TEXT NOT NULL, -- Path in bucket: 'user_id/year/month/uuid.pdf'
  
  -- Encryption Info
  is_encrypted BOOLEAN DEFAULT true,
  encryption_method VARCHAR(50) DEFAULT 'AES-256-GCM', -- Client-side encryption
  encryption_key_id UUID, -- Reference to key management system (NOT the key itself!)
  
  -- Classification (Auto-detected)
  document_category_id UUID REFERENCES public.document_categories(id),
  classification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'manual'
  classification_confidence DECIMAL(5,2), -- 0.00-1.00 (Gemini confidence score)
  classified_at TIMESTAMPTZ,
  
  -- User Overrides
  user_assigned_category_id UUID REFERENCES public.document_categories(id),
  user_assigned_name VARCHAR(300), -- Custom name from user
  
  -- OCR & Extraction
  ocr_status VARCHAR(20) DEFAULT 'pending',
  ocr_text TEXT, -- Full extracted text (be careful with PII!)
  ocr_language VARCHAR(10), -- Detected language
  
  -- Extracted Metadata (Structured Data from Gemini)
  extracted_metadata JSONB,
  
  -- Tags (User-assigned or AI-suggested)
  tags TEXT[], -- ['travel', 'important', '2024']
  
  -- Expiry Tracking (for documents with expiry dates)
  has_expiry_date BOOLEAN DEFAULT false,
  expiry_date DATE,
  expiry_reminder_sent BOOLEAN DEFAULT false,
  
  -- Related Documents
  related_task_id UUID, -- Link to task if uploaded via task
  parent_document_id UUID REFERENCES public.document_vault(id), -- For document versions
  
  -- Access Control
  is_shared BOOLEAN DEFAULT false,
  shared_with_user_ids UUID[], -- Array of user IDs with access
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'deleted', 'quarantined'
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ, -- Soft delete
  permanent_delete_scheduled_at TIMESTAMPTZ, -- GDPR: Schedule for permanent deletion
  
  -- Audit Trail
  uploaded_via VARCHAR(50), -- 'web', 'mobile', 'api'
  uploaded_ip_address INET,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes < 52428800) -- Max 50MB
);

-- Indexes
CREATE INDEX idx_document_vault_user ON public.document_vault(user_id);
CREATE INDEX idx_document_vault_category ON public.document_vault(document_category_id);
CREATE INDEX idx_document_vault_status ON public.document_vault(status);
CREATE INDEX idx_document_vault_classification ON public.document_vault(classification_status);
CREATE INDEX idx_document_vault_expiry ON public.document_vault(expiry_date) WHERE has_expiry_date = true;
CREATE INDEX idx_document_vault_deleted ON public.document_vault(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_document_vault_tags ON public.document_vault USING GIN(tags);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_vault_updated_at
  BEFORE UPDATE ON public.document_vault
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. DOCUMENT ACCESS LOGS (Audit Trail - GDPR Requirement)
-- ============================================================================

CREATE TABLE public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was accessed?
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,
  
  -- Who accessed it?
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Access Details
  action_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'upload', 'delete', 'share', 'edit_metadata'
  access_method VARCHAR(50), -- 'web', 'mobile', 'api'
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT, -- Hash of device info
  
  -- Result
  was_successful BOOLEAN DEFAULT true,
  failure_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_document ON public.document_access_logs(document_id);
CREATE INDEX idx_access_logs_user ON public.document_access_logs(user_id);
CREATE INDEX idx_access_logs_created ON public.document_access_logs(created_at);
CREATE INDEX idx_access_logs_action ON public.document_access_logs(action_type);

-- ============================================================================
-- 4. DOCUMENT SHARES (Sharing with others)
-- ============================================================================

CREATE TABLE public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What is shared?
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,
  
  -- Who shared it?
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Shared with whom?
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = public link
  
  -- Share Type
  share_type VARCHAR(20) DEFAULT 'view_only', -- 'view_only', 'download_allowed'
  
  -- Link-based sharing (if not shared with specific user)
  share_token VARCHAR(100) UNIQUE, -- Random token for link-based sharing
  share_link_expires_at TIMESTAMPTZ,
  
  -- Access Control
  max_access_count INTEGER, -- NULL = unlimited
  current_access_count INTEGER DEFAULT 0,
  
  -- Password Protection
  is_password_protected BOOLEAN DEFAULT false,
  password_hash TEXT, -- Hashed password for link access
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_shares_document ON public.document_shares(document_id);
CREATE INDEX idx_document_shares_shared_by ON public.document_shares(shared_by_user_id);
CREATE INDEX idx_document_shares_shared_with ON public.document_shares(shared_with_user_id);
CREATE INDEX idx_document_shares_token ON public.document_shares(share_token);
CREATE INDEX idx_document_shares_expires ON public.document_shares(share_link_expires_at) WHERE is_active = true;

-- ============================================================================
-- 5. BULK DOWNLOAD JOBS (Zip Generation Queue)
-- ============================================================================

CREATE TABLE public.bulk_download_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who requested it?
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What to download?
  document_ids UUID[] NOT NULL, -- Array of document IDs to include
  
  -- Filters (alternative to explicit IDs)
  filter_category_ids UUID[], -- Download all docs in these categories
  filter_tags TEXT[], -- Download all docs with these tags
  filter_date_range JSONB, -- {"from": "2024-01-01", "to": "2024-12-31"}
  
  -- Job Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Progress
  total_documents INTEGER,
  processed_documents INTEGER DEFAULT 0,
  total_size_bytes BIGINT,
  
  -- Output
  zip_filename VARCHAR(300), -- Generated zip filename
  zip_storage_path TEXT, -- Path in Supabase Storage (temporary)
  download_url TEXT, -- Signed URL for download (expires in 1 hour)
  download_url_expires_at TIMESTAMPTZ,
  
  -- Processing Info
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Cleanup
  auto_delete_at TIMESTAMPTZ, -- Zip file auto-deleted after 24h
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bulk_downloads_user ON public.bulk_download_jobs(user_id);
CREATE INDEX idx_bulk_downloads_status ON public.bulk_download_jobs(status);
CREATE INDEX idx_bulk_downloads_auto_delete ON public.bulk_download_jobs(auto_delete_at) WHERE status = 'completed';

-- ============================================================================
-- 6. DOCUMENT CLASSIFICATION CACHE (AI Cost Optimization)
-- ============================================================================

CREATE TABLE public.document_classification_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache Key (hash of first page + file metadata)
  file_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 of file content
  
  -- Classification Result
  detected_category_id UUID REFERENCES public.document_categories(id),
  confidence_score DECIMAL(5,2),
  
  -- Extracted Fields
  extracted_fields JSONB,
  
  -- Usage Stats
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL, -- Cache for 90 days
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classification_cache_hash ON public.document_classification_cache(file_hash);
CREATE INDEX idx_classification_cache_expires ON public.document_classification_cache(expires_at);

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_download_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own documents
CREATE POLICY "document_vault_own_documents" ON public.document_vault
  FOR ALL
  USING (
    auth.uid() = user_id
    OR 
    -- OR documents shared with them
    id IN (
      SELECT document_id FROM public.document_shares 
      WHERE shared_with_user_id = auth.uid()
        AND is_active = true
        AND (share_link_expires_at IS NULL OR share_link_expires_at > NOW())
    )
  );

-- Users can only see their own access logs
CREATE POLICY "access_logs_own_logs" ON public.document_access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only see shares they created or that were shared with them
CREATE POLICY "document_shares_policy" ON public.document_shares
  FOR ALL
  USING (
    auth.uid() = shared_by_user_id
    OR
    auth.uid() = shared_with_user_id
  );

-- Users can only see their own download jobs
CREATE POLICY "bulk_downloads_own_jobs" ON public.bulk_download_jobs
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function: Log Document Access (call after every access)
CREATE OR REPLACE FUNCTION log_document_access(
  p_document_id UUID,
  p_user_id UUID,
  p_action_type VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_was_successful BOOLEAN DEFAULT true
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.document_access_logs (
    document_id,
    user_id,
    action_type,
    ip_address,
    was_successful
  ) VALUES (
    p_document_id,
    p_user_id,
    p_action_type,
    p_ip_address,
    p_was_successful
  );
  
  -- Update document stats
  UPDATE public.document_vault
  SET 
    last_accessed_at = NOW(),
    access_count = access_count + 1,
    download_count = CASE WHEN p_action_type = 'download' THEN download_count + 1 ELSE download_count END
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if document is expired and needs reminder
CREATE OR REPLACE FUNCTION check_expiring_documents()
RETURNS TABLE (
  document_id UUID,
  user_id UUID,
  document_name VARCHAR,
  category_name VARCHAR,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dv.id AS document_id,
    dv.user_id,
    COALESCE(dv.user_assigned_name, dv.original_filename) AS document_name,
    dc.category_name,
    dv.expiry_date,
    (dv.expiry_date - CURRENT_DATE) AS days_until_expiry
  FROM public.document_vault dv
  JOIN public.document_categories dc ON dv.document_category_id = dc.id
  WHERE dv.has_expiry_date = true
    AND dv.expiry_date IS NOT NULL
    AND dv.expiry_reminder_sent = false
    AND dv.status = 'active'
    AND (dv.expiry_date - CURRENT_DATE) <= 30 -- Expiring in next 30 days
  ORDER BY dv.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Soft Delete Document
CREATE OR REPLACE FUNCTION soft_delete_document(p_document_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.document_vault
  SET 
    status = 'deleted',
    deleted_at = NOW(),
    permanent_delete_scheduled_at = NOW() + INTERVAL '30 days' -- GDPR: Keep for 30 days before permanent deletion
  WHERE id = p_document_id
    AND user_id = p_user_id;
    
  -- Log the deletion
  PERFORM log_document_access(p_document_id, p_user_id, 'delete', NULL, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Document Stats for User
CREATE OR REPLACE FUNCTION get_user_document_stats(p_user_id UUID)
RETURNS TABLE (
  total_documents BIGINT,
  total_size_mb NUMERIC,
  by_category JSONB,
  documents_expiring_soon INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_documents,
    ROUND(SUM(file_size_bytes)::NUMERIC / 1048576, 2) AS total_size_mb,
    jsonb_object_agg(
      COALESCE(dc.category_name, 'Uncategorized'), 
      count_per_category
    ) AS by_category,
    COUNT(*) FILTER (
      WHERE has_expiry_date = true 
        AND expiry_date IS NOT NULL 
        AND (expiry_date - CURRENT_DATE) <= 30
    )::INTEGER AS documents_expiring_soon
  FROM public.document_vault dv
  LEFT JOIN public.document_categories dc ON dv.document_category_id = dc.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as count_per_category
    FROM public.document_vault
    WHERE user_id = p_user_id
      AND document_category_id = dv.document_category_id
      AND status = 'active'
  ) counts ON true
  WHERE dv.user_id = p_user_id
    AND dv.status = 'active'
  GROUP BY dv.user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. BERECHTIGUNGEN GEWÄHREN
-- ============================================================================

-- Service role hat alle Berechtigungen
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Anon user kann auf document_categories zugreifen (für UI)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.document_categories TO anon;

-- ============================================================================
-- 10. VERIFIKATION
-- ============================================================================

SELECT 'DOCUMENT VAULT SCHEMA ERSTELLT ✅' as status;
SELECT 'Tables created: ' || COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'document_%';
SELECT 'RLS enabled on document_vault: ' || CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_vault' AND rowsecurity = true) THEN 'YES ✅' ELSE 'NO ❌' END as rls_check;
SELECT 'Service role permissions: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.role_usage_grants WHERE grantee = 'service_role' AND object_name = 'public') THEN 'YES ✅' ELSE 'NO ❌' END as service_role_check;
