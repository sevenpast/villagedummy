# 🚀 VILLAGE MVP - QUICK START GUIDE

## ⚡ 15 Minuten bis zum laufenden MVP

### ✅ SCHRITT 1: Dependencies installieren (2 min)

```bash
npm install @supabase/supabase-js @google/generative-ai date-fns lucide-react
npm install -D tsx xlsx
```

### ✅ SCHRITT 2: Excel bereinigen (5 min)

1. Öffne deine `Module1_Welcome to Switzerland.xlsx`
2. **Lösche ALLE leeren Zeilen** in Sheets 1-5
3. Füge Tasks 6-8 hinzu (copy from Artifact "Clean Excel Template")
4. Speichern & schließen

### ✅ SCHRITT 3: Environment Variables (2 min)

```bash
# Erstelle .env.local
cp .env.local.example .env.local

# Fülle aus:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
```

**Wo finde ich die Keys?**
- Supabase: Project Settings → API
- Gemini: https://aistudio.google.com/app/apikey

### ✅ SCHRITT 4: Datenbank Schema (3 min)

1. Gehe zu Supabase Dashboard → SQL Editor
2. Kopiere das Schema aus deinem Project Knowledge
3. Klicke "Run"
4. Warte bis ✅ Success

### ✅ SCHRITT 5: Migration ausführen (2 min)

```bash
# Excel → Database
npm run seed
```

Du solltest sehen:
```
🚀 Starting migration...
✅ Loaded workbook
✅ Module inserted
✅ Task 1: Secure residence permit / visa
✅ Task 2: Find housing
...
🎉 Migration completed successfully!
```

### ✅ SCHRITT 6: Dev Server starten (1 min)

```bash
npm run dev
```

Öffne: http://localhost:3000/dashboard

---

## 🎯 TESTING CHECKLIST

### Test 1: Dashboard lädt
- [ ] Gehe zu `/dashboard`
- [ ] Siehst du die 8 Tasks?
- [ ] Siehst du den Progress Bar?

### Test 2: Task expandieren
- [ ] Klicke auf einen Task
- [ ] Siehst du die Info Box?
- [ ] Siehst du "Yes/No" Buttons?

### Test 3: Task als "Done" markieren
- [ ] Klicke "Yes, Done!"
- [ ] Task wird grün mit ✓
- [ ] Progress Bar updated

### Test 4: AI-Generierung (optional)
- [ ] Öffne Task 3 (Gemeinde Registration)
- [ ] Klicke "Generate Personalized Checklist"
- [ ] Warte 5-10 Sekunden
- [ ] Siehst du die AI-generierte Checklist?

---

## 🐛 TROUBLESHOOTING

### Problem: "Failed to load tasks"
**Lösung**: 
1. Check Browser Console (F12)
2. Ist die API Route erreichbar?
3. Check Supabase Connection

### Problem: "User not found"
**Lösung**: 
1. Gehe zu `/login`
2. Erstelle einen Test-User
3. Füge User-Profil in Supabase manuell hinzu:

```sql
INSERT INTO users (id, first_name, country_of_origin, municipality, has_kids, arrival_date)
VALUES (
  'your-user-id',
  'Test',
  'Germany',
  'Zurich',
  false,
  '2025-10-01'
);
```

### Problem: Excel-Migration schlägt fehl
**Lösung**:
1. Check ob Excel-Datei im Root liegt
2. Sind ALLE leeren Zeilen gelöscht?
3. Sind die Spalten-Header korrekt?

---

## 🎨 NEXT STEPS (Nach MVP)

### Week 1: Polish Core Features
- [ ] Add loading states
- [ ] Improve mobile responsiveness
- [ ] Add error handling

### Week 2: AI Enhancements
- [ ] Cache AI responses in DB
- [ ] Add more AI features (bank comparison, school recommendations)
- [ ] Implement rate limiting

### Week 3: User Features
- [ ] Document upload
- [ ] Reminder emails
- [ ] Progress milestones & gamification

### Week 4: Go-to-Market
- [ ] Create landing page
- [ ] Beta testing with 10 users
- [ ] LinkedIn + Reddit launch

---

## 📊 SUCCESS METRICS

**MVP is successful if:**
- ✅ 8 tasks load correctly
- ✅ Personalization works (EU vs Non-EU)
- ✅ Task completion saves to DB
- ✅ AI generates at least one type of content
- ✅ No critical bugs in happy path

**LAUNCH READY if:**
- ✅ 3 beta users complete onboarding
- ✅ Average session: >5 minutes
- ✅ NPS score: >7/10
- ✅ Mobile works flawlessly

---

## 🔥 READY? LET'S GO!

```bash
# Final check:
npm install
npm run seed
npm run dev

# Open browser:
http://localhost:3000/dashboard

# IF YOU SEE TASKS → YOU'RE LIVE! 🚀
```

**Du hast es geschafft!** Time to build! 💪
