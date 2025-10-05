-- ============================================
-- ADD CHILDREN TABLE TO EXISTING VILLAGE DATABASE
-- This adds children support to your current database
-- ============================================

-- Add children table to existing schema
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
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
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  CONSTRAINT children_pkey PRIMARY KEY (id),
  CONSTRAINT children_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX idx_children_user_id ON public.children(user_id);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Users can manage their own children" ON public.children
FOR ALL
TO authenticated
USING (user_id IN (
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
));

-- Add update trigger function
CREATE OR REPLACE FUNCTION public.update_children_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update trigger
CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.update_children_updated_at();

-- Grant permissions
GRANT ALL ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;