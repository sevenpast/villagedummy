-- =====================================================
-- Simple Notification Queue System (TEST-VERSION)
-- =====================================================
-- Vereinfachte Version ohne komplexe Edge Function Calls

-- 1. Notification Queue Tabelle
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
    
    -- E-Mail Daten
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Zeitplanung
    send_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status und Wiederholungen
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadaten
    email_type TEXT DEFAULT 'task_reminder',
    priority INTEGER DEFAULT 1, -- 1=normal, 2=high, 3=urgent
    metadata JSONB DEFAULT '{}',
    
    -- Fehlerbehandlung
    last_error TEXT,
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ
);

-- 2. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_notifications_status_send_at 
    ON public.notifications(status, send_at) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
    ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_task_id 
    ON public.notifications(task_id);

-- 3. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Benutzer können nur ihre eigenen Benachrichtigungen sehen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
        CREATE POLICY "Users can view own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Service Role kann alles (für Cron-Jobs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service role can manage all notifications') THEN
        CREATE POLICY "Service role can manage all notifications" ON public.notifications
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 4. Simple Notification Queue Processing Function (ohne Edge Function)
CREATE OR REPLACE FUNCTION public.process_notification_queue()
RETURNS TABLE(processed_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_record RECORD;
    processed_count INTEGER := 0;
    failed_count INTEGER := 0;
BEGIN
    -- Verarbeite alle fälligen Benachrichtigungen
    FOR notification_record IN 
        SELECT * FROM public.notifications 
        WHERE status = 'pending' 
        AND send_at <= NOW()
        ORDER BY priority DESC, send_at ASC
        LIMIT 10 -- Verarbeite max 10 pro Durchlauf
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

-- 5. Helper Function: Benachrichtigung planen (KORRIGIERT)
CREATE OR REPLACE FUNCTION public.schedule_notification(
    p_user_id UUID,
    p_recipient_email TEXT,
    p_subject TEXT,
    p_html_content TEXT,
    p_send_at TIMESTAMPTZ,
    p_task_id UUID DEFAULT NULL,
    p_reminder_id UUID DEFAULT NULL,
    p_text_content TEXT DEFAULT NULL,
    p_email_type TEXT DEFAULT 'task_reminder',
    p_priority INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, recipient_email, subject, html_content, send_at,
        task_id, reminder_id, text_content, email_type, priority, metadata
    ) VALUES (
        p_user_id, p_recipient_email, p_subject, p_html_content, p_send_at,
        p_task_id, p_reminder_id, p_text_content, p_email_type, p_priority, p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 6. Helper Function: Benachrichtigung abbrechen
CREATE OR REPLACE FUNCTION public.cancel_notification(
    p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications 
    SET status = 'cancelled'
    WHERE id = p_notification_id 
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$;

-- 7. View für Dashboard-Übersicht
CREATE OR REPLACE VIEW public.notification_stats AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(send_at) as earliest_send,
    MAX(send_at) as latest_send
FROM public.notifications
GROUP BY status;

-- 8. Test-Funktion: Erstelle eine Test-Benachrichtigung
CREATE OR REPLACE FUNCTION public.create_test_notification()
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
        RAISE EXCEPTION 'Kein User gefunden für Test-Benachrichtigung';
    END IF;
    
    -- Erstelle Test-Benachrichtigung für in 1 Minute
    SELECT public.schedule_notification(
        test_user_id,
        'test@example.com',
        'Test E-Mail',
        '<h1>Test</h1><p>Dies ist eine Test-E-Mail!</p>',
        NOW() + INTERVAL '1 minute',
        NULL, -- task_id
        NULL, -- reminder_id
        'Test E-Mail: Dies ist eine Test-E-Mail!',
        'test',
        1,
        '{"test": true}'::JSONB
    ) INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 9. Status-Report
DO $$
BEGIN
    RAISE NOTICE '✅ Simple Notification Queue System erstellt!';
    RAISE NOTICE '📧 Tabelle: public.notifications';
    RAISE NOTICE '⚙️ Funktion: public.process_notification_queue() (Simple Version)';
    RAISE NOTICE '📅 Funktion: public.schedule_notification()';
    RAISE NOTICE '❌ Funktion: public.cancel_notification()';
    RAISE NOTICE '🧪 Funktion: public.create_test_notification()';
    RAISE NOTICE '📊 View: public.notification_stats';
    RAISE NOTICE '🚀 Bereit für E-Mail-Queue-Tests!';
END $$;
