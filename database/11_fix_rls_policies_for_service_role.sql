-- FIX RLS POLICIES FOR SERVICE ROLE
-- Da service_role nicht modifiziert werden kann, passen wir die RLS Policies an

-- 1. RLS POLICIES FÜR SERVICE ROLE ANPASSEN
-- Service Role soll alle RLS Policies umgehen können

-- Lösche die bestehenden Policies
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;

-- Erstelle neue Policies die Service Role berücksichtigen
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.role() = 'service_role'
    );

-- 2. ALTERNATIVE: RLS TEMPORÄR DEAKTIVIEREN FÜR TESTING
-- (Nur für Development - NIEMALS in Production!)
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. BERECHTIGUNGEN FÜR SERVICE ROLE GEWÄHREN
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 4. FÜR ZUKÜNFTIGE OBJEKTE
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- 5. SCHEMA BERECHTIGUNGEN
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;

-- 6. ANON USER BERECHTIGUNGEN
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.user_profiles TO anon;

-- 7. VERIFIKATION
SELECT 'RLS POLICIES FIXED FOR SERVICE ROLE ✅' as status;

-- Prüfe aktuelle Policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Prüfe RLS Status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';
