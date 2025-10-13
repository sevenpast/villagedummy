-- =====================================================
-- Ultra Simple Cron Jobs Setup (OHNE UNSCHEDULE)
-- =====================================================
-- Diese Version vermeidet das unschedule-Problem komplett

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

-- 3. Prüfe ob Cron-Jobs bereits existieren
DO $$
DECLARE
    job_exists BOOLEAN;
BEGIN
    -- Prüfe ob process-email-queue bereits existiert
    SELECT EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue') INTO job_exists;
    
    IF job_exists THEN
        RAISE NOTICE 'Cron-Job process-email-queue existiert bereits. Überspringe Erstellung.';
    ELSE
        -- Erstelle neuen Cron-Job
        PERFORM cron.schedule(
            'process-email-queue',
            '*/2 * * * *', -- Alle 2 Minuten (für Tests)
            'SELECT public.process_notification_queue();'
        );
        RAISE NOTICE 'Cron-Job process-email-queue erstellt.';
    END IF;
END $$;

-- 4. Cleanup-Cron-Job (nur wenn nicht vorhanden)
DO $$
DECLARE
    job_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-notifications') INTO job_exists;
    
    IF job_exists THEN
        RAISE NOTICE 'Cron-Job cleanup-old-notifications existiert bereits. Überspringe Erstellung.';
    ELSE
        PERFORM cron.schedule(
            'cleanup-old-notifications',
            '0 2 * * *', -- Täglich um 02:00 UTC
            'DELETE FROM public.notifications WHERE status IN (''sent'', ''cancelled'') AND created_at < NOW() - INTERVAL ''7 days'';'
        );
        RAISE NOTICE 'Cron-Job cleanup-old-notifications erstellt.';
    END IF;
END $$;

-- 5. Retry-Cron-Job (nur wenn nicht vorhanden)
DO $$
DECLARE
    job_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'retry-failed-notifications') INTO job_exists;
    
    IF job_exists THEN
        RAISE NOTICE 'Cron-Job retry-failed-notifications existiert bereits. Überspringe Erstellung.';
    ELSE
        PERFORM cron.schedule(
            'retry-failed-notifications',
            '*/5 * * * *', -- Alle 5 Minuten (für Tests)
            'UPDATE public.notifications SET status = ''pending'', retry_count = retry_count + 1 WHERE status = ''failed'' AND retry_count < max_retries AND last_attempt_at < NOW() - INTERVAL ''5 minutes'';'
        );
        RAISE NOTICE 'Cron-Job retry-failed-notifications erstellt.';
    END IF;
END $$;

-- 6. Überprüfung der Cron-Jobs
SELECT 
    jobid,
    schedule,
    command,
    active,
    jobname
FROM cron.job
WHERE jobname IN ('process-email-queue', 'cleanup-old-notifications', 'retry-failed-notifications')
ORDER BY jobname;

-- 7. Test-Funktion: Manuelle Verarbeitung der Queue
CREATE OR REPLACE FUNCTION public.test_process_queue()
RETURNS TABLE(processed_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.process_notification_queue();
END;
$$;

-- 8. Test-Funktion: Queue-Status anzeigen
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

-- 9. Test-Funktion: Alle Benachrichtigungen anzeigen
CREATE OR REPLACE FUNCTION public.show_all_notifications()
RETURNS TABLE(
    id UUID,
    recipient_email TEXT,
    subject TEXT,
    status TEXT,
    send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_email,
        n.subject,
        n.status,
        n.send_at,
        n.created_at
    FROM public.notifications n
    ORDER BY n.created_at DESC
    LIMIT 20;
END;
$$;

-- 10. Status-Report
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count FROM cron.job WHERE active = true;
    
    RAISE NOTICE '✅ Ultra Simple Cron Jobs Setup abgeschlossen!';
    RAISE NOTICE '📅 % aktive Cron-Jobs konfiguriert', job_count;
    RAISE NOTICE '⚙️ E-Mail-Queue: Alle 2 Minuten (Test-Modus)';
    RAISE NOTICE '🧹 Cleanup: Täglich um 02:00 UTC';
    RAISE NOTICE '🔄 Retry: Alle 5 Minuten (Test-Modus)';
    RAISE NOTICE '🧪 Test-Funktionen: test_process_queue(), get_queue_status(), show_all_notifications()';
    RAISE NOTICE '🚀 Automatische E-Mail-Verarbeitung aktiviert!';
END $$;
