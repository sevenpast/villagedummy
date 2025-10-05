-- ============================================
-- CHILDREN TABLE EXTENSION
-- Add this to extend the existing database
-- ============================================

-- Create children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20), -- 'male', 'female', 'other'
  nationality VARCHAR(100),
  birth_place VARCHAR(100),
  allergies TEXT,
  medical_conditions TEXT,
  special_needs TEXT,
  previous_school VARCHAR(200),
  school_grade VARCHAR(50),
  preferred_language VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_children_user_id ON children(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own children
CREATE POLICY "Users can manage their own children" ON children
FOR ALL
TO authenticated
USING (user_id IN (
  SELECT id FROM users WHERE auth_user_id = auth.uid()
));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_children_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_children_updated_at();

-- Add some sample data for testing
INSERT INTO children (user_id, first_name, last_name, date_of_birth, gender, nationality, allergies) VALUES
-- You'll need to replace this with actual user_id from your users table
-- ((SELECT id FROM users WHERE email = 'maria.santos@email.com'), 'Sofia', 'Santos', '2020-06-10', 'female', 'Brazilian', 'Peanut allergy');