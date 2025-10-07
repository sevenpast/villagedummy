
import { GoogleGenerativeAI } from '@google/generative-ai';

// Re-using the existing interface for consistency
export interface EnhancedAnalysisResult {
  documentType: string;
  tags: string[];
  confidence: number;
  description: string;
  language: string;
  isSwissDocument: boolean;
  extractedText: string;
  analysisMetadata: {
    ocrConfidence: number; // This will be the same as the overall confidence
    preprocessingApplied: boolean;
    lowConfidenceWords: string[]; // This will be empty as we get it all in one go
    analysisMethod: 'direct';
  };
}

class DirectAnalysisService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    );
  }

  /**
   * Performs OCR and document analysis in a single call to Gemini.
   * This is the most efficient and recommended method.
   */
  async analyzeDocument(
    imageBuffer: Buffer,
    fileName: string
  ): Promise<EnhancedAnalysisResult> {
    console.log('🚀 Starting direct analysis (single-call OCR + Analysis)...');
    
    // Using gemini-1.5-pro for potentially higher accuracy. 
    // If cost/speed is an issue, this can be switched back to gemini-1.5-flash.
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const prompt = `
**Rolle:** Du bist ein hochintelligenter Dokumenten-Analyse-Service, der darauf spezialisiert ist, Dokumente für Expatriates in der Schweiz zu verarbeiten.

**Kontext:** Ein Benutzer hat ein Dokument (als Bild) hochgeladen. Deine Aufgabe ist es, dieses Dokument in einem einzigen Schritt zu analysieren.

**Aufgabe:**
1.  **Texterkennung (OCR):** Extrahiere den gesamten sichtbaren Text aus dem Bild.
2.  **Dokumenten-Identifikation:** Analysiere den extrahierten Text und das Layout, um die Art des Dokuments zu bestimmen.
3.  **Kategorisierung:** Wähle EINEN der folgenden vordefinierten Typen, der am besten passt:
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
4.  **Spracherkennung:** Bestimme die Hauptsprache des Dokuments (DE, FR, IT, oder EN).
5.  **Schweiz-Bezug:** Schätze ein, ob es sich um ein typisches Schweizer Dokument handelt (true/false).
6.  **Konfidenz:** Gib eine Gesamt-Konfidenz für deine Analyse von 0.0 bis 1.0 an.
7.  **Antwortformat:** Gib deine Antwort AUSSCHLIESSLICH im folgenden JSON-Format zurück. Füge keine Kommentare oder Markdown hinzu.

**Wichtige Regeln:**
- Deine Antwort MUSS valides JSON sein.
- Der 'documentType' MUSS exakt einer der oben genannten Optionen entsprechen.
- Sei gründlich bei der Textextraktion.

**Gewünschtes JSON-Format:**
{
  "documentType": "Der am besten passende Typ aus der vordefinierten Liste.",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.9,
  "description": "Eine prägnante Zusammenfassung des Dokumenteninhalts (max. 25 Wörter).",
  "language": "DE",
  "isSwissDocument": true,
  "extractedText": "Der vollständige, von dir extrahierte Text des Dokuments."
}
`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: 'image/png',
          },
        },
      ]);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Direct analysis response did not contain valid JSON.', text);
        throw new Error('No valid JSON found in direct analysis response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        documentType: analysis.documentType || 'Unbekanntes Dokument',
        tags: Array.isArray(analysis.tags) ? analysis.tags : ['unrecognized'],
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
        description: analysis.description || `Direct analysis: ${analysis.documentType || 'Unknown'}`,
        language: analysis.language || 'DE',
        isSwissDocument: typeof analysis.isSwissDocument === 'boolean' ? analysis.isSwissDocument : true,
        extractedText: analysis.extractedText || '',
        analysisMetadata: {
          ocrConfidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
          preprocessingApplied: false, // Preprocessing can be added later if needed
          lowConfidenceWords: [],
          analysisMethod: 'direct',
        },
      };
    } catch (error) {
      console.error('❌ Direct analysis failed:', error);
      // In case of failure, return a structured error response
      return {
        documentType: 'Unbekanntes Dokument',
        tags: ['error'],
        confidence: 0.1,
        description: 'The document analysis failed due to an internal error.',
        language: 'DE',
        isSwissDocument: false,
        extractedText: `Analysis failed for file: ${fileName}. Error: ${error.message}`,
        analysisMetadata: {
          ocrConfidence: 0,
          preprocessingApplied: false,
          lowConfidenceWords: [],
          analysisMethod: 'direct',
        },
      };
    }
  }
}

export const directAnalysisService = new DirectAnalysisService();
