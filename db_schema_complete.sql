-- ============================================
-- VILLAGE DATABASE SCHEMA - COMPLETE SETUP
-- Deploy this file first to Supabase
-- ============================================

-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Wait ~30 seconds for completion

-- ============================================
-- PART 1: TABLES
-- ============================================

-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  phone VARCHAR(50),
  country_of_origin VARCHAR(100),
  current_address TEXT,
  municipality VARCHAR(100),
  canton VARCHAR(50),
  postal_code VARCHAR(10),
  employer VARCHAR(200),
  occupation VARCHAR(200),
  work_address TEXT,
  has_kids BOOLEAN DEFAULT false,
  num_children INTEGER DEFAULT 0,
  marital_status VARCHAR(50),
  months_in_switzerland INTEGER DEFAULT 0,
  arrival_date DATE,
  residence_permit_type VARCHAR(10),
  preferred_language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Europe/Zurich',
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE TABLE user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  segment_name VARCHAR(100) NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- Modules & Tasks
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  is_urgent BOOLEAN DEFAULT false,
  deadline_days INTEGER,
  priority INTEGER DEFAULT 0,
  icon_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (module_id, task_number)
);

CREATE TABLE task_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  target_audience JSONB NOT NULL,
  intro TEXT NOT NULL,
  info_box TEXT NOT NULL,
  initial_question TEXT,
  answer_options JSONB,
  actions JSONB,
  ui_config JSONB,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_dependencies (
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'required',
  PRIMARY KEY (task_id, depends_on_task_id)
);

-- User Progress
CREATE TABLE user_task_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started',
  shown_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  form_data JSONB,
  user_answer VARCHAR(100),
  reminder_set_for TIMESTAMP,
  reminder_sent_at TIMESTAMP,
  reminder_days INTEGER,
  notes TEXT,
  last_interaction_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, task_id)
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  storage_path TEXT NOT NULL,
  document_type VARCHAR(100),
  task_id INTEGER REFERENCES tasks(id),
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE document_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bundle_name VARCHAR(200) NOT NULL,
  bundle_type VARCHAR(100),
  document_ids JSONB,
  generated_letter TEXT,
  generated_letter_language VARCHAR(5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Operations
CREATE TABLE ai_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id),
  operation_type VARCHAR(100) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  model_name VARCHAR(50),
  status VARCHAR(50),
  error_message TEXT,
  duration_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(100) UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,
  version VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  operation_type VARCHAR(100),
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Municipality Data
CREATE TABLE municipality_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality VARCHAR(100) NOT NULL,
  canton VARCHAR(50) NOT NULL,
  official_website TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  office_hours JSONB,
  gemeinde_registration_requirements JSONB,
  school_registration_requirements JSONB,
  registration_fee_chf INTEGER,
  permit_card_fee_chf INTEGER,
  data_last_fetched_at TIMESTAMP,
  data_source TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (municipality, canton)
);

-- Housing Feature
CREATE TABLE property_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  search_type VARCHAR(50),
  budget_min INTEGER,
  budget_max INTEGER,
  num_rooms DECIMAL(3,1),
  location VARCHAR(100),
  location_radius_km INTEGER,
  wheelchair_friendly BOOLEAN DEFAULT false,
  parking_required BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  available_from DATE,
  ai_suggestions JSONB,
  suggestions_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE property_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_url TEXT,
  property_address TEXT,
  monthly_rent INTEGER,
  application_bundle_id UUID REFERENCES document_bundles(id),
  motivational_letter TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reminders & Notifications
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id),
  reminder_type VARCHAR(50),
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  send_via_email BOOLEAN DEFAULT true,
  send_via_push BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50),
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50),
  task_id INTEGER REFERENCES tasks(id),
  metadata JSONB,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- External Integrations
CREATE TABLE external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name VARCHAR(100) UNIQUE NOT NULL,
  integration_type VARCHAR(50),
  base_url TEXT,
  api_key_encrypted TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT true,
  last_successful_call TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name VARCHAR(100),
  request_type VARCHAR(50),
  request_params JSONB,
  response_status INTEGER,
  response_data JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PART 2: INDICES
-- ============================================

CREATE INDEX idx_users_municipality ON users(municipality);
CREATE INDEX idx_users_canton ON users(canton);
CREATE INDEX idx_users_country ON users(country_of_origin);
CREATE INDEX idx_user_segments_user ON user_segments(user_id);
CREATE INDEX idx_tasks_module ON tasks(module_id);
CREATE INDEX idx_task_variants_task ON task_variants(task_id);
CREATE INDEX idx_task_variants_audience ON task_variants USING GIN (target_audience);
CREATE INDEX idx_user_task_status_user ON user_task_status(user_id);
CREATE INDEX idx_user_task_status_task ON user_task_status(task_id);
CREATE INDEX idx_user_task_status_reminder ON user_task_status(reminder_set_for) WHERE reminder_set_for IS NOT NULL;
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_ai_operations_user ON ai_operations(user_id);
CREATE INDEX idx_ai_operations_type ON ai_operations(operation_type);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_user_events_user ON user_events(user_id);

-- ============================================
-- PART 3: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own task status" ON user_task_status
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own task status" ON user_task_status
  FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Public tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tasks" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view task variants" ON task_variants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view modules" ON modules
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- PART 4: TRIGGERS & FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION assign_user_segments()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_segments WHERE user_id = NEW.id;
  
  IF NEW.country_of_origin IN ('Germany', 'France', 'Italy', 'Austria') THEN
    INSERT INTO user_segments (user_id, segment_name) VALUES (NEW.id, 'EU/EFTA');
  ELSIF NEW.country_of_origin IS NOT NULL THEN
    INSERT INTO user_segments (user_id, segment_name) VALUES (NEW.id, 'Non-EU/EFTA');
  END IF;
  
  IF NEW.has_kids THEN
    INSERT INTO user_segments (user_id, segment_name) VALUES (NEW.id, 'with_kids');
  END IF;
  
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
-- SETUP COMPLETE
-- Next: Run the seed data file (02-seed-data.sql)
-- ============================================
