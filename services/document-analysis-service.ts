
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ocrPreprocessingService } from '../ocr-preprocessing-service';

// Analysis result interface
export interface AnalysisResult {
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
    analysisMethod: 'direct_v2';
  };
}

class DocumentAnalysisService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    );
  }

  /**
   * Performs preprocessing, OCR, and document analysis in a single, robust flow.
   */
  async analyze(
    imageBuffer: Buffer,
    fileName: string
  ): Promise<AnalysisResult> {
    console.log('🚀 Starting V2 analysis pipeline...');

    try {
      // Step 1: Preprocess the image for optimal OCR quality.
      const preprocessingResult = await ocrPreprocessingService.preprocessImage(
        imageBuffer
      );

      // Step 2: Send the preprocessed image to Gemini for analysis.
      console.log('🤖 Sending preprocessed image to Gemini 1.5 Pro...');
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

      const prompt = `
**Rolle:** Du bist ein hochintelligenter Dokumenten-Analyse-Service, der darauf spezialisiert ist, Dokumente für Expatriates in der Schweiz zu verarbeiten.

**Kontext:** Ein Benutzer hat ein Dokument (als Bild) hochgeladen. Das Bild wurde bereits vorverarbeitet (begradigt, entrauscht, optimiert), um die Lesbarkeit zu maximieren. Deine Aufgabe ist es, dieses Dokument in einem einzigen Schritt zu analysieren.

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
6.  **Konfidenz:** Gib eine Gesamt-Konfidenz für deine Analyse von 0.0 bis 1.0 an. Sei bei deiner Einschätzung eher konservativ.
7.  **Antwortformat:** Gib deine Antwort AUSSCHLIESSLICH im folgenden JSON-Format zurück. Füge keine Kommentare oder Markdown hinzu.

**Wichtige Regeln:**
- Deine Antwort MUSS valides JSON sein.
- Der 'documentType' MUSS exakt einer der oben genannten Optionen entsprechen. Wenn du dir absolut unsicher bist, wähle "Unbekanntes Dokument".
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

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: preprocessingResult.processedImageBuffer.toString('base64'),
            mimeType: 'image/png',
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('V2 Analysis: Response did not contain valid JSON.', text);
        throw new Error('No valid JSON found in V2 analysis response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      console.log('✅ V2 Analysis successful.');

      return {
        documentType: analysis.documentType || 'Unbekanntes Dokument',
        tags: Array.isArray(analysis.tags) ? analysis.tags : ['unrecognized'],
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.4, // Default to lower confidence
        description: analysis.description || `V2 analysis: ${analysis.documentType || 'Unknown'}`,
        language: analysis.language || 'DE',
        isSwissDocument: typeof analysis.isSwissDocument === 'boolean' ? analysis.isSwissDocument : false,
        extractedText: analysis.extractedText || '',
        analysisMetadata: {
          ocrConfidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.4,
          preprocessingApplied: true,
          analysisMethod: 'direct_v2',
        },
      };
    } catch (error) {
      console.error('❌ V2 analysis pipeline failed:', error);
      // Return a structured error response
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
          analysisMethod: 'direct_v2',
        },
      };
    }
  }
}

export const documentAnalysisService = new DocumentAnalysisService();
