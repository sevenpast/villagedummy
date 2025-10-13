-- =====================================================
-- Fix Email Data Types
-- =====================================================
-- Behebt den Datentyp-Fehler zwischen character varying(255) und text

-- 1. Korrigierte Funktion: Zeige alle verfügbaren E-Mail-Adressen
CREATE OR REPLACE FUNCTION public.show_all_user_emails()
RETURNS TABLE(
    user_id UUID,
    auth_email TEXT,
    profile_email TEXT,
    final_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email::text as auth_email,
        p.email::text as profile_email,
        COALESCE(NULLIF(u.email::text, ''), p.email::text, 'test@example.com') as final_email
    FROM auth.users u
    LEFT JOIN public.user_profiles p ON u.id = p.user_id
    ORDER BY u.created_at DESC
    LIMIT 10;
END;
$$;

-- 2. Korrigierte Funktion: E-Mail-Adresse für Test holen
CREATE OR REPLACE FUNCTION public.get_user_email_for_test(user_id_param UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
    test_user_id UUID;
BEGIN
    -- Verwende übergebenen User oder hole ersten verfügbaren
    IF user_id_param IS NOT NULL THEN
        test_user_id := user_id_param;
    ELSE
        SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    END IF;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Kein User gefunden für Test-E-Mail';
    END IF;
    
    -- Verwende auth.users.email (offizielle Supabase Auth E-Mail)
    SELECT u.email::text INTO user_email 
    FROM auth.users u
    WHERE u.id = test_user_id;
    
    -- Falls nicht gefunden, versuche user_profiles.email als Fallback
    IF user_email IS NULL OR user_email = '' THEN
        SELECT p.email::text INTO user_email 
        FROM public.user_profiles p
        WHERE p.user_id = test_user_id;
    END IF;
    
    -- Falls immer noch nicht gefunden, verwende Fallback
    IF user_email IS NULL OR user_email = '' THEN
        user_email := 'test@example.com';
    END IF;
    
    RETURN user_email;
END;
$$;

-- 3. Status-Report
DO $$
BEGIN
    RAISE NOTICE '✅ Email Data Types Fixed!';
    RAISE NOTICE '📧 Funktion: public.show_all_user_emails() - korrigiert';
    RAISE NOTICE '🎯 Funktion: public.get_user_email_for_test() - korrigiert';
    RAISE NOTICE '📧 Datentyp-Fehler behoben!';
END $$;
