# 📧 E-Mail Notification System Setup

Dieses Dokument erklärt, wie das E-Mail-Notification-System für Task-Reminders eingerichtet wird.

## 🎯 Was das System macht

- **Tägliche E-Mail-Reminders** für offene Tasks
- **Mehrsprachige E-Mails** (Deutsch, Englisch, Französisch, Italienisch)
- **Personalisierte Nachrichten** basierend auf User-Profil
- **Automatische Wiederholung** mit konfigurierbaren Intervallen
- **E-Mail-Logging** für Tracking und Debugging

## 🛠️ Setup-Schritte

### 1. Resend API Key einrichten

1. Gehe zu [resend.com](https://resend.com) und erstelle einen Account
2. Erstelle einen neuen API Key
3. Füge den API Key zu deinen Environment Variables hinzu:

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxx
```

### 2. Supabase Edge Function deployen

```bash
# Installiere Supabase CLI
npm install -g supabase

# Login zu Supabase
supabase login

# Deploy die Edge Function
supabase functions deploy send-reminder-emails
```

### 3. Environment Variables in Supabase setzen

In der Supabase Dashboard → Settings → Edge Functions:

```bash
RESEND_API_KEY=re_xxxxxxxxxx
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Vercel Cron Job einrichten

1. Füge `CRON_SECRET` zu deinen Vercel Environment Variables hinzu:
```bash
CRON_SECRET=your_secret_key_here
```

2. Die `vercel.json` ist bereits konfiguriert für tägliche Ausführung um 9:00 Uhr

### 5. Domain für E-Mails verifizieren

1. In Resend Dashboard → Domains
2. Füge deine Domain hinzu (z.B. `village.com`)
3. Verifiziere die DNS-Einträge
4. Aktualisiere die `from` Adresse in der Edge Function

## 🧪 Testing

### Manueller Test

```bash
# Teste die Edge Function direkt
curl -X POST https://your-project.supabase.co/functions/v1/send-reminder-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "test"}'
```

### Test über API Route

```bash
# Teste den Cron Job
curl -X GET https://your-domain.vercel.app/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📊 Monitoring

### E-Mail Logs anzeigen

```sql
-- In Supabase SQL Editor
SELECT 
  el.*,
  up.first_name,
  up.last_name,
  up.email
FROM email_logs el
JOIN user_profiles up ON el.user_id = up.user_id
ORDER BY el.created_at DESC
LIMIT 50;
```

### Reminder Status prüfen

```sql
-- Aktive Reminders anzeigen
SELECT 
  r.*,
  t.title as task_title,
  up.first_name,
  up.last_name,
  up.email
FROM reminders r
JOIN tasks t ON r.task_id = t.id
JOIN user_profiles up ON r.user_id = up.user_id
WHERE r.is_active = true
ORDER BY r.next_send_date ASC;
```

## 🎨 E-Mail Templates

Die E-Mails werden automatisch in der Sprache des Users generiert:

- **Deutsch** (`language_preference = 'de'`)
- **Englisch** (`language_preference = 'en'`) - Default
- **Französisch** (`language_preference = 'fr'`)
- **Italienisch** (`language_preference = 'it'`)

### Template Features

- ✅ Responsive Design
- ✅ Village Branding
- ✅ Personalisierte Ansprache
- ✅ Task-Details
- ✅ Call-to-Action Button
- ✅ Support-Link

## 🔧 Konfiguration

### Reminder-Einstellungen

```typescript
// In TaskCard.tsx
const reminderSettings = {
  interval_days: 7,        // Wiederholung alle 7 Tage
  max_sends: 3,           // Maximal 3 E-Mails
  reminder_type: 'email'   // E-Mail-Reminder
}
```

### Cron Job Schedule

```json
// In vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"  // Täglich um 9:00 Uhr
    }
  ]
}
```

## 🚨 Troubleshooting

### Häufige Probleme

1. **E-Mails werden nicht gesendet**
   - Prüfe Resend API Key
   - Prüfe Domain-Verifizierung
   - Prüfe Edge Function Logs

2. **Cron Job läuft nicht**
   - Prüfe Vercel Cron Jobs Dashboard
   - Prüfe CRON_SECRET Environment Variable
   - Prüfe API Route Logs

3. **Falsche Sprache**
   - Prüfe `language_preference` im User-Profil
   - Prüfe Template-Generierung in Edge Function

### Debug Commands

```bash
# Edge Function Logs
supabase functions logs send-reminder-emails

# Vercel Logs
vercel logs --follow

# Test Reminder erstellen
INSERT INTO reminders (user_id, task_id, reminder_type, message, next_send_date, interval_days, max_sends)
VALUES ('user-uuid', 'task-uuid', 'email', 'Test reminder', CURRENT_DATE, 1, 1);
```

## 📈 Performance

- **Batch Processing**: Alle Reminders werden in einem Durchgang verarbeitet
- **Error Handling**: Fehlgeschlagene E-Mails werden geloggt und nicht wiederholt
- **Rate Limiting**: Resend hat eigene Rate Limits
- **Monitoring**: Vollständige Logs in `email_logs` Tabelle

## 🔒 Security

- **Service Role**: Edge Function verwendet Service Role Key
- **CORS**: Korrekte CORS-Headers für Web-Requests
- **Authentication**: Cron Job ist durch CRON_SECRET geschützt
- **Data Privacy**: E-Mails enthalten nur notwendige User-Daten

## 🎉 Fertig!

Nach dem Setup erhältst du:

- ✅ Automatische E-Mail-Reminders
- ✅ Mehrsprachige Templates
- ✅ Vollständiges Logging
- ✅ Monitoring und Debugging
- ✅ Skalierbare Architektur

Das System läuft vollständig automatisch und sendet täglich E-Mails an alle User mit fälligen Reminders! 🚀
