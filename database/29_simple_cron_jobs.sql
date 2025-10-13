-- =====================================================
-- Simple Cron Jobs Setup (TEST-VERSION)
-- =====================================================
-- Vereinfachte Version für Tests

-- 1. Überprüfung: Existiert die notifications Tabelle?
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Die notifications Tabelle existiert nicht! Führe zuerst village/database/28_simple_notification_queue.sql aus.';
    END IF;
END $$;

-- 2. Überprüfung: Existiert die process_notification_queue Funktion?
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'process_notification_queue' AND routine_schema = 'public') THEN
        RAISE EXCEPTION 'Die process_notification_queue Funktion existiert nicht! Führe zuerst village/database/28_simple_notification_queue.sql aus.';
    END IF;
END $$;

-- 3. Entferne existierende Cron-Jobs (falls vorhanden)
-- Verwende DO-Block um Fehler zu vermeiden, wenn Jobs nicht existieren
DO $$
BEGIN
    -- Versuche Jobs zu entfernen, ignoriere Fehler wenn sie nicht existieren
    BEGIN
        PERFORM cron.unschedule('process-email-queue');
    EXCEPTION WHEN OTHERS THEN
        -- Job existiert nicht, das ist OK
        NULL;
    END;
    
    BEGIN
        PERFORM cron.unschedule('cleanup-old-notifications');
    EXCEPTION WHEN OTHERS THEN
        -- Job existiert nicht, das ist OK
        NULL;
    END;
    
    BEGIN
        PERFORM cron.unschedule('retry-failed-notifications');
    EXCEPTION WHEN OTHERS THEN
        -- Job existiert nicht, das ist OK
        NULL;
    END;
END $$;

-- 4. Haupt-Cron-Job: E-Mail-Queue Verarbeitung (alle 2 Minuten für Tests)
SELECT cron.schedule(
    'process-email-queue',
    '*/2 * * * *', -- Alle 2 Minuten (für Tests)
    'SELECT public.process_notification_queue();'
);

-- 5. Cleanup-Cron-Job: Alte Benachrichtigungen aufräumen (täglich)
SELECT cron.schedule(
    'cleanup-old-notifications',
    '0 2 * * *', -- Täglich um 02:00 UTC
    'DELETE FROM public.notifications WHERE status IN (''sent'', ''cancelled'') AND created_at < NOW() - INTERVAL ''7 days'';'
);

-- 6. Retry-Cron-Job: Fehlgeschlagene Benachrichtigungen wiederholen (alle 5 Minuten für Tests)
SELECT cron.schedule(
    'retry-failed-notifications',
    '*/5 * * * *', -- Alle 5 Minuten (für Tests)
    'UPDATE public.notifications SET status = ''pending'', retry_count = retry_count + 1 WHERE status = ''failed'' AND retry_count < max_retries AND last_attempt_at < NOW() - INTERVAL ''5 minutes'';'
);

-- 7. Überprüfung der Cron-Jobs
SELECT 
    jobid,
    schedule,
    command,
    active,
    jobname
FROM cron.job
WHERE jobname IN ('process-email-queue', 'cleanup-old-notifications', 'retry-failed-notifications');

-- 8. Test-Funktion: Manuelle Verarbeitung der Queue
CREATE OR REPLACE FUNCTION public.test_process_queue()
RETURNS TABLE(processed_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.process_notification_queue();
END;
$$;

-- 9. Test-Funktion: Queue-Status anzeigen
CREATE OR REPLACE FUNCTION public.get_queue_status()
RETURNS TABLE(
    status TEXT,
    count BIGINT,
    earliest_send TIMESTAMPTZ,
    latest_send TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.status,
        COUNT(*) as count,
        MIN(n.send_at) as earliest_send,
        MAX(n.send_at) as latest_send
    FROM public.notifications n
    GROUP BY n.status
    ORDER BY n.status;
END;
$$;

-- 10. Status-Report
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count FROM cron.job WHERE active = true;
    
    RAISE NOTICE '✅ Simple Cron Jobs Setup abgeschlossen!';
    RAISE NOTICE '📅 % aktive Cron-Jobs konfiguriert', job_count;
    RAISE NOTICE '⚙️ E-Mail-Queue: Alle 2 Minuten (Test-Modus)';
    RAISE NOTICE '🧹 Cleanup: Täglich um 02:00 UTC';
    RAISE NOTICE '🔄 Retry: Alle 5 Minuten (Test-Modus)';
    RAISE NOTICE '🧪 Test-Funktionen: test_process_queue(), get_queue_status()';
    RAISE NOTICE '🚀 Automatische E-Mail-Verarbeitung aktiviert!';
END $$;
