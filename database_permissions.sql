-- Database Permissions and Access Control for Village
-- This file sets up proper permissions for different user roles

-- Create roles for different access levels
CREATE ROLE village_admin;
CREATE ROLE village_app_user;
CREATE ROLE village_readonly;

-- Grant permissions to admin role (full access)
GRANT ALL PRIVILEGES ON DATABASE village TO village_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO village_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO village_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO village_admin;

-- Grant permissions to app user role (application access)
GRANT CONNECT ON DATABASE village TO village_app_user;
GRANT USAGE ON SCHEMA public TO village_app_user;

-- Table-specific permissions for app user
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO village_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_task_status TO village_app_user;
GRANT SELECT ON tasks TO village_app_user;
GRANT SELECT ON task_visibility_rules TO village_app_user;
GRANT SELECT ON task_content TO village_app_user;

-- Sequence permissions for app user
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO village_app_user;

-- Function permissions for app user
GRANT EXECUTE ON FUNCTION calculate_profile_completeness(UUID) TO village_app_user;
GRANT EXECUTE ON FUNCTION update_profile_completeness() TO village_app_user;

-- View permissions for app user
GRANT SELECT ON user_profiles_with_completeness TO village_app_user;

-- Grant permissions to readonly role (analytics/reporting)
GRANT CONNECT ON DATABASE village TO village_readonly;
GRANT USAGE ON SCHEMA public TO village_readonly;
GRANT SELECT ON user_profiles TO village_readonly;
GRANT SELECT ON user_task_status TO village_readonly;
GRANT SELECT ON tasks TO village_readonly;
GRANT SELECT ON task_visibility_rules TO village_readonly;
GRANT SELECT ON task_content TO village_readonly;
GRANT SELECT ON user_profiles_with_completeness TO village_readonly;

-- Supabase-specific permissions (if using Supabase)
-- These are typically handled automatically by Supabase, but here for reference:

-- Grant permissions to authenticated users (Supabase auth)
GRANT village_app_user TO authenticated;

-- Grant permissions to anon users (limited access)
GRANT village_readonly TO anon;

-- Service role permissions (for server-side operations)
GRANT village_admin TO service_role;

-- Create indexes for performance (if not already created in main schema)
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_task_status_status ON user_task_status(status);
CREATE INDEX IF NOT EXISTS idx_user_task_status_updated_at ON user_task_status(updated_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_country_children ON user_profiles(country_of_origin, has_children);
CREATE INDEX IF NOT EXISTS idx_user_profiles_eu_municipality ON user_profiles(is_eu_efta_citizen, target_municipality);

-- Grant permissions on indexes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO village_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO village_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_task_status TO village_app_user;

-- Create a function to check if user has complete profile
CREATE OR REPLACE FUNCTION user_has_complete_profile(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record FROM user_profiles WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN (
    profile_record.country_of_origin IS NOT NULL AND 
    profile_record.country_of_origin != '' AND
    profile_record.has_children IS NOT NULL AND
    profile_record.target_municipality IS NOT NULL AND 
    profile_record.target_municipality != ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION user_has_complete_profile(UUID) TO village_app_user;
GRANT EXECUTE ON FUNCTION user_has_complete_profile(UUID) TO village_readonly;

-- Create a function to get user's visible tasks based on profile
CREATE OR REPLACE FUNCTION get_user_visible_tasks(user_uuid UUID)
RETURNS TABLE(task_id VARCHAR(50), basic_info JSONB, sequencing_info JSONB) AS $$
DECLARE
  profile_record user_profiles%ROWTYPE;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record FROM user_profiles WHERE user_id = user_uuid;
  
  -- If no profile found, return empty result
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Return tasks based on visibility rules and user profile
  RETURN QUERY
  SELECT t.task_id, t.basic_info, t.sequencing_info
  FROM tasks t
  JOIN task_visibility_rules tvr ON t.task_id = tvr.task_id
  WHERE tvr.is_active = true
  AND (
    -- Show to everyone
    tvr.conditions = '{}'::jsonb
    OR
    -- Non-EU citizens only (for visa tasks)
    (tvr.conditions->>'is_eu_efta_citizen')::boolean = false AND profile_record.is_eu_efta_citizen = false
    OR
    -- Families with children only (for school tasks)
    (tvr.conditions->>'has_children')::boolean = true AND profile_record.has_children = true
    AND (tvr.conditions->'school_age_children_count'->>'gt')::integer < profile_record.school_age_children_count
  )
  ORDER BY (t.sequencing_info->>'priority')::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_visible_tasks(UUID) TO village_app_user;
GRANT EXECUTE ON FUNCTION get_user_visible_tasks(UUID) TO village_readonly;

-- Grant execute permission on the content variant function
GRANT EXECUTE ON FUNCTION get_task_content_variant(UUID, VARCHAR(50)) TO village_app_user;
GRANT EXECUTE ON FUNCTION get_task_content_variant(UUID, VARCHAR(50)) TO village_readonly;

-- Create audit log table for tracking profile changes
CREATE TABLE IF NOT EXISTS user_profile_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID, -- Could be the user themselves or an admin
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions on audit table
GRANT SELECT, INSERT ON user_profile_audit TO village_app_user;
GRANT SELECT ON user_profile_audit TO village_readonly;

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log country of origin changes
  IF OLD.country_of_origin IS DISTINCT FROM NEW.country_of_origin THEN
    INSERT INTO user_profile_audit (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.user_id, 'country_of_origin', OLD.country_of_origin, NEW.country_of_origin, NEW.user_id);
  END IF;
  
  -- Log family status changes
  IF OLD.has_children IS DISTINCT FROM NEW.has_children OR 
     OLD.children_count IS DISTINCT FROM NEW.children_count THEN
    INSERT INTO user_profile_audit (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.user_id, 'family_status', 
            json_build_object('has_children', OLD.has_children, 'children_count', OLD.children_count)::text,
            json_build_object('has_children', NEW.has_children, 'children_count', NEW.children_count)::text,
            NEW.user_id);
  END IF;
  
  -- Log destination changes
  IF OLD.target_municipality IS DISTINCT FROM NEW.target_municipality THEN
    INSERT INTO user_profile_audit (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.user_id, 'target_municipality', OLD.target_municipality, NEW.target_municipality, NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
CREATE TRIGGER trigger_log_profile_changes
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();

-- Grant execute permission on audit function
GRANT EXECUTE ON FUNCTION log_profile_changes() TO village_app_user;

-- Comments for documentation
COMMENT ON ROLE village_admin IS 'Full administrative access to the Village database';
COMMENT ON ROLE village_app_user IS 'Application user role with read/write access to user data';
COMMENT ON ROLE village_readonly IS 'Read-only access for analytics and reporting';
COMMENT ON FUNCTION user_has_complete_profile(UUID) IS 'Checks if a user has provided all three critical profile pieces';
COMMENT ON FUNCTION get_user_visible_tasks(UUID) IS 'Returns tasks visible to a user based on their profile';
COMMENT ON TABLE user_profile_audit IS 'Audit log for tracking changes to user profile information';
