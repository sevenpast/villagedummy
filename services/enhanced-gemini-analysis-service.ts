import { GoogleGenerativeAI } from '@google/generative-ai';
import { OCRResult, StructuredOCRResult, OCRWord } from './enhanced-ocr-service';

export interface EnhancedAnalysisResult {
  documentType: string;
  tags: string[];
  confidence: number;
  description: string;
  language: string;
  isSwissDocument: boolean;
  extractedText: string;
  analysisMetadata: {
    ocrConfidence: number;
    preprocessingApplied: boolean;
    lowConfidenceWords: string[];
    analysisMethod: 'simple' | 'confidence_aware' | 'structured';
  };
}

export class EnhancedGeminiAnalysisService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    );
  }

  /**
   * Method 1: Simple text analysis (current approach)
   */
  async analyzeSimpleText(extractedText: string, fileName: string): Promise<EnhancedAnalysisResult> {
    console.log('🔍 Method 1: Simple text analysis');
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
**Rolle:** Du bist ein intelligenter Dokumentenanalyse- und Kategorisierungs-Service.

**Kontext:** Ein Nutzer hat das folgende Dokument hochgeladen. Ich stelle dir den extrahierten Textinhalt zur Verfügung.

**Aufgabe:**
1. Analysiere den Text und identifiziere die Art des Dokuments
2. Wähle aus der untenstehenden Liste den am besten passenden Tag aus
3. Bestimme die Hauptsprache des Dokuments (DE, FR, IT, EN)
4. Schätze ein, ob es sich um ein typisches Schweizer Dokument handelt (true/false)
5. Gib deine Antwort ausschliesslich im JSON-Format zurück

**Vordefinierte Tag-Liste (wähle EINEN):**
- Arbeitsvertrag
- Mietvertrag
- Diplome & Zertifikate
- Reisepass/ID
- Lohnabrechnung
- Rechnungen
- Versicherungsunterlagen
- Geburtsurkunde
- Heiratsurkunde
- Aufenthaltsbewilligung
- Bankdokumente
- Steuerdokumente
- Medizinische Dokumente
- Unbekanntes Dokument

**Extrahierter Textinhalt:**
---
${extractedText}
---

**Gewünschtes JSON-Format:**
{
  "documentType": "Der am besten passende Tag aus der vordefinierten Liste.",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.0,
  "description": "Eine kurze Beschreibung des Dokumenteninhalts (max. 20 Wörter).",
  "language": "DE",
  "isSwissDocument": true
}
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        return {
          documentType: analysis.documentType || 'Unbekanntes Dokument',
          tags: Array.isArray(analysis.tags) ? analysis.tags : ['unrecognized'],
          confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
          description: analysis.description || `Simple analysis: ${analysis.documentType || 'Unknown'}`,
          language: analysis.language || 'DE',
          isSwissDocument: typeof analysis.isSwissDocument === 'boolean' ? analysis.isSwissDocument : true,
          extractedText,
          analysisMetadata: {
            ocrConfidence: 1.0, // Assume perfect OCR for simple method
            preprocessingApplied: false,
            lowConfidenceWords: [],
            analysisMethod: 'simple'
          }
        };
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('❌ Simple analysis failed:', error);
      throw error;
    }
  }

  /**
   * Method 2: Confidence-aware analysis (NEW - your recommendation)
   */
  async analyzeWithConfidence(ocrResult: OCRResult, fileName: string): Promise<EnhancedAnalysisResult> {
    console.log('🔍 Method 2: Confidence-aware analysis');
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Identify low-confidence words
    const lowConfidenceWords = ocrResult.words
      .filter(word => word.confidence < 0.8)
      .map(word => word.text);

    const prompt = `
**Rolle:** Du bist ein intelligenter Dokumentenanalyse-Service mit OCR-Konfidenzbewertung.

**Kontext:** Ich gebe dir den von einer OCR-Engine extrahierten Text. Jedes Wort hat einen Konfidenzwert von 0 bis 1. Ein niedriger Wert bedeutet, dass die OCR unsicher war.

**Wichtige Regeln:**
- Sei besonders vorsichtig bei Wörtern mit einem Konfidenzwert unter 0.80
- Versuche, aus dem Kontext zu erraten, was unsichere Wörter bedeuten könnten
- Erwähne deine Unsicherheit bei der Analyse
- Nutze den Kontext, um OCR-Fehler zu korrigieren

**OCR-Daten:**
{
  "text": "${ocrResult.text}",
  "words": ${JSON.stringify(ocrResult.words)},
  "overallConfidence": ${ocrResult.confidence},
  "language": "${ocrResult.language}",
  "preprocessing": ${JSON.stringify(ocrResult.preprocessing)}
}

**Aufgabe:**
1. Analysiere den Text, um die Art des Dokuments zu bestimmen
2. Achte besonders auf Wörter mit niedriger Konfidenz
3. Wähle den passendsten Tag aus der Liste: [Arbeitsvertrag, Mietvertrag, Diplome & Zertifikate, Reisepass/ID, Lohnabrechnung, Rechnungen, Versicherungsunterlagen, Geburtsurkunde, Heiratsurkunde, Aufenthaltsbewilligung, Bankdokumente, Steuerdokumente, Medizinische Dokumente, Unbekanntes Dokument]
4. Gib deine Antwort im JSON-Format zurück

**JSON-Format:**
{
  "documentType": "Der am besten passende Tag",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.0,
  "description": "Beschreibung mit Hinweis auf OCR-Unsicherheiten",
  "language": "DE",
  "isSwissDocument": true,
  "ocrIssues": ["Liste von Wörtern mit niedriger Konfidenz"]
}
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        return {
          documentType: analysis.documentType || 'Unbekanntes Dokument',
          tags: Array.isArray(analysis.tags) ? analysis.tags : ['unrecognized'],
          confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
          description: analysis.description || `Confidence-aware analysis: ${analysis.documentType || 'Unknown'}`,
          language: analysis.language || 'DE',
          isSwissDocument: typeof analysis.isSwissDocument === 'boolean' ? analysis.isSwissDocument : true,
          extractedText: ocrResult.text,
          analysisMetadata: {
            ocrConfidence: ocrResult.confidence,
            preprocessingApplied: true,
            lowConfidenceWords,
            analysisMethod: 'confidence_aware'
          }
        };
      } else {
        throw new Error('No valid JSON found in confidence-aware response');
      }
    } catch (error) {
      console.error('❌ Confidence-aware analysis failed:', error);
      throw error;
    }
  }

  /**
   * Method 3: Structured analysis for complex layouts (ADVANCED - your recommendation)
   */
  async analyzeStructured(structuredResult: StructuredOCRResult, fileName: string): Promise<EnhancedAnalysisResult> {
    console.log('🔍 Method 3: Structured analysis for complex layouts');
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
**Rolle:** Du bist ein Experte für die Analyse von Dokumenten-Layouts mit strukturierten OCR-Daten.

**Kontext:** Ich gebe dir den JSON-Output einer OCR-Engine. Er enthält den Text und die exakten Koordinaten jedes Wortes auf der Seite, gruppiert in Blöcke und Absätze.

**Struktur-Erkennung:**
- Analysiere die Struktur und den Inhalt des Dokuments
- Achte auf Tabellen, Schlüssel-Wert-Paare (z.B. "Name: Andy Hablützel") und Überschriften
- Nutze die räumliche Anordnung der Wörter für bessere Erkennung
- Erkenne Layout-Patterns (Formulare, Tabellen, Listen)

**Strukturierte OCR-Daten:**
${JSON.stringify(structuredResult, null, 2)}

**Aufgabe:**
1. Analysiere die Struktur und den Inhalt des Dokuments
2. Nutze die räumliche Anordnung für bessere Erkennung
3. Bestimme auf Basis dieser Analyse die Art des Dokuments
4. Wähle den passendsten Tag aus der Liste: [Arbeitsvertrag, Mietvertrag, Diplome & Zertifikate, Reisepass/ID, Lohnabrechnung, Rechnungen, Versicherungsunterlagen, Geburtsurkunde, Heiratsurkunde, Aufenthaltsbewilligung, Bankdokumente, Steuerdokumente, Medizinische Dokumente, Unbekanntes Dokument]
5. Gib deine Antwort im JSON-Format zurück

**JSON-Format:**
{
  "documentType": "Der am besten passende Tag",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.0,
  "description": "Beschreibung mit Hinweis auf erkannte Struktur",
  "language": "DE",
  "isSwissDocument": true,
  "layoutAnalysis": {
    "hasTables": true,
    "hasKeyValuePairs": true,
    "structureType": "form|table|list|mixed"
  }
}
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Extract all text from structured result
        const allText = structuredResult.pages
          .flatMap(page => page.blocks)
          .flatMap(block => block.paragraphs)
          .flatMap(paragraph => paragraph.words)
          .map(word => word.text)
          .join(' ');

        return {
          documentType: analysis.documentType || 'Unbekanntes Dokument',
          tags: Array.isArray(analysis.tags) ? analysis.tags : ['unrecognized'],
          confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
          description: analysis.description || `Structured analysis: ${analysis.documentType || 'Unknown'}`,
          language: analysis.language || 'DE',
          isSwissDocument: typeof analysis.isSwissDocument === 'boolean' ? analysis.isSwissDocument : true,
          extractedText: allText,
          analysisMetadata: {
            ocrConfidence: structuredResult.overallConfidence,
            preprocessingApplied: true,
            lowConfidenceWords: [],
            analysisMethod: 'structured'
          }
        };
      } else {
        throw new Error('No valid JSON found in structured response');
      }
    } catch (error) {
      console.error('❌ Structured analysis failed:', error);
      throw error;
    }
  }
}

export const enhancedGeminiAnalysisService = new EnhancedGeminiAnalysisService();
