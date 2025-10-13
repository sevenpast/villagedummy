-- =====================================================
-- PostgreSQL Extensions Installation für E-Mail System
-- =====================================================
-- Diese Extensions sind ESSENTIELL für das E-Mail-Benachrichtigungssystem
-- gemäß der Architektur-Dokumentation

-- 1. pg_cron Extension - für Zeitplanung und Cron-Jobs
-- Ermöglicht es, SQL-Befehle zu bestimmten Zeiten auszuführen
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. pg_net Extension - für HTTP-Requests aus PostgreSQL
-- Ermöglicht es, Edge Functions von der Datenbank aus aufzurufen
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Überprüfung der Extensions
SELECT 
    extname as "Extension Name",
    extversion as "Version",
    extrelocatable as "Relocatable"
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');

-- 4. pg_cron Konfiguration
-- Erlaubt pg_cron für den aktuellen Benutzer
GRANT USAGE ON SCHEMA cron TO postgres;

-- 5. pg_net Konfiguration  
-- Erlaubt pg_net für HTTP-Requests
GRANT USAGE ON SCHEMA net TO postgres;

-- 6. Test der Extensions
-- Test pg_cron (sollte eine Liste der verfügbaren Cron-Jobs zeigen)
SELECT * FROM cron.job;

-- Test pg_net (sollte eine Liste der HTTP-Requests zeigen)
SELECT * FROM net.http_request_queue;

-- 7. Beispiel-Cron-Job für E-Mail-Queue (wird später aktiviert)
-- Dieser Job läuft jede Minute und verarbeitet die E-Mail-Warteschlange
-- SELECT cron.schedule('process-email-queue', '* * * * *', 'SELECT process_notification_queue();');

-- 8. Status-Report
DO $$
BEGIN
    RAISE NOTICE '✅ PostgreSQL Extensions Installation abgeschlossen!';
    RAISE NOTICE '📅 pg_cron: Zeitplanung und Cron-Jobs verfügbar';
    RAISE NOTICE '🌐 pg_net: HTTP-Requests aus PostgreSQL verfügbar';
    RAISE NOTICE '🚀 Bereit für E-Mail-Benachrichtigungssystem!';
END $$;
