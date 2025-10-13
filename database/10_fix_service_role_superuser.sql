-- FIX SERVICE ROLE SUPERUSER PERMISSIONS
-- Das Hauptproblem: service_role ist kein Superuser!

-- 1. SERVICE ROLE ZU SUPERUSER MACHEN
ALTER ROLE service_role SUPERUSER;

-- 2. ZUSÄTZLICHE BERECHTIGUNGEN
ALTER ROLE service_role CREATEROLE;
ALTER ROLE service_role CREATEDB;
ALTER ROLE service_role LOGIN;

-- 3. VOLLSTÄNDIGE BERECHTIGUNGEN FÜR ALLE TABELLEN
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

-- 6. ANON USER BERECHTIGUNGEN (für RLS)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.user_profiles TO anon;

-- 7. VERIFIKATION
SELECT 'SERVICE ROLE SUPERUSER PERMISSIONS FIXED ✅' as status;

-- Prüfe Service Role Eigenschaften
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname = 'service_role';

-- Prüfe Berechtigungen für user_profiles
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
