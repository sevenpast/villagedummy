-- =====================================================
-- Cron Jobs Setup für E-Mail-Benachrichtigungssystem (KORRIGIERT)
-- =====================================================
-- Diese Version stellt sicher, dass die notifications Tabelle existiert

-- 1. Überprüfung: Existiert die notifications Tabelle?
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Die notifications Tabelle existiert nicht! Führe zuerst village/database/25_create_notification_queue.sql aus.';
    END IF;
END $$;

-- 2. Überprüfung: Existiert die process_notification_queue Funktion?
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'process_notification_queue' AND routine_schema = 'public') THEN
        RAISE EXCEPTION 'Die process_notification_queue Funktion existiert nicht! Führe zuerst village/database/25_create_notification_queue.sql aus.';
    END IF;
END $$;

-- 3. Entferne existierende Cron-Jobs (falls vorhanden)
SELECT cron.unschedule('process-email-queue');
SELECT cron.unschedule('cleanup-old-notifications');
SELECT cron.unschedule('retry-failed-notifications');
SELECT cron.unschedule('notification-status-report');

-- 4. Haupt-Cron-Job: E-Mail-Queue Verarbeitung
-- Läuft jede Minute und verarbeitet fällige Benachrichtigungen
SELECT cron.schedule(
    'process-email-queue',
    '* * * * *', -- Jede Minute
    'SELECT public.process_notification_queue();'
);

-- 5. Cleanup-Cron-Job: Alte Benachrichtigungen aufräumen
-- Läuft täglich um 02:00 UTC und löscht alte, verarbeitete Benachrichtigungen
SELECT cron.schedule(
    'cleanup-old-notifications',
    '0 2 * * *', -- Täglich um 02:00 UTC
    'DELETE FROM public.notifications WHERE status IN (''sent'', ''cancelled'') AND created_at < NOW() - INTERVAL ''30 days'';'
);

-- 6. Retry-Cron-Job: Fehlgeschlagene Benachrichtigungen wiederholen
-- Läuft alle 15 Minuten und versucht fehlgeschlagene Benachrichtigungen erneut
SELECT cron.schedule(
    'retry-failed-notifications',
    '*/15 * * * *', -- Alle 15 Minuten
    'UPDATE public.notifications SET status = ''pending'', retry_count = retry_count + 1 WHERE status = ''failed'' AND retry_count < max_retries AND last_attempt_at < NOW() - INTERVAL ''15 minutes'';'
);

-- 7. Monitoring-Cron-Job: Status-Report (nur wenn email_logs Tabelle existiert)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs' AND table_schema = 'public') THEN
        SELECT cron.schedule(
            'notification-status-report',
            '0 * * * *', -- Stündlich
            'INSERT INTO public.email_logs (email_type, recipient_email, subject, status, sent_at) VALUES (''system_report'', ''admin@village.com'', ''Notification Queue Status'', ''sent'', NOW());'
        );
    ELSE
        RAISE NOTICE 'email_logs Tabelle nicht gefunden - Status-Report Cron-Job übersprungen';
    END IF;
END $$;

-- 8. Überprüfung der Cron-Jobs
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
WHERE jobname IN ('process-email-queue', 'cleanup-old-notifications', 'retry-failed-notifications', 'notification-status-report');

-- 9. Cron-Job Management Funktionen

-- Funktion: Cron-Job aktivieren
CREATE OR REPLACE FUNCTION public.enable_cron_job(job_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE cron.job SET active = true WHERE jobname = job_name;
    RETURN FOUND;
END;
$$;

-- Funktion: Cron-Job deaktivieren
CREATE OR REPLACE FUNCTION public.disable_cron_job(job_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE cron.job SET active = false WHERE jobname = job_name;
    RETURN FOUND;
END;
$$;

-- Funktion: Cron-Job Status prüfen
CREATE OR REPLACE FUNCTION public.get_cron_job_status(job_name TEXT)
RETURNS TABLE(
    jobid BIGINT,
    schedule TEXT,
    command TEXT,
    active BOOLEAN,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.jobid,
        j.schedule,
        j.command,
        j.active,
        jr.start_time as last_run,
        jr.start_time + (j.schedule::cron) as next_run
    FROM cron.job j
    LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
    WHERE j.jobname = job_name
    ORDER BY jr.start_time DESC
    LIMIT 1;
END;
$$;

-- 10. Monitoring Views

-- View: Cron-Job Status Übersicht
CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT 
    j.jobname,
    j.schedule,
    j.active,
    jr.status as last_run_status,
    jr.start_time as last_run_time,
    jr.return_message as last_run_message
FROM cron.job j
LEFT JOIN LATERAL (
    SELECT status, start_time, return_message
    FROM cron.job_run_details
    WHERE jobid = j.jobid
    ORDER BY start_time DESC
    LIMIT 1
) jr ON true;

-- View: E-Mail-Queue Status
CREATE OR REPLACE VIEW public.email_queue_status AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(send_at) as earliest_send,
    MAX(send_at) as latest_send,
    AVG(EXTRACT(EPOCH FROM (NOW() - send_at))/60) as avg_delay_minutes
FROM public.notifications
WHERE status IN ('pending', 'processing')
GROUP BY status;

-- 11. Status-Report
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count FROM cron.job WHERE active = true;
    
    RAISE NOTICE '✅ Cron Jobs Setup abgeschlossen!';
    RAISE NOTICE '📅 % aktive Cron-Jobs konfiguriert', job_count;
    RAISE NOTICE '⚙️ E-Mail-Queue: Jede Minute';
    RAISE NOTICE '🧹 Cleanup: Täglich um 02:00 UTC';
    RAISE NOTICE '🔄 Retry: Alle 15 Minuten';
    RAISE NOTICE '📊 Monitoring: Stündlich (falls email_logs existiert)';
    RAISE NOTICE '🚀 Automatische E-Mail-Verarbeitung aktiviert!';
END $$;
