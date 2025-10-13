# 🔧 Einfache Lösung - Keine Datenbank-Änderung!

## Problem
Der Code versucht auf eine `documents` Tabelle zuzugreifen, die nicht existiert.

## Lösung
Führe nur dieses eine SQL-Script aus:

### 1. Gehe zu Supabase Dashboard
- Öffne: https://supabase.com/dashboard
- Wähle dein Projekt aus
- Gehe zu "SQL Editor"

### 2. Führe dieses SQL aus
```sql
-- Create a simple documents table for the Document Vault
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    category TEXT DEFAULT 'unknown',
    ai_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_ai_analysis ON public.documents USING GIN (ai_analysis);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
```

### 3. Klicke auf "Run"

### 4. Teste den Upload
- Gehe zu: http://localhost:3002/document-vault
- Lade ein Dokument hoch
- Es sollte jetzt funktionieren!

## Was das Script macht:
- ✅ Erstellt eine einfache `documents` Tabelle
- ✅ Speichert AI-Analyse in `ai_analysis` JSONB Feld
- ✅ Verwendet Supabase Storage (nicht BYTEA)
- ✅ RLS-Policies für Sicherheit
- ✅ Alle notwendigen Indizes

## Nach dem Fix:
- Upload funktioniert ✅
- AI-Klassifizierung wird gespeichert ✅
- Download funktioniert weiterhin ✅
- Keine komplexen Datenbank-Änderungen nötig ✅
