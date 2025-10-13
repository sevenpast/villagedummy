-- ============================================================================
-- UPDATE EXISTING TASK SYSTEM - ADD MISSING FEATURES
-- PostgreSQL 15+ with Supabase
-- ============================================================================

-- =====
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====

-- Add missing columns to modules table
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS module_number INTEGER,
ADD COLUMN IF NOT EXISTS title VARCHAR(200),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_number INTEGER,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Note: priority column already exists as INTEGER, we'll use numeric values:
-- 1 = LOW, 2 = MEDIUM, 3 = HIGH, 4 = URGENT

-- Add missing columns to task_variants table
ALTER TABLE public.task_variants 
ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS intro_text TEXT,
ADD COLUMN IF NOT EXISTS info_box_content TEXT,
ADD COLUMN IF NOT EXISTS question_text VARCHAR(300),
ADD COLUMN IF NOT EXISTS actions JSONB,
ADD COLUMN IF NOT EXISTS modal_title VARCHAR(200),
ADD COLUMN IF NOT EXISTS modal_content TEXT,
ADD COLUMN IF NOT EXISTS modal_has_reminder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS modal_default_reminder_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS official_link_url TEXT,
ADD COLUMN IF NOT EXISTS official_link_label VARCHAR(200),
ADD COLUMN IF NOT EXISTS checklist_items JSONB,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to user_task_progress table
ALTER TABLE public.user_task_progress 
ADD COLUMN IF NOT EXISTS task_variant_id UUID REFERENCES public.task_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====
-- CREATE REMINDERS TABLE (if not exists)
-- =====
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- 'email', 'in_app', 'push'
  message TEXT NOT NULL,
  next_send_date DATE NOT NULL,
  interval_days INTEGER DEFAULT 7,
  max_sends INTEGER DEFAULT 5,
  send_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====
-- ADD CONSTRAINTS
-- =====

-- Add unique constraints (with error handling)
DO $$ 
BEGIN
    -- Add unique constraint for modules
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_module_number' 
        AND conrelid = 'public.modules'::regclass
    ) THEN
        ALTER TABLE public.modules ADD CONSTRAINT unique_module_number UNIQUE(module_number);
    END IF;
    
    -- Add unique constraint for tasks
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_task_per_module' 
        AND conrelid = 'public.tasks'::regclass
    ) THEN
        ALTER TABLE public.tasks ADD CONSTRAINT unique_task_per_module UNIQUE(module_id, task_number);
    END IF;
    
    -- Add unique constraint for task_variants
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_variant_per_task' 
        AND conrelid = 'public.task_variants'::regclass
    ) THEN
        ALTER TABLE public.task_variants ADD CONSTRAINT unique_variant_per_task UNIQUE(task_id, variant_name);
    END IF;
    
    -- Add unique constraint for user_task_progress
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_task' 
        AND conrelid = 'public.user_task_progress'::regclass
    ) THEN
        ALTER TABLE public.user_task_progress ADD CONSTRAINT unique_user_task UNIQUE(user_id, task_id);
    END IF;
END $$;

-- =====
-- CREATE INDEXES FOR PERFORMANCE
-- =====
CREATE INDEX IF NOT EXISTS idx_tasks_module_id ON public.tasks(module_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_variants_task_id ON public.task_variants(task_id);
CREATE INDEX IF NOT EXISTS idx_task_variants_target_segments ON public.task_variants USING GIN(target_segments);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_id ON public.user_task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_status ON public.user_task_progress(status);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next_send_date ON public.reminders(next_send_date);

-- =====
-- ENABLE ROW LEVEL SECURITY
-- =====
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Reminders: Users can only see their own reminders
DO $$ 
BEGIN
    -- Create policies with error handling
    BEGIN
        CREATE POLICY "Users can view own reminders" ON public.reminders
          FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        CREATE POLICY "Users can insert own reminders" ON public.reminders
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        CREATE POLICY "Users can update own reminders" ON public.reminders
          FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        CREATE POLICY "Users can delete own reminders" ON public.reminders
          FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- =====
-- HELPER FUNCTIONS
-- =====

-- Function to calculate user segments based on profile
CREATE OR REPLACE FUNCTION public.calculate_user_segments(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  segments TEXT[] := '{}';
  user_profile RECORD;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile 
  FROM public.user_profiles 
  WHERE user_id = user_uuid;
  
  -- If no profile, return profile_incomplete
  IF user_profile IS NULL THEN
    RETURN ARRAY['profile_incomplete'];
  END IF;
  
  -- Country-based segments
  IF user_profile.country_of_origin IS NULL THEN
    segments := segments || 'profile_incomplete';
  ELSIF user_profile.country_of_origin IN ('Germany', 'France', 'Italy', 'Austria', 'Switzerland') THEN
    segments := segments || 'eu_efta';
  ELSIF user_profile.country_of_origin IN ('USA', 'Canada', 'Australia', 'Japan', 'South Korea') THEN
    segments := segments || 'non_eu_visa_exempt';
  ELSE
    segments := segments || 'non_eu_visa_required';
  END IF;
  
  -- Family-based segments
  IF user_profile.has_children = true THEN
    segments := segments || 'with_kids';
  ELSIF user_profile.has_children = false THEN
    segments := segments || 'without_kids';
  END IF;
  
  -- Time-based segments
  IF user_profile.moved_to_switzerland IS NOT NULL THEN
    IF EXTRACT(DAYS FROM (NOW() - user_profile.moved_to_switzerland)) <= 90 THEN
      segments := segments || 'newcomer';
    ELSIF EXTRACT(DAYS FROM (NOW() - user_profile.moved_to_switzerland)) <= 365 THEN
      segments := segments || 'settling_in';
    ELSE
      segments := segments || 'established';
    END IF;
  END IF;
  
  RETURN segments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized tasks for a user
CREATE OR REPLACE FUNCTION public.get_user_tasks(user_uuid UUID, module_num INTEGER DEFAULT 1)
RETURNS TABLE (
  task_id UUID,
  task_number INTEGER,
  title VARCHAR(300),
  priority INTEGER,
  display_order INTEGER,
  variant_id UUID,
  variant_name VARCHAR(100),
  intro_text TEXT,
  info_box_content TEXT,
  question_text VARCHAR(300),
  actions JSONB,
  modal_title VARCHAR(200),
  modal_content TEXT,
  modal_has_reminder BOOLEAN,
  modal_default_reminder_days INTEGER,
  official_link_url TEXT,
  official_link_label VARCHAR(200),
  checklist_items JSONB,
  user_status VARCHAR(20),
  user_completed_at TIMESTAMPTZ
) AS $$
DECLARE
  user_segments TEXT[];
BEGIN
  -- Calculate user segments
  user_segments := public.calculate_user_segments(user_uuid);
  
  RETURN QUERY
  SELECT 
    t.id as task_id,
    COALESCE(t.task_number, 0) as task_number,
    t.title,
    COALESCE(t.priority, 2) as priority, -- 2 = MEDIUM
    COALESCE(t.display_order, 0) as display_order,
    tv.id as variant_id,
    COALESCE(tv.variant_name, 'default') as variant_name,
    COALESCE(tv.intro_text, '') as intro_text,
    COALESCE(tv.info_box_content, '') as info_box_content,
    tv.question_text,
    tv.actions,
    tv.modal_title,
    tv.modal_content,
    COALESCE(tv.modal_has_reminder, false) as modal_has_reminder,
    COALESCE(tv.modal_default_reminder_days, 7) as modal_default_reminder_days,
    tv.official_link_url,
    tv.official_link_label,
    tv.checklist_items,
    COALESCE(utp.status, 'not_started') as user_status,
    utp.completed_at as user_completed_at
  FROM public.tasks t
  JOIN public.modules m ON t.module_id = m.id
  LEFT JOIN public.task_variants tv ON t.id = tv.task_id
  LEFT JOIN public.user_task_progress utp ON t.id = utp.task_id AND utp.user_id = user_uuid
  WHERE COALESCE(m.module_number, 1) = module_num
    AND t.is_active = true
    AND m.is_active = true
    AND (tv.target_segments IS NULL OR tv.target_segments = '[]'::jsonb OR 
         EXISTS (
           SELECT 1 FROM jsonb_array_elements_text(tv.target_segments) AS segment
           WHERE segment = ANY(user_segments)
         ))
  ORDER BY COALESCE(t.display_order, 0), COALESCE(t.task_number, 0), COALESCE(tv.priority, 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====
-- SEED DATA FOR TASK 1
-- =====

-- Update Module 1
INSERT INTO public.modules (module_number, name, title, description, display_order)
VALUES (1, 'Welcome to Switzerland', 'Welcome to Switzerland: Your first 90 days', 'Essential onboarding tasks for new expats', 1)
ON CONFLICT (module_number) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Insert Task 1: Secure residence permit / visa
INSERT INTO public.tasks (module_id, task_number, title, description, task_type, priority, display_order)
VALUES (
  (SELECT id FROM public.modules WHERE module_number = 1),
  1,
  'Secure residence permit / visa',
  'Ensure your legal right to stay and work in Switzerland',
  'information', -- task_type is required (form, document, appointment, information)
  4, -- 4 = URGENT (1=LOW, 2=MEDIUM, 3=HIGH, 4=URGENT)
  1
)
ON CONFLICT (module_id, task_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  task_type = EXCLUDED.task_type,
  priority = EXCLUDED.priority,
  display_order = EXCLUDED.display_order;

-- Insert Task 1 Variants
INSERT INTO public.task_variants (
  task_id, 
  title,                    -- ❌ NOT NULL - muss angegeben werden!
  description,
  variant_name, 
  target_segments, 
  intro_text,
  info_box_content,
  question_text,
  actions,
  modal_title,
  modal_content,
  modal_has_reminder,
  modal_default_reminder_days,
  official_link_url,
  official_link_label,
  checklist_items
) VALUES 
-- Variant 1: EU/EFTA Citizens
(
  (SELECT id FROM public.tasks WHERE task_number = 1),
  'EU/EFTA Citizens - Residence Permit',  -- title (NOT NULL)
  'Personalized guidance for EU/EFTA citizens',  -- description
  'eu_efta',
  '["eu_efta"]'::jsonb,
  'Make sure your legal right to stay in Switzerland is secured',
  'As an EU/EFTA citizen, you can enter Switzerland freely and stay up to 90 days without any formalities. To live and work here longer, you need to register with your local municipality (Gemeinde) within 14 days of arrival and obtain a residence permit.',
  'Do you already have your residence permit?',
  '[
    {
      "type": "button",
      "label": "Yes, I have it",
      "behavior": "mark_done",
      "style": "primary"
    },
    {
      "type": "button", 
      "label": "Not yet",
      "behavior": "open_modal",
      "style": "secondary"
    }
  ]'::jsonb,
  'Reminder',
  'We''ll remind you to check on the status.',
  true,
  7,
  'https://www.sem.admin.ch/sem/en/home/themen/aufenthalt/eu_efta.html',
  'Official SEM Information',
  '[
    {"text": "Valid passport or ID card", "required": true},
    {"text": "Proof of employment or job offer", "required": true},
    {"text": "Proof of health insurance", "required": true},
    {"text": "Proof of housing (rental contract)", "required": false}
  ]'::jsonb
),

-- Variant 2: Non-EU Visa Required
(
  (SELECT id FROM public.tasks WHERE task_number = 1),
  'Non-EU Citizens - Work Permit & Visa',  -- title (NOT NULL)
  'Personalized guidance for non-EU citizens requiring work permit',  -- description
  'visa_required',
  '["non_eu_visa_required"]'::jsonb,
  'Make sure your legal right to stay in Switzerland is secured',
  'Since you are a citizen of a non-EU/EFTA country, you need a work permit to live and work in Switzerland. Your Swiss employer must apply for this permit with the cantonal authorities. After approval, you''ll receive a D visa to enter Switzerland.',
  'Do you already have your work permit and D visa?',
  '[
    {
      "type": "button",
      "label": "Yes, I have both",
      "behavior": "mark_done",
      "style": "primary"
    },
    {
      "type": "button", 
      "label": "Not yet",
      "behavior": "open_modal",
      "style": "secondary"
    }
  ]'::jsonb,
  'Set a Reminder',
  'Here''s what you need to do:\n\n1. Check with your employer about permit application status\n2. Once approved, contact Swiss embassy for D visa\n3. After arrival, register at your Gemeinde within 14 days\n\nWould you like us to remind you about this?',
  true,
  3,
  'https://www.sem.admin.ch/sem/en/home/themen/aufenthalt/nicht_eu_efta.html',
  'Official SEM Information',
  '[
    {"text": "Valid passport", "required": true},
    {"text": "Work permit approval letter", "required": true},
    {"text": "D visa from Swiss embassy", "required": true},
    {"text": "Proof of health insurance", "required": true},
    {"text": "Proof of housing", "required": false}
  ]'::jsonb
),

-- Variant 3: Profile Incomplete
(
  (SELECT id FROM public.tasks WHERE task_number = 1),
  'Complete Profile - Residence Permit Guidance',  -- title (NOT NULL)
  'Please complete your profile to get personalized guidance',  -- description
  'profile_incomplete',
  '["profile_incomplete"]'::jsonb,
  'Make sure your legal right to stay in Switzerland is secured',
  'You haven''t shared your country of origin with us, so we can''t provide personalized guidance for this critical task. Please complete your profile so we can give you the most relevant information.',
  'Would you like to complete your profile?',
  '[
    {
      "type": "button",
      "label": "Complete Profile",
      "behavior": "redirect",
      "redirect_url": "/profile",
      "style": "primary"
    },
    {
      "type": "button", 
      "label": "Remind me later",
      "behavior": "set_reminder",
      "style": "secondary"
    }
  ]'::jsonb,
  'Complete Your Profile',
  'To give you the most relevant guidance for your visa and residence permit requirements, we need to know your country of origin. This helps us determine:\n\n• Whether you need a visa\n• What documents you''ll need\n• Which authorities to contact\n\nCompleting your profile takes just 2 minutes!',
  false,
  7,
  'https://www.sem.admin.ch/sem/en/home/themen/aufenthalt.html',
  'General SEM Information',
  '[
    {"text": "Complete your profile", "required": true},
    {"text": "Check visa requirements for your country", "required": true},
    {"text": "Contact Swiss embassy if needed", "required": false}
  ]'::jsonb
)
ON CONFLICT (task_id, variant_name) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  target_segments = EXCLUDED.target_segments,
  intro_text = EXCLUDED.intro_text,
  info_box_content = EXCLUDED.info_box_content,
  question_text = EXCLUDED.question_text,
  actions = EXCLUDED.actions,
  modal_title = EXCLUDED.modal_title,
  modal_content = EXCLUDED.modal_content,
  modal_has_reminder = EXCLUDED.modal_has_reminder,
  modal_default_reminder_days = EXCLUDED.modal_default_reminder_days,
  official_link_url = EXCLUDED.official_link_url,
  official_link_label = EXCLUDED.official_link_label,
  checklist_items = EXCLUDED.checklist_items;

-- =====
-- GRANT PERMISSIONS
-- =====
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT ON public.tasks TO authenticated;
GRANT SELECT ON public.task_variants TO authenticated;
GRANT ALL ON public.user_task_progress TO authenticated;
GRANT ALL ON public.reminders TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_user_segments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tasks(UUID, INTEGER) TO authenticated;
