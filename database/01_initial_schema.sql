-- Village Database Schema - MVP Version
-- Based on the comprehensive schema from your documentation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    postal_code TEXT,
    municipality TEXT,
    canton TEXT,
    country_of_origin TEXT,
    has_children BOOLEAN DEFAULT FALSE,
    family_status TEXT CHECK (family_status IN ('single', 'married', 'divorced', 'widowed', 'other')),
    arrival_date DATE,
    work_permit_type TEXT,
    language_preference TEXT DEFAULT 'de',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Members Table
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'other')),
    birth_date DATE,
    nationality TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Categories
CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Vault - Main storage
CREATE TABLE document_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES document_categories(id),
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    encrypted_data BYTEA NOT NULL,
    encryption_key_hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Access Logs
CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES document_vault(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('view', 'download', 'delete', 'share')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules Table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL CHECK (task_type IN ('form', 'document', 'appointment', 'information')),
    priority INTEGER DEFAULT 1,
    estimated_duration INTEGER, -- in minutes
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Variants for personalization
CREATE TABLE task_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    target_segments JSONB DEFAULT '[]', -- Array of segment conditions
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Task Progress
CREATE TABLE user_task_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

-- Swiss Municipalities (for PLZ autocomplete)
CREATE TABLE municipalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    postal_code TEXT NOT NULL,
    municipality_name TEXT NOT NULL,
    canton_code TEXT NOT NULL,
    canton_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_document_vault_user_id ON document_vault(user_id);
CREATE INDEX idx_document_vault_category_id ON document_vault(category_id);
CREATE INDEX idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX idx_user_task_progress_user_id ON user_task_progress(user_id);
CREATE INDEX idx_municipalities_postal_code ON municipalities(postal_code);
CREATE INDEX idx_municipalities_municipality_name ON municipalities(municipality_name);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for family_members
CREATE POLICY "Users can manage own family members" ON family_members
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for document_vault
CREATE POLICY "Users can manage own documents" ON document_vault
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for document_access_logs
CREATE POLICY "Users can view own document access logs" ON document_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert document access logs" ON document_access_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_task_progress
CREATE POLICY "Users can manage own task progress" ON user_task_progress
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for email_logs
CREATE POLICY "Users can view own email logs" ON email_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Insert default document categories
INSERT INTO document_categories (name, description, icon) VALUES
('passport', 'Passport and ID Documents', '🛂'),
('work_permit', 'Work Permits and Visas', '💼'),
('driving_license', 'Driving License', '🚗'),
('insurance', 'Insurance Documents', '🛡️'),
('banking', 'Banking and Financial Documents', '🏦'),
('housing', 'Housing and Rental Documents', '🏠'),
('health', 'Health and Medical Documents', '🏥'),
('education', 'Education and Certificates', '🎓'),
('other', 'Other Documents', '📄');

-- Insert default modules
INSERT INTO modules (name, description, icon, order_index) VALUES
('arrival', 'Arrival in Switzerland', '✈️', 1),
('housing', 'Finding Housing', '🏠', 2),
('work', 'Work and Employment', '💼', 3),
('health', 'Health and Insurance', '🏥', 4),
('family', 'Family and Children', '👨‍👩‍👧‍👦', 5),
('transport', 'Transportation', '🚗', 6),
('finance', 'Banking and Finance', '💰', 7),
('integration', 'Integration and Language', '🗣️', 8);

-- Insert sample tasks for arrival module
INSERT INTO tasks (module_id, title, description, task_type, priority, estimated_duration) VALUES
((SELECT id FROM modules WHERE name = 'arrival'), 'Register at Municipality', 'Register your arrival at the local municipality within 14 days', 'appointment', 1, 30),
((SELECT id FROM modules WHERE name = 'arrival'), 'Apply for Residence Permit', 'Apply for your residence permit at the cantonal migration office', 'appointment', 1, 60),
((SELECT id FROM modules WHERE name = 'arrival'), 'Get Swiss Phone Number', 'Get a Swiss phone number for local communication', 'information', 2, 15);

-- Create helper functions
CREATE OR REPLACE FUNCTION get_user_segments(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
    segments TEXT[] := '{}';
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM user_profiles WHERE user_id = user_uuid;
    
    IF profile_record.country_of_origin IS NOT NULL THEN
        IF profile_record.country_of_origin IN ('DE', 'AT', 'FR', 'IT', 'LI') THEN
            segments := array_append(segments, 'eu_citizen');
        ELSE
            segments := array_append(segments, 'non_eu_citizen');
        END IF;
    END IF;
    
    IF profile_record.has_children = TRUE THEN
        segments := array_append(segments, 'has_children');
    ELSE
        segments := array_append(segments, 'no_children');
    END IF;
    
    RETURN segments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access(
    doc_id UUID,
    user_uuid UUID,
    action_type TEXT,
    ip_addr INET DEFAULT NULL,
    user_agent_text TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO document_access_logs (document_id, user_id, action, ip_address, user_agent)
    VALUES (doc_id, user_uuid, action_type, ip_addr, user_agent_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized tasks
CREATE OR REPLACE FUNCTION get_personalized_tasks(user_uuid UUID)
RETURNS TABLE (
    task_id UUID,
    title TEXT,
    description TEXT,
    task_type TEXT,
    priority INTEGER,
    estimated_duration INTEGER,
    status TEXT,
    module_name TEXT
) AS $$
DECLARE
    user_segments TEXT[];
BEGIN
    user_segments := get_user_segments(user_uuid);
    
    RETURN QUERY
    SELECT 
        t.id,
        COALESCE(tv.title, t.title) as title,
        COALESCE(tv.description, t.description) as description,
        t.task_type,
        t.priority,
        t.estimated_duration,
        COALESCE(utp.status, 'not_started') as status,
        m.name as module_name
    FROM tasks t
    JOIN modules m ON t.module_id = m.id
    LEFT JOIN task_variants tv ON t.id = tv.task_id 
        AND (tv.target_segments @> user_segments OR tv.is_default = TRUE)
    LEFT JOIN user_task_progress utp ON t.id = utp.task_id AND utp.user_id = user_uuid
    WHERE t.is_active = TRUE AND m.is_active = TRUE
    ORDER BY t.priority ASC, t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
