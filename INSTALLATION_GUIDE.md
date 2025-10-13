# 🚀 Installation Guide: E-Mail-Benachrichtigungssystem

## 📋 Übersicht

Dieses System implementiert die **dynamische Benachrichtigungswarteschlange (Muster C)** aus der Architektur-Dokumentation. Es ermöglicht:

- ✅ **Dynamische E-Mail-Planung** ("Erinnere mich in 7 Tagen")
- ✅ **Automatische Verarbeitung** via PostgreSQL Cron-Jobs
- ✅ **Robuste Fehlerbehandlung** mit Wiederholungsversuchen
- ✅ **Vollständige Auditierbarkeit** aller E-Mail-Versendungen

## 🔧 Installation Steps

### **Schritt 1: PostgreSQL Extensions installieren**

```sql
-- Führe diese Datei in Supabase SQL Editor aus:
village/database/24_install_postgres_extensions.sql
```

**Was passiert:**
- ✅ `pg_cron` Extension für Zeitplanung
- ✅ `pg_net` Extension für HTTP-Requests
- ✅ Berechtigungen konfigurieren

### **Schritt 2: Notification Queue System erstellen**

```sql
-- Führe diese Datei in Supabase SQL Editor aus:
village/database/25_create_notification_queue.sql
```

**Was passiert:**
- ✅ `notifications` Tabelle für E-Mail-Warteschlange
- ✅ `process_notification_queue()` Funktion
- ✅ `schedule_notification()` Helper-Funktion
- ✅ RLS Policies für Sicherheit

### **Schritt 3: Cron Jobs konfigurieren**

```sql
-- Führe diese Datei in Supabase SQL Editor aus:
village/database/26_setup_cron_jobs.sql
```

**Was passiert:**
- ✅ E-Mail-Queue Verarbeitung (jede Minute)
- ✅ Cleanup alter Benachrichtigungen (täglich)
- ✅ Retry fehlgeschlagener E-Mails (alle 15 Min)
- ✅ Monitoring und Status-Reports

### **Schritt 4: Resend API konfigurieren**

1. **Resend Account erstellen:**
   - Gehe zu [resend.com](https://resend.com)
   - Erstelle einen Account
   - Verifiziere deine Domain

2. **API Key generieren:**
   ```bash
   # In Supabase Dashboard > Settings > Environment Variables
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=onboarding@yourdomain.com
   ```

3. **Domain verifizieren:**
   - Füge DNS-Records hinzu (SPF, DKIM, DMARC)
   - Warte auf Verifizierung

### **Schritt 5: Supabase Edge Function deployen**

```bash
# Im village/ Verzeichnis
cd village

# Edge Function deployen
supabase functions deploy send-reminder-emails

# Environment Variables setzen
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set RESEND_FROM_EMAIL=onboarding@yourdomain.com
```

### **Schritt 6: Environment Variables konfigurieren**

```bash
# In .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@yourdomain.com
```

## 🧪 Testing

### **Test 1: Extensions prüfen**

```sql
-- In Supabase SQL Editor
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

**Erwartet:**
```
extname | extversion
--------|-----------
pg_cron | 1.6
pg_net  | 1.4
```

### **Test 2: Cron Jobs prüfen**

```sql
-- In Supabase SQL Editor
SELECT jobname, schedule, active FROM cron.job;
```

**Erwartet:**
```
jobname                    | schedule    | active
---------------------------|-------------|--------
process-email-queue        | * * * * *   | true
cleanup-old-notifications  | 0 2 * * *   | true
retry-failed-notifications | */15 * * * *| true
```

### **Test 3: Test-Benachrichtigung planen**

```sql
-- In Supabase SQL Editor
SELECT public.schedule_notification(
    'your-user-id'::UUID,
    NULL, -- task_id
    NULL, -- reminder_id
    'test@example.com',
    'Test E-Mail',
    '<h1>Test</h1><p>Dies ist eine Test-E-Mail!</p>',
    'Test E-Mail: Dies ist eine Test-E-Mail!',
    NOW() + INTERVAL '1 minute',
    'test',
    1,
    '{}'::JSONB
);
```

### **Test 4: Dashboard Debug-Tools**

1. Gehe zu `/dashboard`
2. Klicke auf **"Check Env"** - Environment Variables prüfen
3. Klicke auf **"Test DB"** - Supabase-Verbindung testen
4. Klicke auf **"Debug DB"** - Vollständige Debug-Info
5. Klicke auf **"Send Test Email"** - E-Mail-System testen

## 🚨 Troubleshooting

### **Problem: Extensions nicht verfügbar**

```sql
-- Prüfe verfügbare Extensions
SELECT * FROM pg_available_extensions WHERE name IN ('pg_cron', 'pg_net');

-- Falls nicht verfügbar, kontaktiere Supabase Support
```

### **Problem: Cron Jobs laufen nicht**

```sql
-- Prüfe Cron-Job Status
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Prüfe Fehler
SELECT * FROM cron.job_run_details WHERE status = 'failed' ORDER BY start_time DESC;
```

### **Problem: E-Mails werden nicht versendet**

```sql
-- Prüfe Notification Queue
SELECT status, COUNT(*) FROM public.notifications GROUP BY status;

-- Prüfe fehlgeschlagene E-Mails
SELECT * FROM public.notifications WHERE status = 'failed' ORDER BY created_at DESC;
```

### **Problem: Edge Function Fehler**

```bash
# Prüfe Edge Function Logs
supabase functions logs send-reminder-emails

# Teste Edge Function direkt
curl -X POST https://your-project.supabase.co/functions/v1/send-reminder-emails \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 📊 Monitoring

### **Dashboard Views**

```sql
-- E-Mail-Queue Status
SELECT * FROM public.email_queue_status;

-- Cron-Job Status
SELECT * FROM public.cron_job_status;

-- Notification Stats
SELECT * FROM public.notification_stats;
```

### **Alerts einrichten**

```sql
-- Fehlgeschlagene E-Mails
SELECT COUNT(*) FROM public.notifications 
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour';

-- Queue Backlog
SELECT COUNT(*) FROM public.notifications 
WHERE status = 'pending' AND send_at < NOW() - INTERVAL '5 minutes';
```

## 🎯 Nächste Schritte

Nach erfolgreicher Installation:

1. ✅ **Teste das System** mit den Debug-Tools
2. ✅ **Integriere in Task-System** - Erinnerungen für Tasks
3. ✅ **Erweitere Templates** - Mehrsprachige E-Mails
4. ✅ **Monitoring einrichten** - Alerts und Dashboards
5. ✅ **Produktions-Deployment** - Domain-Verifizierung

## 📚 Architektur-Referenz

Dieses System implementiert **Muster C** aus der Architektur-Dokumentation:

- **Warteschlangentabelle**: `public.notifications`
- **Poller**: `pg_cron` Job (jede Minute)
- **Verarbeitungsfunktion**: `process_notification_queue()`
- **Zustellung**: Supabase Edge Function + Resend API

**Vorteile:**
- ✅ Unbegrenzte Flexibilität bei der Planung
- ✅ Robustheit durch Wiederholungsversuche
- ✅ Vollständige Auditierbarkeit
- ✅ Skalierbarkeit durch PostgreSQL

---

**🚀 Das System ist jetzt bereit für dynamische E-Mail-Benachrichtigungen!**
