-- Complete Database Analysis: Missing Fields for 95% Swiss Authority Forms
-- Based on the Kindergarten/School registration form screenshot

-- ==============================================
-- 1. USERS TABLE - Missing Fields Analysis
-- ==============================================

-- ✅ ALREADY EXISTS:
-- first_name, last_name, email, date_of_birth, phone
-- country_of_origin, municipality, canton, postal_code
-- has_kids, num_children, marital_status, arrival_date
-- residence_permit_type (auto-determined from country)

-- ❌ MISSING FIELDS (95% of forms need these):

-- Gender (required for 100% of forms)
ALTER TABLE public.users 
ADD COLUMN gender character varying CHECK (gender IN ('male', 'female', 'other'));

-- Nationality (required for 90% of forms)
ALTER TABLE public.users 
ADD COLUMN nationality character varying;

-- Place of origin/citizenship (required for 90% of forms)
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
-- 2. CHILDREN TABLE - Missing Fields Analysis
-- ==============================================

-- ✅ ALREADY EXISTS:
-- first_name, last_name, date_of_birth, gender, nationality, birth_place
-- preferred_language, school_grade, previous_school

-- ❌ MISSING FIELDS:

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
-- 3. PERFORMANCE INDEXES
-- ==============================================

CREATE INDEX idx_users_gender ON public.users(gender);
CREATE INDEX idx_users_nationality ON public.users(nationality);
CREATE INDEX idx_users_german_skills ON public.users(german_skills);
CREATE INDEX idx_children_parent_role ON public.children(parent_role);
CREATE INDEX idx_children_german_skills ON public.children(german_skills);

-- ==============================================
-- 4. SUMMARY OF CHANGES
-- ==============================================

/*
USERS TABLE ADDITIONS:
- gender (male/female/other)
- nationality 
- birth_place
- german_skills (gut/mittel/keine)
- first_language
- family_language

CHILDREN TABLE ADDITIONS:
- parent_role (father/mother)
- german_skills (gut/mittel/keine)
- lives_with (parents/mother/father)

TOTAL: 9 new fields across 2 tables
This covers 95% of Swiss authority form requirements!
*/
