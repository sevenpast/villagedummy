# Gemini AI Integration Setup

## 1. Gemini API Key holen

1. Gehe zu [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Melde dich mit deinem Google Account an
3. Klicke auf "Create API Key"
4. Kopiere den generierten API Key

## 2. Environment Variable einrichten

Erstelle eine `.env.local` Datei im Root-Verzeichnis der App:

```bash
# In /Users/andy/Documents/ExpatVillage/DummyPage2/expat-village-app/
touch .env.local
```

Füge deinen API Key hinzu:

```env
GEMINI_API_KEY=dein_echter_api_key_hier
```

## 3. Server neu starten

Nach dem Hinzufügen des API Keys, starte den Development Server neu:

```bash
npm run dev
```

## 4. Testen

1. Öffne http://localhost:3000
2. Gehe zu einem Task (z.B. "Register at Gemeinde")
3. Klicke auf "Generate Email to Municipality"
4. Die AI sollte eine professionelle E-Mail auf Deutsch generieren

## Features

- **E-Mail-Generierung**: Erstellt professionelle E-Mails an Schweizer Gemeindebüros
- **Deutsche Sprache**: Alle E-Mails werden auf Deutsch generiert
- **Personalisiert**: Berücksichtigt Benutzerdaten (Staatsbürgerschaft, Familie, etc.)
- **Download**: Generierte E-Mails können als Textdatei heruntergeladen werden

## Fallback

Falls kein API Key konfiguriert ist, zeigt die App eine Demo-Nachricht an.
