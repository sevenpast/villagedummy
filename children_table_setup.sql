-- ============================================
-- CHILDREN TABLE FOR VILLAGE DATABASE
-- Run this in Supabase SQL Editor
-- ============================================

-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- 4. Wait for completion

-- Drop existing table if it exists (for clean reinstall)
DROP TABLE IF EXISTS public.children CASCADE;

-- Create children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT children_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_children_user_id ON public.children(user_id);
CREATE INDEX idx_children_date_of_birth ON public.children(date_of_birth);
CREATE INDEX idx_children_is_active ON public.children(is_active);

-- Enable Row Level Security
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own children" ON public.children;

-- Create RLS policy - users can only access their own children
CREATE POLICY "Users can manage their own children" ON public.children
FOR ALL
TO authenticated
USING (user_id IN (
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_children_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS children_updated_at ON public.children;
CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.update_children_updated_at();

-- Insert sample data (optional - replace with real user IDs)
-- Uncomment and modify the user_id to match your actual users
/*
INSERT INTO public.children (
  user_id,
  first_name,
  last_name,
  date_of_birth,
  gender,
  nationality,
  birth_place,
  allergies,
  school_grade,
  preferred_language
) VALUES
(
  -- Replace this UUID with an actual user ID from your users table
  'user-uuid-here',
  'Sofia',
  'Santos',
  '2020-06-10',
  'female',
  'Brazilian',
  'São Paulo',
  'Peanut allergy',
  'Kindergarten',
  'Portuguese'
);
*/

-- Grant necessary permissions
GRANT ALL ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;

-- Show success message
SELECT 'Children table created successfully!' as status;