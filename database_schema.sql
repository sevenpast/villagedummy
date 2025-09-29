-- ExpatVillage Database Schema
-- This schema stores the three critical user profile information pieces

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
-- Stores the three critical pieces of information for task personalization
-- ASSUMPTION: User already has an account (via Supabase Auth or other auth system)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL, -- Links to auth.users (REQUIRED - user must have account)
  
  -- 1. COUNTRY OF ORIGIN (Most Critical Information)
  country_of_origin VARCHAR(100) NOT NULL,
  is_eu_efta_citizen BOOLEAN NOT NULL DEFAULT FALSE,
  visa_status VARCHAR(50), -- 'visa_required', 'visa_exempt', 'not_applicable'
  
  -- 2. FAMILY STATUS (Children Information)
  has_children BOOLEAN NOT NULL DEFAULT FALSE,
  children_count INTEGER DEFAULT 0,
  school_age_children_count INTEGER DEFAULT 0, -- Children aged 4-16
  children_details JSONB DEFAULT '[]', -- Array of child objects with age, name, etc.
  
  -- 3. DESTINATION IN SWITZERLAND (Target Location)
  target_canton VARCHAR(50), -- e.g., 'Zurich', 'Bern', 'Geneva'
  target_municipality VARCHAR(100), -- e.g., 'Zurich', 'Winterthur'
  target_postal_code VARCHAR(10),
  target_address TEXT, -- Full address if available
  
  -- Additional profile information
  profile_completeness JSONB DEFAULT '{}', -- Tracks which sections are complete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_country ON user_profiles(country_of_origin);
CREATE INDEX idx_user_profiles_eu_efta ON user_profiles(is_eu_efta_citizen);
CREATE INDEX idx_user_profiles_children ON user_profiles(has_children);
CREATE INDEX idx_user_profiles_municipality ON user_profiles(target_municipality);

-- Tasks Table (from existing schema)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(50) UNIQUE NOT NULL,
  basic_info JSONB NOT NULL,
  targeting_info JSONB DEFAULT '{}',
  lifecycle_info JSONB DEFAULT '{}',
  sequencing_info JSONB DEFAULT '{}',
  content_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Visibility Rules (from existing schema)
CREATE TABLE task_visibility_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(50) REFERENCES tasks(task_id),
  rule_name VARCHAR(100) NOT NULL,
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Variants (from existing schema)
CREATE TABLE task_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(50) REFERENCES tasks(task_id),
  variant_name VARCHAR(50) NOT NULL,
  language VARCHAR(3) DEFAULT 'en',
  content_structure JSONB NOT NULL,
  personalization_tokens JSONB DEFAULT '{}',
  content_metadata JSONB DEFAULT '{}',
  conditional_elements JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Task Status (from existing schema)
CREATE TABLE user_task_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(user_id),
  task_id VARCHAR(50) REFERENCES tasks(task_id),
  status VARCHAR(20) DEFAULT 'pending',
  current_step INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Sample Data for Tasks
INSERT INTO tasks (task_id, basic_info, targeting_info, sequencing_info) VALUES 
('secure_visa', 
 '{"title": "Secure residence permit / visa", "category": "legal", "estimated_duration": "2-8 weeks"}',
 '{"applies_to": ["NON_EU_EFTA"], "urgency_level": "high", "is_mandatory": true}',
 '{"priority": 1, "depends_on": [], "unlocks": ["register_gemeinde"]}'),
 
('find_housing',
 '{"title": "Find housing", "category": "essential", "estimated_duration": "2-6 weeks"}',
 '{"applies_to": ["ALL"], "urgency_level": "high", "is_mandatory": true}',
 '{"priority": 2, "depends_on": [], "unlocks": ["register_gemeinde"]}'),
 
('register_gemeinde',
 '{"title": "Register at Gemeinde (municipality)", "category": "legal", "estimated_duration": "1 day"}',
 '{"applies_to": ["ALL"], "urgency_level": "urgent", "is_mandatory": true}',
 '{"priority": 3, "depends_on": ["secure_visa"], "unlocks": ["receive_permit_card"]}'),

('register_school',
 '{"title": "Register children for school", "category": "family", "estimated_duration": "1-2 weeks"}',
 '{"applies_to": ["FAMILIES_WITH_CHILDREN"], "urgency_level": "high", "is_mandatory": true}',
 '{"priority": 4, "depends_on": ["register_gemeinde"], "unlocks": []}'),

('receive_permit_card',
 '{"title": "Receive permit card", "category": "legal", "estimated_duration": "2-4 weeks"}',
 '{"applies_to": ["ALL"], "urgency_level": "medium", "is_mandatory": true}',
 '{"priority": 5, "depends_on": ["register_gemeinde"], "unlocks": []}');

-- Sample Visibility Rules
INSERT INTO task_visibility_rules (task_id, rule_name, conditions) VALUES 
('secure_visa', 'Non-EU citizens only', '{"is_eu_efta_citizen": false}'),
('find_housing', 'Show to everyone', '{}'),
('register_gemeinde', 'Show to everyone', '{}'),
('register_school', 'Families with children only', '{"has_children": true, "school_age_children_count": {"gt": 0}}'),
('receive_permit_card', 'Show to everyone', '{}');

-- Sample Content Variants
INSERT INTO task_content (task_id, variant_name, language, content_structure) VALUES 
-- Secure Visa Task - Non-EU/EFTA visa-exempt
('secure_visa', 'non_eu_visa_exempt', 'en', 
 '{"title": "Secure residence permit / visa", "intro": "Make sure your legal right to stay in Switzerland is secured", "info_box": "Since you are a citizen of {{country_of_origin}}:\n\n-You may enter Switzerland without a visa and stay up to 90 days as a tourist.\n-To live and work here, you need one of the following residence/work permits: L (short-term) or B (longer-term).\n-Your Swiss employer must apply for this permit before you start work.\n-Once approved, you can enter Switzerland visa-free and must register at your Gemeinde (municipality) within 14 days (see task Register at your Gemeinde (municipality)).", "action_options": {"primary": "Yes - Mark as Done", "secondary": "Not yet - Check the status of your permit application with your Swiss employer. You cannot start work until it''s approved."}}'),

-- Secure Visa Task - Non-EU/EFTA visa-required
('secure_visa', 'non_eu_visa_required', 'en', 
 '{"title": "Secure residence permit / visa", "intro": "Make sure your legal right to stay in Switzerland is secured", "info_box": "Since you are a citizen of {{country_of_origin}}:\n\n-Non- EU/EFTA citizens require a permit to live and work in Switzerland.\n-Your Swiss employer must apply for a work permit on your behalf with the cantonal authorities.\n-After your permit is approved by the canton and confirmed by the federal authorities (SEM), the Swiss embassy/consulate in your home country will issue you a D visa, which allows you to enter Switzerland to take up residence and employment.\n-After arrival, you must register at your Gemeinde (municipality) within 14 days and you will then receive your permit card: L (short-term) or B (longer-term) (see task Register at your Gemeinde (municipality)).", "action_options": {"primary": "Yes - Mark as Done", "secondary": "Not yet - Check the status of your application with your employer. Once it''s approved by the authorities, you must contact the Swiss embassy/consulate in your home country to obtain a D visa before traveling."}}'),

-- Secure Visa Task - Incomplete profile
('secure_visa', 'incomplete_profile', 'en', 
 '{"title": "Secure residence permit / visa", "intro": "Make sure your legal right to stay in Switzerland is secured", "info_box": "You haven''t shared your country of origin with us, therefore we cannot offer you tailored information in regards to this topic.\n\nWould you like to complete your profile, so you get the most out of your experience on Village?", "action_options": {"primary": "Yes - Mark as Done", "secondary": "Not yet - Please update your profile with your country of origin so we can give you the exact next steps."}}'),

('register_gemeinde', 'eu_citizen', 'en',
 '{"title": "Register at your Gemeinde (municipality)", "intro": "Make your residence official within 14 days of arrival", "info_box": "As an EU/EFTA citizen, you can register directly at your municipality. Bring your passport, employment contract, and rental agreement.", "action_options": {"primary": "Mark as Completed", "secondary": "Get Municipality Info"}}'),

('register_gemeinde', 'non_eu_citizen', 'en',
 '{"title": "Register at your Gemeinde (municipality)", "intro": "Make your residence official within 14 days of arrival", "info_box": "After receiving your D visa, register at your municipality within 14 days. You will receive your residence permit card.", "action_options": {"primary": "Mark as Completed", "secondary": "Get Municipality Info"}}'),

('register_school', 'standard', 'en',
 '{"title": "Register children for school", "intro": "Enroll your child in the Swiss school system", "info_box": "Contact your local school district to register your children. Bring birth certificates and vaccination records.", "action_options": {"primary": "Mark as Completed", "secondary": "Contact School District"}}'),

-- Find Housing Task - Standard (shown to everyone)
('find_housing', 'standard', 'en',
 '{"title": "Find housing", "intro": "The first step to building a home is finding a place that fits your needs.", "info_box": "~60% of Swiss residents rent; competition is high in big cities (Zurich, Geneva, Basel, Zug). Research the specific Gemeinde (municipality) you are considering. Taxes, public transport, and local amenities can vary significantly even between adjacent municipalities.", "action_options": {"primary": "Yes - Mark as Done", "secondary": "Not yet - Start Housing Search"}}'),

-- Receive Permit Card Task - Standard (shown to everyone)
('receive_permit_card', 'standard', 'en',
 '{"title": "Receive permit card", "intro": "Wait for your residence permit card to arrive", "info_box": "After registering at your Gemeinde, you will receive your residence permit card (L or B permit) within 2-4 weeks. This card is your official proof of residence in Switzerland.", "action_options": {"primary": "Yes - Mark as Done", "secondary": "Not yet - Check Status"}}');

-- Sample User Profile (for testing)
INSERT INTO user_profiles (
  user_id, 
  country_of_origin, 
  is_eu_efta_citizen, 
  visa_status,
  has_children, 
  children_count, 
  school_age_children_count,
  target_canton, 
  target_municipality,
  profile_completeness
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- Sample UUID
  'United States',
  FALSE,
  'visa_required',
  TRUE,
  1,
  1,
  'Zurich',
  'Zurich',
  '{"country_of_origin": true, "family_status": true, "destination": true}'
);

-- Row Level Security (RLS) Policies for Supabase
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only access their own task status
CREATE POLICY "Users can view own task status" ON user_task_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own task status" ON user_task_status
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task status" ON user_task_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for profile completeness calculation
CREATE OR REPLACE FUNCTION calculate_profile_completeness(profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  profile_record user_profiles%ROWTYPE;
  completeness JSONB := '{}';
BEGIN
  SELECT * INTO profile_record FROM user_profiles WHERE id = profile_id;
  
  -- Check country of origin completeness
  completeness := completeness || jsonb_build_object(
    'country_of_origin', 
    profile_record.country_of_origin IS NOT NULL AND profile_record.country_of_origin != ''
  );
  
  -- Check family status completeness
  completeness := completeness || jsonb_build_object(
    'family_status',
    profile_record.has_children IS NOT NULL
  );
  
  -- Check destination completeness
  completeness := completeness || jsonb_build_object(
    'destination',
    profile_record.target_municipality IS NOT NULL AND profile_record.target_municipality != ''
  );
  
  -- Calculate overall completeness percentage
  completeness := completeness || jsonb_build_object(
    'overall_percentage',
    CASE 
      WHEN (completeness->>'country_of_origin')::boolean = true AND
           (completeness->>'family_status')::boolean = true AND
           (completeness->>'destination')::boolean = true
      THEN 100
      WHEN (completeness->>'country_of_origin')::boolean = true AND
           (completeness->>'family_status')::boolean = true
      THEN 67
      WHEN (completeness->>'country_of_origin')::boolean = true
      THEN 33
      ELSE 0
    END
  );
  
  RETURN completeness;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update profile completeness
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness := calculate_profile_completeness(NEW.id);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_completeness
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completeness();

-- View for easy profile access with completeness
CREATE VIEW user_profiles_with_completeness AS
SELECT 
  *,
  calculate_profile_completeness(id) as calculated_completeness
FROM user_profiles;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores the three critical user profile pieces: country of origin, family status, and destination in Switzerland';
COMMENT ON COLUMN user_profiles.country_of_origin IS 'Most critical information - determines legal status and available tasks';
COMMENT ON COLUMN user_profiles.is_eu_efta_citizen IS 'Derived from country_of_origin - affects visa requirements';
COMMENT ON COLUMN user_profiles.has_children IS 'Determines if family-related tasks are shown';
COMMENT ON COLUMN user_profiles.school_age_children_count IS 'Children aged 4-16 - affects school registration tasks';
COMMENT ON COLUMN user_profiles.target_municipality IS 'Enables location-specific task content and municipality-specific help';

-- Create a function to get the correct content variant for a task based on user profile
CREATE OR REPLACE FUNCTION get_task_content_variant(user_uuid UUID, task_id_param VARCHAR(50))
RETURNS TABLE(variant_name VARCHAR(50), content_structure JSONB, personalization_tokens JSONB) AS $$
DECLARE
  profile_record user_profiles%ROWTYPE;
  content_variant VARCHAR(50);
BEGIN
  -- Get user profile
  SELECT * INTO profile_record FROM user_profiles WHERE user_id = user_uuid;
  
  -- If no profile found, return incomplete profile variant
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT tc.variant_name, tc.content_structure, tc.personalization_tokens
    FROM task_content tc
    WHERE tc.task_id = task_id_param AND tc.variant_name = 'incomplete_profile';
    RETURN;
  END IF;
  
  -- Determine content variant based on task and user profile
  CASE task_id_param
    WHEN 'secure_visa' THEN
      -- Check if country of origin is provided
      IF profile_record.country_of_origin IS NULL OR profile_record.country_of_origin = '' THEN
        content_variant := 'incomplete_profile';
      ELSIF profile_record.is_eu_efta_citizen = true THEN
        content_variant := 'not_applicable'; -- EU citizens don't need visa
      ELSIF profile_record.visa_status = 'visa_exempt' THEN
        content_variant := 'non_eu_visa_exempt';
      ELSE
        content_variant := 'non_eu_visa_required';
      END IF;
      
    WHEN 'register_gemeinde' THEN
      IF profile_record.is_eu_efta_citizen = true THEN
        content_variant := 'eu_citizen';
      ELSE
        content_variant := 'non_eu_citizen';
      END IF;
      
    WHEN 'register_school' THEN
      content_variant := 'standard';
      
    WHEN 'find_housing' THEN
      content_variant := 'standard';
      
    WHEN 'receive_permit_card' THEN
      content_variant := 'standard';
      
    ELSE
      content_variant := 'standard';
  END CASE;
  
  -- Return the appropriate content variant
  RETURN QUERY
  SELECT tc.variant_name, tc.content_structure, tc.personalization_tokens
  FROM task_content tc
  WHERE tc.task_id = task_id_param AND tc.variant_name = content_variant;
  
  -- If no specific variant found, try to return standard variant
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT tc.variant_name, tc.content_structure, tc.personalization_tokens
    FROM task_content tc
    WHERE tc.task_id = task_id_param AND tc.variant_name = 'standard';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_task_content_variant(UUID, VARCHAR(50)) IS 'Returns the correct content variant for a task based on user profile completeness and characteristics';
