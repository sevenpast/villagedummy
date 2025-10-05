-- ============================================
-- VILLAGE DATABASE SCHEMA
-- Module 1: Welcome to Switzerland
-- ============================================

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- Haupttabelle für User-Profile
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Supabase Auth Integration
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  phone VARCHAR(50),
  
  -- Location
  country_of_origin VARCHAR(100),
  current_address TEXT,
  municipality VARCHAR(100),
  canton VARCHAR(50),
  postal_code VARCHAR(10),
  
  -- Employment
  employer VARCHAR(200),
  occupation VARCHAR(200),
  work_address TEXT,
  
  -- Family Status
  has_kids BOOLEAN DEFAULT false,
  num_children INTEGER DEFAULT 0,
  marital_status VARCHAR(50), -- 'single', 'married', 'divorced', 'widowed'
  
  -- Switzerland-specific
  months_in_switzerland INTEGER DEFAULT 0,
  arrival_date DATE,
  residence_permit_type VARCHAR(10), -- 'L', 'B', 'C', 'G', null
  
  -- User Preferences
  preferred_language VARCHAR(5) DEFAULT 'en', -- 'en', 'de', 'fr', 'it'
  timezone VARCHAR(50) DEFAULT 'Europe/Zurich',
  
  -- Account Status
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- User Segments (für targeting)
CREATE TABLE user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  segment_name VARCHAR(100) NOT NULL, -- 'EU/EFTA', 'visa-required', 'with_kids', 'newcomer'
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. MODULES & TASKS
-- ============================================

-- Module (z.B. "Welcome to Switzerland")
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks (die 18 Hauptaufgaben)
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  
  task_number INTEGER NOT NULL, -- 1-18
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100), -- 'legal', 'housing', 'health', 'family', 'admin'
  
  -- Urgency
  is_urgent BOOLEAN DEFAULT false,
  deadline_days INTEGER, -- z.B. 14 für Gemeinde Registration
  
  -- Display
  priority INTEGER DEFAULT 0,
  icon_name VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (module_id, task_number)
);

-- Task Variants (personalisierte Versionen pro User-Segment)
CREATE TABLE task_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Targeting: Für welche User ist diese Variante?
  target_audience JSONB NOT NULL, -- ["EU/EFTA"] oder ["Non-EU/EFTA", "visa-required"]
  
  -- Content
  intro TEXT NOT NULL,
  info_box TEXT NOT NULL,
  
  -- Interactive Elements
  initial_question TEXT,
  answer_options JSONB, -- ["Yes", "Not yet", "Update profile"]
  
  -- Actions basierend auf Antworten
  actions JSONB, -- { "Yes": { "action": "mark_done" }, "Not yet": { ... } }
  
  -- UI Configuration
  ui_config JSONB, -- { "has_form": true, "has_reminder": true, "has_document_upload": true }
  
  -- Display
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Task Dependencies (Task X benötigt Task Y)
CREATE TABLE task_dependencies (
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'required', -- 'required', 'recommended', 'conditional'
  PRIMARY KEY (task_id, depends_on_task_id)
);

-- ============================================
-- 3. USER TASK STATUS & PROGRESS
-- ============================================

CREATE TABLE user_task_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'done', 'skipped', 'blocked'
  
  -- Timestamps
  shown_at TIMESTAMP, -- Wann zum ersten Mal angezeigt
  started_at TIMESTAMP, -- Wann User interagiert hat
  completed_at TIMESTAMP, -- Wann erledigt
  
  -- User-Eingaben
  form_data JSONB, -- Gespeicherte Form-Antworten
  user_answer VARCHAR(100), -- "Yes", "Not yet", etc.
  
  -- Reminders
  reminder_set_for TIMESTAMP,
  reminder_sent_at TIMESTAMP,
  reminder_days INTEGER, -- 3, 7, oder 14
  
  -- Metadata
  notes TEXT, -- User kann eigene Notizen machen
  last_interaction_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (user_id, task_id)
);

-- ============================================
-- 4. DOCUMENTS & FILE MANAGEMENT
-- ============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- File Info
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER, -- in bytes
  file_type VARCHAR(50), -- 'pdf', 'jpg', 'png', 'docx'
  storage_path TEXT NOT NULL, -- Supabase Storage path
  
  -- Document Type
  document_type VARCHAR(100), -- 'passport', 'residence_permit', 'employment_contract', 'rental_contract'
  
  -- Related Task
  task_id INTEGER REFERENCES tasks(id),
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- für zeitlich begrenzte Dokumente
);

-- Document Bundles (für Housing Application Bundle)
CREATE TABLE document_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  bundle_name VARCHAR(200) NOT NULL, -- 'Housing Application Bundle'
  bundle_type VARCHAR(100), -- 'housing_application', 'school_registration'
  
  -- Documents in Bundle
  document_ids JSONB, -- [uuid1, uuid2, uuid3]
  
  -- Auto-generated Content
  generated_letter TEXT, -- AI-generierter Motivational Letter
  generated_letter_language VARCHAR(5),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. AI OPERATIONS & TRACKING
-- ============================================

CREATE TABLE ai_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id),
  
  -- Operation Details
  operation_type VARCHAR(100) NOT NULL, -- 'scrape_and_summarize', 'generate_email', 'generate_property_suggestions'
  
  -- Input/Output
  input_data JSONB,
  output_data JSONB,
  
  -- Token Usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Cost
  cost_usd DECIMAL(10, 6),
  
  -- Model Used
  model_name VARCHAR(50), -- 'gpt-4o', 'gpt-4o-mini'
  
  -- Status
  status VARCHAR(50), -- 'success', 'error', 'cached'
  error_message TEXT,
  
  -- Performance
  duration_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Prompts (versioniertes Prompt Management)
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  operation_type VARCHAR(100) UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,
  
  -- Versioning
  version VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Response Cache
CREATE TABLE ai_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  operation_type VARCHAR(100),
  
  -- Cached Data
  response_data JSONB NOT NULL,
  
  -- Expiration
  expires_at TIMESTAMP NOT NULL,
  
  -- Stats
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. HOUSING FEATURE (Task 2)
-- ============================================

CREATE TABLE property_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Search Criteria
  search_type VARCHAR(50), -- 'temporary', 'permanent'
  budget_min INTEGER,
  budget_max INTEGER,
  num_rooms DECIMAL(3,1), -- 2.5, 3.5, etc.
  location VARCHAR(100),
  location_radius_km INTEGER,
  
  -- Requirements
  wheelchair_friendly BOOLEAN DEFAULT false,
  parking_required BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  
  -- Availability
  available_from DATE,
  
  -- Search Results (cached)
  ai_suggestions JSONB, -- 3 AI-generated property suggestions
  suggestions_generated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE property_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Property Info
  property_url TEXT,
  property_address TEXT,
  monthly_rent INTEGER,
  
  -- Application
  application_bundle_id UUID REFERENCES document_bundles(id),
  motivational_letter TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'accepted', 'rejected'
  submitted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. MUNICIPALITY DATA (Task 3, 4, 5)
-- ============================================

CREATE TABLE municipality_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  municipality VARCHAR(100) NOT NULL,
  canton VARCHAR(50) NOT NULL,
  
  -- Contact Info
  official_website TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Office Hours
  office_hours JSONB, -- { "Monday": "08:00-12:00, 13:30-17:00", ... }
  
  -- Requirements (AI-scraped & cached)
  gemeinde_registration_requirements JSONB,
  school_registration_requirements JSONB,
  
  -- Fees
  registration_fee_chf INTEGER,
  permit_card_fee_chf INTEGER,
  
  -- Last Updated (Cache invalidation)
  data_last_fetched_at TIMESTAMP,
  data_source TEXT, -- 'ai_scrape', 'manual_entry', 'api'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (municipality, canton)
);

-- ============================================
-- 8. REMINDERS & NOTIFICATIONS
-- ============================================

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id),
  
  -- Reminder Details
  reminder_type VARCHAR(50), -- 'task_deadline', 'custom'
  message TEXT NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  
  -- Channels
  send_via_email BOOLEAN DEFAULT true,
  send_via_push BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50), -- 'task_update', 'reminder', 'system'
  
  -- Link
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. EXTERNAL INTEGRATIONS
-- ============================================

CREATE TABLE external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  integration_name VARCHAR(100) UNIQUE NOT NULL, -- 'immoscout24', 'homegate', 'meetup_ch'
  integration_type VARCHAR(50), -- 'api', 'web_scrape'
  
  -- Config
  base_url TEXT,
  api_key_encrypted TEXT,
  config JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_successful_call TIMESTAMP,
  last_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name VARCHAR(100),
  
  -- Request
  request_type VARCHAR(50), -- 'property_search', 'event_fetch'
  request_params JSONB,
  
  -- Response
  response_status INTEGER,
  response_data JSONB,
  
  -- Performance
  duration_ms INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. ANALYTICS & TRACKING
-- ============================================

CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event
  event_type VARCHAR(100) NOT NULL, -- 'task_started', 'task_completed', 'document_uploaded'
  event_category VARCHAR(50), -- 'task', 'document', 'ai'
  
  -- Context
  task_id INTEGER REFERENCES tasks(id),
  metadata JSONB,
  
  -- Device
  user_agent TEXT,
  ip_address INET,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDICES (für Performance)
-- ============================================

-- Users
CREATE INDEX idx_users_municipality ON users(municipality);
CREATE INDEX idx_users_canton ON users(canton);
CREATE INDEX idx_users_country ON users(country_of_origin);
CREATE INDEX idx_users_verified ON users(is_verified);

-- User Segments
CREATE INDEX idx_user_segments_user ON user_segments(user_id);
CREATE INDEX idx_user_segments_name ON user_segments(segment_name);

-- Tasks
CREATE INDEX idx_tasks_module ON tasks(module_id);
CREATE INDEX idx_tasks_number ON tasks(task_number);
CREATE INDEX idx_tasks_category ON tasks(category);

-- Task Variants
CREATE INDEX idx_task_variants_task ON task_variants(task_id);
CREATE INDEX idx_task_variants_audience ON task_variants USING GIN (target_audience);

-- User Task Status
CREATE INDEX idx_user_task_status_user ON user_task_status(user_id);
CREATE INDEX idx_user_task_status_task ON user_task_status(task_id);
CREATE INDEX idx_user_task_status_status ON user_task_status(status);
CREATE INDEX idx_user_task_status_reminder ON user_task_status(reminder_set_for) 
  WHERE reminder_set_for IS NOT NULL;

-- Documents
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_task ON documents(task_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- AI Operations
CREATE INDEX idx_ai_operations_user ON ai_operations(user_id);
CREATE INDEX idx_ai_operations_type ON ai_operations(operation_type);
CREATE INDEX idx_ai_operations_created ON ai_operations(created_at);
CREATE INDEX idx_ai_operations_status ON ai_operations(status);

-- AI Cache
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX idx_ai_cache_operation ON ai_cache(operation_type);

-- Reminders
CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_for) 
  WHERE status = 'pending';

-- User Events
CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_type ON user_events(event_type);
CREATE INDEX idx_user_events_created ON user_events(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Users: Can only see/update own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- User Task Status: Can only see/modify own tasks
CREATE POLICY "Users can view own task status" ON user_task_status
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own task status" ON user_task_status
  FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Documents: Can only see/upload own documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can upload own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- AI Operations: Can only see own AI operations
CREATE POLICY "Users can view own AI operations" ON ai_operations
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Public Tables (readable by all authenticated users)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipality_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tasks" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view task variants" ON task_variants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view modules" ON modules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view municipality data" ON municipality_data
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_variants_updated_at
  BEFORE UPDATE ON task_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_task_status_updated_at
  BEFORE UPDATE ON user_task_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-assign user segments based on profile
CREATE OR REPLACE FUNCTION assign_user_segments()
RETURNS TRIGGER AS $$
BEGIN
  -- Clear existing segments
  DELETE FROM user_segments WHERE user_id = NEW.id;
  
  -- Assign based on country_of_origin
  IF NEW.country_of_origin IN ('Germany', 'France', 'Italy', 'Austria', 'Netherlands') THEN
    INSERT INTO user_segments (user_id, segment_name) VALUES (NEW.id, 'EU/EFTA');
  ELSIF NEW.country_of_origin IS NOT NULL THEN
    INSERT INTO user_segments (user_id, segment_name) VALUES (NEW.id, 'Non-EU/EFTA');
  END IF;
  
  -- Assign based on family status
  IF NEW.has_kids THEN
    INSERT INTO user_segments (user_id, segment_name) VALUES (NEW.id, 'with_kids');
  END IF;
  
  -- Assign based on time in Switzerland
  IF NEW.months_in_switzerland < 6 THEN
    INSERT INTO user_segments (user_id, segment_name) VALUES (NEW.id, 'newcomer');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_user_segments
  AFTER INSERT OR UPDATE OF country_of_origin, has_kids, months_in_switzerland ON users
  FOR EACH ROW EXECUTE FUNCTION assign_user_segments();

-- ============================================
-- COMMENTS (Dokumentation)
-- ============================================

COMMENT ON TABLE users IS 'Main user profiles with personal and Switzerland-specific information';
COMMENT ON TABLE tasks IS 'The 18 main tasks from Module 1: Welcome to Switzerland';
COMMENT ON TABLE task_variants IS 'Personalized content versions per user segment (EU/Non-EU, with kids, etc.)';
COMMENT ON TABLE user_task_status IS 'Tracks user progress through tasks';
COMMENT ON TABLE ai_operations IS 'Logs all AI/LLM operations for cost tracking and debugging';
COMMENT ON TABLE municipality_data IS 'Cached municipality-specific information scraped by AI';
COMMENT ON TABLE documents IS 'User-uploaded documents (passport, permits, contracts, etc.)';
COMMENT ON TABLE document_bundles IS 'Collections of documents for applications (housing, school, etc.)';
