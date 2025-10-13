-- =====================================================
-- Fix JSON Error in Email Functions
-- =====================================================
-- Behebt den JSON-Syntax-Fehler in den E-Mail-Funktionen

-- 1. Zeige deine aktuelle E-Mail-Adresse
CREATE OR REPLACE FUNCTION public.show_my_email()
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
    WHERE u.id = auth.uid()  -- Nur der aktuelle User
    LIMIT 1;
END;
$$;

-- 2. Korrigierte Funktion: Echte Test-E-Mail mit korrigiertem JSON
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
    json_metadata JSONB;
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
    
    -- Erstelle JSON-Metadaten korrekt
    json_metadata := jsonb_build_object(
        'immediate', true,
        'test_type', 'real_email',
        'recipient', user_email
    );
    
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
        json_metadata
    ) INTO notification_id;
    
    RETURN QUERY SELECT notification_id, user_email, test_user_id;
END;
$$;

-- 3. Status-Report
DO $$
BEGIN
    RAISE NOTICE '✅ JSON Error Fixed!';
    RAISE NOTICE '📧 Funktion: public.show_my_email() - zeigt deine E-Mail';
    RAISE NOTICE '🎯 Funktion: public.create_real_test_email() - JSON korrigiert';
    RAISE NOTICE '📧 JSON-Syntax-Fehler behoben!';
END $$;
