-- =====================================================
-- Real Email Test Functions (mit echten E-Mail-Adressen)
-- =====================================================
-- Verwendet echte User-E-Mail-Adressen statt test@example.com

-- 1. Funktion: Echte E-Mail-Adresse für Test holen
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
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = test_user_id;
    
    -- Falls nicht gefunden, versuche user_profiles.email als Fallback
    IF user_email IS NULL OR user_email = '' THEN
        SELECT email INTO user_email 
        FROM public.user_profiles 
        WHERE user_id = test_user_id;
    END IF;
    
    -- Falls immer noch nicht gefunden, verwende Fallback
    IF user_email IS NULL OR user_email = '' THEN
        user_email := 'test@example.com';
    END IF;
    
    RETURN user_email;
END;
$$;

-- 2. Funktion: Echte Test-E-Mail mit echter E-Mail-Adresse
CREATE OR REPLACE FUNCTION public.create_real_test_email(user_id_param UUID DEFAULT NULL)
RETURNS TABLE(
    notification_id UUID,
    user_email TEXT,
    user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    test_user_id UUID;
    user_email TEXT;
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
    
    -- Hole echte E-Mail-Adresse
    SELECT public.get_user_email_for_test(test_user_id) INTO user_email;
    
    -- Erstelle Test-Benachrichtigung für SOFORT (NOW())
    SELECT public.schedule_notification(
        test_user_id,
        user_email, -- ECHTE E-Mail-Adresse!
        '🚀 ECHTE TEST-E-MAIL - Village System',
        '<h1>🎉 Echte Test-E-Mail erfolgreich!</h1>
         <p>Diese E-Mail wurde <strong>sofort</strong> an deine echte E-Mail-Adresse versendet!</p>
         <p><strong>Empfänger:</strong> ' || user_email || '</p>
         <p><strong>Zeit:</strong> ' || NOW() || '</p>
         <p><strong>System:</strong> Village E-Mail-Benachrichtigungssystem</p>
         <p><strong>Status:</strong> ✅ Funktioniert perfekt!</p>
         <hr>
         <p><em>Dies ist eine automatisch generierte Test-E-Mail an deine echte Adresse.</em></p>',
        NOW(), -- SOFORT versenden
        NULL, -- task_id
        NULL, -- reminder_id
        'ECHTE TEST-E-MAIL: Village Notification System funktioniert!',
        'real_test',
        1,
        '{"immediate": true, "test_type": "real_email", "recipient": "' || user_email || '"}'::JSONB
    ) INTO notification_id;
    
    RETURN QUERY SELECT notification_id, user_email, test_user_id;
END;
$$;

-- 3. Funktion: Kompletter echter Test
CREATE OR REPLACE FUNCTION public.run_real_email_test(user_id_param UUID DEFAULT NULL)
RETURNS TABLE(
    test_notification_id UUID,
    user_email TEXT,
    user_id UUID,
    processed_count INTEGER,
    failed_count INTEGER,
    final_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    user_email TEXT;
    test_user_id UUID;
    process_result RECORD;
    final_status TEXT;
BEGIN
    -- Schritt 1: Erstelle echte Test-E-Mail
    SELECT * INTO notification_id, user_email, test_user_id 
    FROM public.create_real_test_email(user_id_param);
    
    -- Schritt 2: Verarbeite Queue sofort
    SELECT * INTO process_result FROM public.process_immediate_queue();
    
    -- Schritt 3: Prüfe finalen Status
    SELECT status INTO final_status 
    FROM public.notifications 
    WHERE id = notification_id;
    
    RETURN QUERY SELECT 
        notification_id,
        user_email,
        test_user_id,
        process_result.processed_count,
        process_result.failed_count,
        final_status;
END;
$$;

-- 4. Funktion: Zeige alle verfügbaren E-Mail-Adressen
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

-- 5. Status-Report
DO $$
BEGIN
    RAISE NOTICE '✅ Real Email Test Functions erstellt!';
    RAISE NOTICE '📧 Funktion: public.get_user_email_for_test()';
    RAISE NOTICE '🎯 Funktion: public.create_real_test_email()';
    RAISE NOTICE '🚀 Funktion: public.run_real_email_test()';
    RAISE NOTICE '👥 Funktion: public.show_all_user_emails()';
    RAISE NOTICE '📧 Bereit für echte Test-E-Mails an echte Adressen!';
END $$;
