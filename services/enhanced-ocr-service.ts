import { GoogleGenerativeAI } from '@google/generative-ai';
import { ocrPreprocessingService, PreprocessingResult } from './ocr-preprocessing-service';

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRResult {
  text: string;
  words: OCRWord[];
  confidence: number;
  language: string;
  preprocessing: PreprocessingResult['metadata'];
}

export interface StructuredOCRResult {
  pages: Array<{
    blocks: Array<{
      paragraphs: Array<{
        words: OCRWord[];
        confidence: number;
      }>;
      confidence: number;
    }>;
    confidence: number;
  }>;
  overallConfidence: number;
  preprocessing: PreprocessingResult['metadata'];
}

export class EnhancedOCRService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    );
  }

  /**
   * Enhanced OCR with preprocessing and confidence scores
   */
  async extractTextWithConfidence(imageBuffer: Buffer): Promise<OCRResult> {
    console.log('🔍 Starting enhanced OCR with confidence scores...');

    try {
      // Step 1: Preprocessing
      const preprocessingResult = await ocrPreprocessingService.preprocessImage(imageBuffer);
      console.log('✅ Preprocessing completed');

      // Step 2: OCR with Gemini Vision
      const ocrResult = await this.performGeminiOCR(preprocessingResult.processedImageBuffer);
      console.log('✅ Gemini OCR completed');

      return {
        text: ocrResult.text,
        words: ocrResult.words,
        confidence: ocrResult.confidence,
        language: ocrResult.language,
        preprocessing: preprocessingResult.metadata
      };

    } catch (error) {
      console.error('❌ Enhanced OCR failed:', error);
      
      // Fallback to simple text extraction
      return this.fallbackTextExtraction(imageBuffer);
    }
  }

  /**
   * Structured OCR for complex layouts (tables, forms)
   */
  async extractStructuredText(imageBuffer: Buffer): Promise<StructuredOCRResult> {
    console.log('🏗️ Starting structured OCR for complex layouts...');

    try {
      // Step 1: Preprocessing
      const preprocessingResult = await ocrPreprocessingService.preprocessImage(imageBuffer);
      console.log('✅ Preprocessing completed');

      // Step 2: Structured OCR with Gemini Vision
      const structuredResult = await this.performStructuredGeminiOCR(preprocessingResult.processedImageBuffer);
      console.log('✅ Structured Gemini OCR completed');

      return {
        pages: structuredResult.pages,
        overallConfidence: structuredResult.overallConfidence,
        preprocessing: preprocessingResult.metadata
      };

    } catch (error) {
      console.error('❌ Structured OCR failed:', error);
      
      // Fallback to simple OCR
      const simpleResult = await this.extractTextWithConfidence(imageBuffer);
      return {
        pages: [{
          blocks: [{
            paragraphs: [{
              words: simpleResult.words,
              confidence: simpleResult.confidence
            }],
            confidence: simpleResult.confidence
          }],
          confidence: simpleResult.confidence
        }],
        overallConfidence: simpleResult.confidence,
        preprocessing: simpleResult.preprocessing
      };
    }
  }

  /**
   * Perform OCR using Gemini Vision with confidence scores
   */
  private async performGeminiOCR(imageBuffer: Buffer): Promise<{
    text: string;
    words: OCRWord[];
    confidence: number;
    language: string;
  }> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
**Rolle:** Du bist ein hochpräziser OCR-Service mit Konfidenzbewertung.

**Aufgabe:** 
1. Extrahiere ALLEN Text aus dem Bild
2. Für jedes Wort: Gib einen Konfidenzwert von 0.0 bis 1.0 an
3. Bestimme die Sprache des Dokuments
4. Gib die Position jedes Wortes an (x, y, width, height)

**Wichtige Regeln:**
- Konfidenz 0.9-1.0: Klar lesbar, perfekte Qualität
- Konfidenz 0.7-0.9: Gut lesbar, kleine Unsicherheiten
- Konfidenz 0.5-0.7: Lesbar, aber unsicher
- Konfidenz 0.3-0.5: Schwierig lesbar, viele Unsicherheiten
- Konfidenz 0.0-0.3: Sehr unsicher oder unlesbar

**Antwortformat (JSON):**
{
  "text": "Vollständiger extrahierter Text",
  "words": [
    {
      "text": "Wort",
      "confidence": 0.95,
      "boundingBox": {
        "x": 100,
        "y": 50,
        "width": 40,
        "height": 20
      }
    }
  ],
  "confidence": 0.85,
  "language": "DE"
}
`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: 'image/png'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Gemini OCR raw response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          text: parsed.text || '',
          words: parsed.words || [],
          confidence: parsed.confidence || 0.5,
          language: parsed.language || 'DE'
        };
      } else {
        throw new Error('No valid JSON found in Gemini response');
      }

    } catch (error) {
      console.error('❌ Gemini OCR failed:', error);
      throw error;
    }
  }

  /**
   * Perform structured OCR for complex layouts
   */
  private async performStructuredGeminiOCR(imageBuffer: Buffer): Promise<{
    pages: Array<{
      blocks: Array<{
        paragraphs: Array<{
          words: OCRWord[];
          confidence: number;
        }>;
        confidence: number;
      }>;
      confidence: number;
    }>;
    overallConfidence: number;
  }> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
**Rolle:** Du bist ein Experte für strukturierte Dokumentenanalyse.

**Aufgabe:** 
1. Analysiere die Struktur des Dokuments (Absätze, Tabellen, Spalten)
2. Extrahiere Text mit Konfidenzwerten
3. Erkenne Layout-Elemente (Überschriften, Tabellen, Schlüssel-Wert-Paare)
4. Gruppiere Wörter in logische Blöcke und Absätze

**Struktur-Erkennung:**
- Erkenne Tabellen und behalte Spaltenstruktur bei
- Identifiziere Schlüssel-Wert-Paare (z.B. "Name: Andy Hablützel")
- Gruppiere verwandte Informationen
- Erkenne Überschriften und Absätze

**Antwortformat (JSON):**
{
  "pages": [
    {
      "blocks": [
        {
          "paragraphs": [
            {
              "words": [
                {
                  "text": "Wort",
                  "confidence": 0.95,
                  "boundingBox": {
                    "x": 100,
                    "y": 50,
                    "width": 40,
                    "height": 20
                  }
                }
              ],
              "confidence": 0.90
            }
          ],
          "confidence": 0.90
        }
      ],
      "confidence": 0.90
    }
  ],
  "overallConfidence": 0.90
}
`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: 'image/png'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Gemini Structured OCR raw response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          pages: parsed.pages || [],
          overallConfidence: parsed.overallConfidence || 0.5
        };
      } else {
        throw new Error('No valid JSON found in Gemini structured response');
      }

    } catch (error) {
      console.error('❌ Gemini Structured OCR failed:', error);
      throw error;
    }
  }

  /**
   * Fallback text extraction when advanced OCR fails
   */
  private fallbackTextExtraction(imageBuffer: Buffer): OCRResult {
    console.log('⚠️ Using fallback text extraction');
    
    return {
      text: 'Text extraction failed - using fallback',
      words: [{
        text: 'fallback',
        confidence: 0.1,
        boundingBox: { x: 0, y: 0, width: 100, height: 20 }
      }],
      confidence: 0.1,
      language: 'DE',
      preprocessing: {
        originalSize: { width: 0, height: 0 },
        processedSize: { width: 0, height: 0 },
        deskewAngle: 0,
        binarizationThreshold: 128,
        noiseRemoved: false,
        scalingFactor: 1
      }
    };
  }
}

export const enhancedOCRService = new EnhancedOCRService();
