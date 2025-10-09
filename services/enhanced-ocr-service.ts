import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export interface OCRResult {
  text: string;
  confidence: number;
  layout: {
    blocks: Array<{
      text: string;
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
  };
  images: Array<{
    description: string;
    confidence: number;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  metadata: {
    pageCount: number;
    language: string;
    documentType: string;
    hasImages: boolean;
    hasTables: boolean;
    hasForms: boolean;
  };
}

export class EnhancedOCRService {
  private model = genAI.getGenerativeModel({ model: "gemini-pro" });
  private fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  async analyzeDocument(file: File): Promise<OCRResult> {
    try {
      console.log('🔍 Starting enhanced OCR analysis for:', file.name);

      // Convert file to base64 for Gemini Vision
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = file.type;

      // Step 1: Comprehensive OCR Analysis with Gemini Vision
      const ocrPrompt = `
        Analyze this document comprehensively and extract ALL information. Provide detailed analysis in JSON format.

        Document: ${file.name}
        
        Please analyze and return a JSON object with the following structure:
        {
          "text": "All extracted text content",
          "confidence": 0.95,
          "layout": {
            "blocks": [
              {
                "text": "Text content of this block",
                "confidence": 0.9,
                "boundingBox": {"x": 100, "y": 200, "width": 300, "height": 50}
              }
            ]
          },
          "images": [
            {
              "description": "Description of image content",
              "confidence": 0.8,
              "position": {"x": 50, "y": 100, "width": 200, "height": 150}
            }
          ],
          "metadata": {
            "pageCount": 1,
            "language": "German/English/French/Italian",
            "documentType": "passport/contract/certificate/invoice/etc",
            "hasImages": true/false,
            "hasTables": true/false,
            "hasForms": true/false
          }
        }

        IMPORTANT:
        - Extract ALL visible text, including headers, labels, values, signatures
        - Identify all images, logos, stamps, signatures
        - Determine document structure (forms, tables, paragraphs)
        - Detect language(s) used
        - Provide confidence scores for each element
        - Be thorough and accurate
      `;

      let result;
      try {
        result = await this.model.generateContent([
          ocrPrompt,
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          }
        ]);
      } catch (modelError) {
        console.log('⚠️ Primary model failed, trying fallback model...');
        result = await this.fallbackModel.generateContent([
          ocrPrompt,
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          }
        ]);
      }

      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      let ocrData: OCRResult;
      try {
        // Extract JSON from response (handle markdown formatting)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          ocrData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse OCR JSON:', parseError);
        // Fallback: create basic structure
        ocrData = {
          text: text,
          confidence: 0.7,
          layout: { blocks: [] },
          images: [],
          metadata: {
            pageCount: 1,
            language: 'unknown',
            documentType: 'unknown',
            hasImages: false,
            hasTables: false,
            hasForms: false
          }
        };
      }

      console.log('✅ Enhanced OCR analysis completed:', {
        textLength: ocrData.text.length,
        blocks: ocrData.layout.blocks.length,
        images: ocrData.images.length,
        confidence: ocrData.confidence
      });

      return ocrData;

    } catch (error) {
      console.error('❌ Enhanced OCR analysis failed:', error);
      
      // Fallback: Simple text extraction without vision
      console.log('🔄 Trying simple text extraction fallback...');
      try {
        const simpleText = await this.extractTextFromPDF(file);
        return {
          text: simpleText,
          confidence: 0.5,
          layout: { blocks: [] },
          images: [],
          metadata: {
            pageCount: 1,
            language: 'unknown',
            documentType: 'unknown',
            hasImages: false,
            hasTables: false,
            hasForms: false
          }
        };
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw new Error(`OCR analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  async extractTextFromPDF(file: File): Promise<string> {
    try {
      // For PDFs, try to extract text directly first
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const textPrompt = `
        Extract all text content from this PDF document. Return only the extracted text, no formatting or explanations.
        
        Document: ${file.name}
      `;

      const result = await this.model.generateContent([
        textPrompt,
        {
          inlineData: {
            data: base64,
            mimeType: 'application/pdf'
          }
        }
      ]);

      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      return '';
    }
  }
}