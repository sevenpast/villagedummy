-- FIX SERVICE ROLE PERMISSIONS - NEUES PROJEKT
-- Dieses Script repariert die Service Role Berechtigungen

-- 1. SERVICE ROLE BERECHTIGUNGEN GEWÄHREN
-- Vollständige Berechtigung für alle Tabellen
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 2. FÜR ZUKÜNFTIGE TABELLEN
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- 3. SCHEMA USAGE BERECHTIGUNG
GRANT USAGE ON SCHEMA public TO service_role;

-- 4. ANON USER BERECHTIGUNGEN (für RLS)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.user_profiles TO anon;

-- 5. AUTH.USERS BERECHTIGUNGEN
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;

-- 6. VERIFIKATION
SELECT 'SERVICE ROLE PERMISSIONS FIXED ✅' as status;

-- Prüfe Service Role Berechtigungen
SELECT 
    schemaname,
    tablename,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'UPDATE') as can_update,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Prüfe ob Service Role existiert
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname = 'service_role';
