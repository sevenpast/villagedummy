# 🧪 E-Mail-System Test Guide

## 🎯 Schneller Test

### 1. **Dashboard Test-Button**
- Gehe zu `/dashboard`
- Klicke auf **"Send Test Email"**
- Du erhältst sofort eine Test-E-Mail!

### 2. **Was passiert beim Test:**
1. ✅ Erstellt einen Test-Reminder in der Datenbank
2. ✅ Ruft die Edge Function auf
3. ✅ Sendet eine E-Mail via Resend
4. ✅ Loggt das Ergebnis
5. ✅ Zeigt Erfolg/Fehler an

## 🛠️ Setup für Tests

### **Schritt 1: Resend Account**
```bash
# 1. Gehe zu resend.com
# 2. Erstelle Account
# 3. Erstelle API Key
# 4. Füge zu .env.local hinzu:
RESEND_API_KEY=re_xxxxxxxxxx
```

### **Schritt 2: Domain Setup (Optional für Tests)**
```bash
# Für Production: Domain verifizieren
# Für Tests: Verwende Resend's Test-Domain
# (funktioniert auch ohne Domain-Verifizierung)
```

### **Schritt 3: Edge Function deployen**
```bash
# Installiere Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy
supabase functions deploy send-reminder-emails
```

### **Schritt 4: Environment Variables in Supabase**
```bash
# Supabase Dashboard → Settings → Edge Functions
RESEND_API_KEY=re_xxxxxxxxxx
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Test-Szenarien

### **Test 1: Grundfunktionalität**
```bash
# 1. Klicke "Send Test Email" im Dashboard
# 2. Prüfe deine E-Mail-Inbox
# 3. Erwarte: E-Mail mit Village-Branding
```

### **Test 2: Mehrsprachigkeit**
```bash
# 1. Ändere language_preference in user_profiles
# 2. Sende Test-E-Mail
# 3. Prüfe: E-Mail in korrekter Sprache
```

### **Test 3: Task-Reminder**
```bash
# 1. Gehe zu /tasks
# 2. Setze einen Reminder
# 3. Warte bis zum nächsten Tag
# 4. Prüfe: Automatische E-Mail
```

## 📊 Monitoring

### **E-Mail-Logs prüfen**
```sql
-- In Supabase SQL Editor
SELECT 
  el.*,
  up.first_name,
  up.email
FROM email_logs el
JOIN user_profiles up ON el.user_id = up.user_id
ORDER BY el.created_at DESC
LIMIT 10;
```

### **Reminder-Status prüfen**
```sql
-- Aktive Reminders
SELECT 
  r.*,
  t.title,
  up.email
FROM reminders r
JOIN tasks t ON r.task_id = t.id
JOIN user_profiles up ON r.user_id = up.user_id
WHERE r.is_active = true;
```

## 🚨 Troubleshooting

### **Problem: "Failed to send test email"**
```bash
# Lösungen:
1. Prüfe RESEND_API_KEY in .env.local
2. Prüfe Edge Function Environment Variables
3. Prüfe Supabase Logs
4. Prüfe Resend Dashboard für Fehler
```

### **Problem: "Edge Function not found"**
```bash
# Lösungen:
1. Deploy Edge Function: supabase functions deploy
2. Prüfe Function Name: send-reminder-emails
3. Prüfe Supabase Project URL
```

### **Problem: "User profile not found"**
```bash
# Lösungen:
1. Stelle sicher, dass User eingeloggt ist
2. Prüfe user_profiles Tabelle
3. Erstelle Profil falls nötig
```

## 🎉 Erfolgreicher Test

### **Was du sehen solltest:**
1. ✅ **Dashboard:** "Success! Test email sent successfully!"
2. ✅ **E-Mail:** Professionelle E-Mail mit Village-Branding
3. ✅ **Logs:** Eintrag in email_logs Tabelle
4. ✅ **Console:** Keine Fehler in Browser-Console

### **E-Mail-Inhalt:**
```
🏠 Village - Your Swiss Expat Guide

Hello [Name]! 👋
It's time to think about your next task:

📋 [Task Title]
🧪 TEST EMAIL: Don't forget to complete: [Task]. 
This is a test email to verify the notification system is working correctly!

[View Task →]

Need help? Simply reply to this email.
```

## 🚀 Nächste Schritte

Nach erfolgreichem Test:
1. ✅ **Domain verifizieren** in Resend (für Production)
2. ✅ **Cron Job aktivieren** in Vercel
3. ✅ **Monitoring einrichten** für Production
4. ✅ **E-Mail-Templates anpassen** nach Bedarf

Das System ist dann bereit für Production! 🎉
