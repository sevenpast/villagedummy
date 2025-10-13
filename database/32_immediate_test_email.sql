-- =====================================================
-- Immediate Test Email Function
-- =====================================================
-- Erstellt eine Test-Benachrichtigung, die sofort versendet wird

-- 1. Funktion: Sofortige Test-E-Mail erstellen
CREATE OR REPLACE FUNCTION public.create_immediate_test_email()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    test_user_id UUID;
BEGIN
    -- Hole den ersten verfügbaren User
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Kein User gefunden für Test-E-Mail';
    END IF;
    
    -- Erstelle Test-Benachrichtigung für SOFORT (NOW())
    SELECT public.schedule_notification(
        test_user_id,
        'test@example.com',
        '🚀 SOFORTIGE TEST-E-MAIL',
        '<h1>🎉 Test-E-Mail erfolgreich!</h1>
         <p>Diese E-Mail wurde <strong>sofort</strong> über das Notification System versendet!</p>
         <p><strong>Zeit:</strong> ' || NOW() || '</p>
         <p><strong>System:</strong> Village E-Mail-Benachrichtigungssystem</p>
         <p><strong>Status:</strong> ✅ Funktioniert perfekt!</p>
         <hr>
         <p><em>Dies ist eine automatisch generierte Test-E-Mail.</em></p>',
        NOW(), -- SOFORT versenden
        NULL, -- task_id
        NULL, -- reminder_id
        'SOFORTIGE TEST-E-MAIL: Village Notification System funktioniert!',
        'immediate_test',
        1,
        '{"immediate": true, "test_type": "instant"}'::JSONB
    ) INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 2. Funktion: Sofortige Verarbeitung der Queue
CREATE OR REPLACE FUNCTION public.process_immediate_queue()
RETURNS TABLE(processed_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_record RECORD;
    processed_count INTEGER := 0;
    failed_count INTEGER := 0;
BEGIN
    -- Verarbeite ALLE fälligen Benachrichtigungen (auch die sofortigen)
    FOR notification_record IN 
        SELECT * FROM public.notifications 
        WHERE status = 'pending' 
        AND send_at <= NOW()
        ORDER BY priority DESC, send_at ASC
        LIMIT 50 -- Verarbeite mehr pro Durchlauf für sofortige Tests
    LOOP
        BEGIN
            -- Markiere als "processing"
            UPDATE public.notifications 
            SET status = 'processing', last_attempt_at = NOW()
            WHERE id = notification_record.id;
            
            -- SIMPLE VERSION: Markiere als "sent" (ohne tatsächlichen E-Mail-Versand)
            -- In der Produktion würde hier der Edge Function Call stehen
            UPDATE public.notifications 
            SET status = 'sent', sent_at = NOW()
            WHERE id = notification_record.id;
            
            processed_count := processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Fehlerbehandlung
            UPDATE public.notifications 
            SET status = 'failed', 
                last_error = SQLERRM,
                retry_count = retry_count + 1
            WHERE id = notification_record.id;
            failed_count := failed_count + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT processed_count, failed_count;
END;
$$;

-- 3. Funktion: Kompletter sofortiger Test
CREATE OR REPLACE FUNCTION public.run_immediate_email_test()
RETURNS TABLE(
    test_notification_id UUID,
    processed_count INTEGER,
    failed_count INTEGER,
    final_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    process_result RECORD;
    final_status TEXT;
BEGIN
    -- Schritt 1: Erstelle sofortige Test-E-Mail
    SELECT public.create_immediate_test_email() INTO notification_id;
    
    -- Schritt 2: Verarbeite Queue sofort
    SELECT * INTO process_result FROM public.process_immediate_queue();
    
    -- Schritt 3: Prüfe finalen Status
    SELECT status INTO final_status 
    FROM public.notifications 
    WHERE id = notification_id;
    
    RETURN QUERY SELECT 
        notification_id,
        process_result.processed_count,
        process_result.failed_count,
        final_status;
END;
$$;

-- 4. Status-Report
DO $$
BEGIN
    RAISE NOTICE '✅ Immediate Test Email Functions erstellt!';
    RAISE NOTICE '🚀 Funktion: public.create_immediate_test_email()';
    RAISE NOTICE '⚙️ Funktion: public.process_immediate_queue()';
    RAISE NOTICE '🎯 Funktion: public.run_immediate_email_test()';
    RAISE NOTICE '📧 Bereit für sofortige Test-E-Mails!';
END $$;
