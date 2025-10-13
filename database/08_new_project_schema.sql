-- VILLAGE DATABASE SCHEMA - NEUES PROJEKT
-- Sauberes Schema ohne Legacy-Probleme

-- 1. USER PROFILES TABELLE
CREATE TABLE public.user_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    email text,
    first_name text,
    last_name text,
    phone text,
    gender text,
    moved_to_switzerland date,
    planning_to_stay text,
    country_of_origin text,
    last_residence_country text,
    date_of_birth date,
    living_with text,
    home_address text,
    work_address text,
    has_children boolean DEFAULT false,
    children_ages text,
    current_situation text,
    interests text,
    primary_language text,
    about_me text,
    profile_image_url text,
    postal_code text,
    municipality text,
    canton text,
    family_status text,
    arrival_date date,
    work_permit_type text,
    language_preference text DEFAULT 'de'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- PRIMARY KEY
    CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
    
    -- FOREIGN KEY zu auth.users
    CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- UNIQUE CONSTRAINT - ein User kann nur ein Profil haben
    CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id)
);

-- 2. DOCUMENT CATEGORIES
CREATE TABLE public.document_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    icon text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT document_categories_pkey PRIMARY KEY (id)
);

-- 3. DOCUMENT VAULT
CREATE TABLE public.document_vault (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    category_id uuid,
    file_name text NOT NULL,
    file_size bigint NOT NULL,
    file_type text NOT NULL,
    encrypted_data bytea NOT NULL,
    encryption_key_hash text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT document_vault_pkey PRIMARY KEY (id),
    CONSTRAINT document_vault_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT document_vault_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.document_categories(id)
);

-- 4. DOCUMENT ACCESS LOGS
CREATE TABLE public.document_access_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid,
    user_id uuid,
    action text NOT NULL CHECK (action = ANY (ARRAY['view'::text, 'download'::text, 'delete'::text, 'share'::text])),
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT document_access_logs_pkey PRIMARY KEY (id),
    CONSTRAINT document_access_logs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.document_vault(id),
    CONSTRAINT document_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 5. FAMILY MEMBERS
CREATE TABLE public.family_members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    relationship text NOT NULL CHECK (relationship = ANY (ARRAY['spouse'::text, 'child'::text, 'parent'::text, 'other'::text])),
    birth_date date,
    nationality text,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT family_members_pkey PRIMARY KEY (id),
    CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 6. MODULES
CREATE TABLE public.modules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT modules_pkey PRIMARY KEY (id)
);

-- 7. TASKS
CREATE TABLE public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    module_id uuid,
    title text NOT NULL,
    description text,
    task_type text NOT NULL CHECK (task_type = ANY (ARRAY['form'::text, 'document'::text, 'appointment'::text, 'information'::text])),
    priority integer DEFAULT 1,
    estimated_duration integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);

-- 8. TASK VARIANTS
CREATE TABLE public.task_variants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    content jsonb DEFAULT '{}'::jsonb,
    target_segments jsonb DEFAULT '[]'::jsonb,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT task_variants_pkey PRIMARY KEY (id),
    CONSTRAINT task_variants_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE
);

-- 9. USER TASK PROGRESS
CREATE TABLE public.user_task_progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    task_id uuid NOT NULL,
    status text NOT NULL CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text])),
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT user_task_progress_pkey PRIMARY KEY (id),
    CONSTRAINT user_task_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_task_progress_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE
);

-- 10. MUNICIPALITIES (Swiss PLZ data)
CREATE TABLE public.municipalities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    postal_code text NOT NULL,
    municipality_name text NOT NULL,
    canton_code text NOT NULL,
    canton_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT municipalities_pkey PRIMARY KEY (id)
);

-- 11. EMAIL LOGS
CREATE TABLE public.email_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    email_type text NOT NULL,
    recipient_email text NOT NULL,
    subject text,
    status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'bounced'::text])),
    sent_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT email_logs_pkey PRIMARY KEY (id),
    CONSTRAINT email_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- 12. INDIZES FÜR BESSERE PERFORMANCE
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_postal_code ON public.user_profiles(postal_code);
CREATE INDEX idx_user_profiles_municipality ON public.user_profiles(municipality);
CREATE INDEX idx_user_profiles_country_of_origin ON public.user_profiles(country_of_origin);

CREATE INDEX idx_document_vault_user_id ON public.document_vault(user_id);
CREATE INDEX idx_document_vault_category_id ON public.document_vault(category_id);
CREATE INDEX idx_document_vault_is_deleted ON public.document_vault(is_deleted);

CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX idx_user_task_progress_user_id ON public.user_task_progress(user_id);
CREATE INDEX idx_user_task_progress_task_id ON public.user_task_progress(task_id);
CREATE INDEX idx_municipalities_postal_code ON public.municipalities(postal_code);

-- 13. RLS AKTIVIEREN (nur für user_profiles - andere Tabellen brauchen es nicht)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 14. RLS POLICIES FÜR USER_PROFILES
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 15. BERECHTIGUNGEN GEWÄHREN
-- Anon user kann auf user_profiles zugreifen (für RLS)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.user_profiles TO anon;

-- Service role hat alle Berechtigungen (automatisch in neuen Projekten)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- 16. VERIFIKATION
SELECT 'VILLAGE DATABASE SCHEMA ERSTELLT ✅' as status;
SELECT 'Tables created: ' || COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'RLS enabled on user_profiles: ' || CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN 'YES ✅' ELSE 'NO ❌' END as rls_check;
SELECT 'Service role permissions: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.role_usage_grants WHERE grantee = 'service_role' AND object_name = 'public') THEN 'YES ✅' ELSE 'NO ❌' END as service_role_check;
