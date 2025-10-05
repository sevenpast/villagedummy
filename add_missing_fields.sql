-- Add missing fields for 95% Swiss authority form coverage
-- Execute this in your Supabase SQL editor

-- ==============================================
-- USERS TABLE - Add missing fields
-- ==============================================

-- Gender (required for 100% of forms)
ALTER TABLE public.users 
ADD COLUMN gender character varying CHECK (gender IN ('male', 'female', 'other'));

-- Nationality (required for 90% of forms)
ALTER TABLE public.users 
ADD COLUMN nationality character varying;

-- Birth place/citizenship (required for 90% of forms)
ALTER TABLE public.users 
ADD COLUMN birth_place character varying;

-- German language skills (required for 80% of forms)
ALTER TABLE public.users 
ADD COLUMN german_skills character varying CHECK (german_skills IN ('gut', 'mittel', 'keine'));

-- First language (required for 80% of forms)
ALTER TABLE public.users 
ADD COLUMN first_language character varying;

-- Family language (required for 70% of forms)
ALTER TABLE public.users 
ADD COLUMN family_language character varying;

-- ==============================================
-- CHILDREN TABLE - Add missing fields
-- ==============================================

-- Parent role (Vater/Mutter) - required for form filling
ALTER TABLE public.children 
ADD COLUMN parent_role character varying CHECK (parent_role IN ('father', 'mother'));

-- German skills for child (required for school forms)
ALTER TABLE public.children 
ADD COLUMN german_skills character varying CHECK (german_skills IN ('gut', 'mittel', 'keine'));

-- Child lives with (required for school forms)
ALTER TABLE public.children 
ADD COLUMN lives_with character varying CHECK (lives_with IN ('parents', 'mother', 'father'));

-- ==============================================
-- PERFORMANCE INDEXES
-- ==============================================

CREATE INDEX idx_users_gender ON public.users(gender);
CREATE INDEX idx_users_nationality ON public.users(nationality);
CREATE INDEX idx_users_german_skills ON public.users(german_skills);
CREATE INDEX idx_children_parent_role ON public.children(parent_role);
CREATE INDEX idx_children_german_skills ON public.children(german_skills);

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify children table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'children' 
AND table_schema = 'public'
ORDER BY ordinal_position;
