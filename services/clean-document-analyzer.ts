import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';

export interface DocumentAnalysisResult {
  documentType: string;
  confidence: number;
  tags: string[];
  description: string;
  language: string;
  isSwissDocument: boolean;
  extractedText: string;
}

export class CleanDocumentAnalyzer {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Main analysis method - clean and simple
   */
  async analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
    console.log('🔍 Starting clean document analysis for:', file.name);

    // Direct AI analysis using Gemini 2.0 (OCR + AI only)
    if (this.genAI) {
      try {
        const aiResult = await this.analyzeWithGemini(file);
        console.log('✅ AI analysis completed:', aiResult.documentType);
        return aiResult;
      } catch (error) {
        console.error('❌ AI analysis failed:', error);
        // Return error result instead of filename fallback
        return {
          documentType: 'Unbekanntes Dokument',
          confidence: 0.1,
          tags: ['error', 'ai-failed'],
          description: `AI analysis failed: ${(error as Error).message}`,
          extractedText: '',
          language: 'unknown',
          isSwissDocument: false,
        };
      }
    }

    // No AI available
    return {
      documentType: 'Unbekanntes Dokument',
      confidence: 0.1,
      tags: ['error', 'no-ai'],
      description: 'AI analysis not available',
      extractedText: '',
      language: 'unknown',
      isSwissDocument: false,
    };
  }

  /**
   * Fast filename-based analysis
   */
  private analyzeFilename(fileName: string): DocumentAnalysisResult {
    const lowerName = fileName.toLowerCase();
    
    // High confidence patterns
    if (lowerName.includes('pass') || lowerName.includes('reisepass')) {
      return {
        documentType: 'Reisepass/ID',
        confidence: 0.95,
        tags: ['passport', 'id', 'travel'],
        description: 'Passport or ID document',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('diplom') || lowerName.includes('zeugnis') || lowerName.includes('zertifikat') || lowerName.includes('certificate')) {
      return {
        documentType: 'Diplome & Zertifikate',
        confidence: 0.9,
        tags: ['education', 'certificate', 'diploma'],
        description: 'Educational certificate or diploma',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('arbeitsvertrag') || lowerName.includes('contract')) {
      return {
        documentType: 'Arbeitsvertrag',
        confidence: 0.9,
        tags: ['employment', 'contract', 'work'],
        description: 'Employment contract',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('mietvertrag') || lowerName.includes('rental')) {
      return {
        documentType: 'Mietvertrag',
        confidence: 0.9,
        tags: ['housing', 'rental', 'contract'],
        description: 'Rental agreement',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('lohn') || lowerName.includes('salary') || lowerName.includes('payroll')) {
      return {
        documentType: 'Lohnabrechnung',
        confidence: 0.9,
        tags: ['salary', 'payroll', 'employment'],
        description: 'Salary statement',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('rechnung') || lowerName.includes('invoice')) {
      return {
        documentType: 'Rechnungen',
        confidence: 0.9,
        tags: ['invoice', 'billing', 'payment'],
        description: 'Invoice or bill',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('versicherung') || lowerName.includes('insurance')) {
      return {
        documentType: 'Versicherungsunterlagen',
        confidence: 0.9,
        tags: ['insurance', 'coverage', 'policy'],
        description: 'Insurance documents',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('geburt') || lowerName.includes('birth')) {
      return {
        documentType: 'Geburtsurkunde',
        confidence: 0.9,
        tags: ['birth', 'certificate', 'personal'],
        description: 'Birth certificate',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('heirat') || lowerName.includes('marriage')) {
      return {
        documentType: 'Heiratsurkunde',
        confidence: 0.9,
        tags: ['marriage', 'certificate', 'personal'],
        description: 'Marriage certificate',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('aufenthalt') || lowerName.includes('permit')) {
      return {
        documentType: 'Aufenthaltsbewilligung',
        confidence: 0.9,
        tags: ['residence', 'permit', 'immigration'],
        description: 'Residence permit',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('bank') || lowerName.includes('konto')) {
      return {
        documentType: 'Bankdokumente',
        confidence: 0.9,
        tags: ['banking', 'account', 'financial'],
        description: 'Banking documents',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('steuer') || lowerName.includes('tax')) {
      return {
        documentType: 'Steuerdokumente',
        confidence: 0.9,
        tags: ['tax', 'financial', 'government'],
        description: 'Tax documents',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('medizin') || lowerName.includes('medical') || lowerName.includes('arzt')) {
      return {
        documentType: 'Medizinische Dokumente',
        confidence: 0.9,
        tags: ['medical', 'health', 'doctor'],
        description: 'Medical documents',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    // Medium confidence patterns
    if (lowerName.includes('cv') || lowerName.includes('resume') || lowerName.includes('lebenslauf')) {
      return {
        documentType: 'Diplome & Zertifikate',
        confidence: 0.7,
        tags: ['cv', 'resume', 'career'],
        description: 'CV or resume document',
        language: 'DE',
        isSwissDocument: false,
        extractedText: ''
      };
    }

    if (lowerName.includes('anmeldung') || lowerName.includes('registration') || lowerName.includes('schule') || lowerName.includes('kindergarten') || lowerName.includes('form')) {
      return {
        documentType: 'Rechnungen',
        confidence: 0.8,
        tags: ['registration', 'school', 'form'],
        description: 'Registration or school form',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('arbeitszeugnis') || lowerName.includes('work') || lowerName.includes('employment')) {
      return {
        documentType: 'Arbeitsvertrag',
        confidence: 0.8,
        tags: ['work', 'employment', 'reference'],
        description: 'Work reference or employment document',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('krankenkasse') || lowerName.includes('health') || lowerName.includes('versicherung')) {
      return {
        documentType: 'Versicherungsunterlagen',
        confidence: 0.8,
        tags: ['insurance', 'health', 'coverage'],
        description: 'Health insurance document',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('steuer') || lowerName.includes('tax') || lowerName.includes('finanzamt')) {
      return {
        documentType: 'Steuerdokumente',
        confidence: 0.8,
        tags: ['tax', 'financial', 'government'],
        description: 'Tax document',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    if (lowerName.includes('bank') || lowerName.includes('konto') || lowerName.includes('finanz')) {
      return {
        documentType: 'Bankdokumente',
        confidence: 0.8,
        tags: ['banking', 'account', 'financial'],
        description: 'Banking document',
        language: 'DE',
        isSwissDocument: true,
        extractedText: ''
      };
    }

    // Low confidence fallback
    return {
      documentType: 'Unbekanntes Dokument',
      confidence: 0.3,
      tags: ['unknown'],
      description: 'Unknown document type',
      language: 'DE',
      isSwissDocument: false,
      extractedText: ''
    };
  }

  /**
   * AI-powered analysis using Gemini
   */
  private async analyzeWithGemini(file: File): Promise<DocumentAnalysisResult> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    // Try different Gemini models in order of preference
    let model;
    const modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    
    for (const modelName of modelsToTry) {
      try {
        model = this.genAI.getGenerativeModel({ model: modelName });
        console.log(`✅ Using Gemini model: ${modelName}`);
        break;
      } catch (error) {
        console.log(`❌ Model ${modelName} not available:`, error);
        continue;
      }
    }
    
    if (!model) {
      throw new Error('No Gemini model available');
    }

    // Step 1: Extract text from PDF using pdf-lib
    let extractedText = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      // Extract text from all pages
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // Note: pdf-lib doesn't have built-in text extraction, but we can get basic info
        extractedText += `Page ${i + 1}: PDF Document\n`;
      }
      
      console.log(`📄 Extracted basic info from ${pages.length} pages`);
    } catch (error) {
      console.log('⚠️ PDF text extraction failed, using image analysis:', error);
    }

    // Step 2: Convert file to base64 for image analysis
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const fileName = file.name;
    const prompt = `
**Role:** You are an intelligent document analysis service specialized in Swiss expat documents.

**Task:** Analyze this document image and provide a structured response.

**Available Information:**
- Filename: ` + fileName + `
- Basic PDF info: ` + (extractedText || 'No text extracted') + `
- Document image: [Provided as base64]

**Instructions:**
1. **Visual Analysis:** Carefully examine the document image to identify:
   - Headers, titles, and official stamps
   - Form fields and labels (Name, Vorname, Geburtsdatum, etc.)
   - Official logos or watermarks
   - Document structure and layout
2. **Text Recognition (OCR):** Extract ALL visible text from the image, including:
   - Headers and titles
   - Form field labels
   - Official text and stamps
   - Any handwritten or printed content
3. **Document Identification:** Based on the visual analysis and extracted text, determine the document type.

**Document Types (choose ONE):**
- Reisepass/ID (Passport/ID documents)
- Diplome & Zertifikate (Diplomas & Certificates)
- Arbeitsvertrag (Employment Contract)
- Mietvertrag (Rental Agreement)
- Lohnabrechnung (Payslip)
- Rechnungen (Invoices)
- Versicherungsunterlagen (Insurance Documents)
- Geburtsurkunde (Birth Certificate)
- Heiratsurkunde (Marriage Certificate)
- Aufenthaltsbewilligung (Residence Permit)
- Bankdokumente (Banking Documents)
- Steuerdokumente (Tax Documents)
- Medizinische Dokumente (Medical Documents)
- Unbekanntes Dokument (Unknown Document)

**Key Recognition Patterns:**
- If you see "Anmeldung", "Schule", "Kindergarten", "Name", "Vorname", "Geburtsdatum" → likely registration form
- If you see "Passport", "Reisepass", "ID", "Ausweis" → likely passport/ID document
- If you see "Diplom", "Zeugnis", "Zertifikat", "Certificate" → likely diploma/certificate
- If you see "Arbeitsvertrag", "Contract", "Employment" → likely employment contract

**CRITICAL: Response Format Requirements:**
- Return ONLY valid JSON, no markdown, no code blocks, no explanations
- Start directly with { and end with }
- No ```json or ``` wrappers
- No additional text before or after the JSON

**Required JSON Format:**
{
  "documentType": "exact type from list above",
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2", "tag3"],
  "description": "brief description (max 20 words)",
  "language": "DE|FR|IT|EN",
  "isSwissDocument": true|false,
  "extractedText": "all visible text from document"
}
`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse JSON response (handle markdown formatting)
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 Cleaned Gemini response:', cleanText);
      
      const analysis = JSON.parse(cleanText);
      
      return {
        documentType: analysis.documentType || 'Unbekanntes Dokument',
        confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
        tags: Array.isArray(analysis.tags) ? analysis.tags : ['unknown'],
        description: analysis.description || 'Document analysis completed',
        language: analysis.language || 'DE',
        isSwissDocument: Boolean(analysis.isSwissDocument),
        extractedText: analysis.extractedText || ''
      };
    } catch (error) {
      console.error('❌ Gemini analysis error:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      throw new Error(`AI analysis failed: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const cleanDocumentAnalyzer = new CleanDocumentAnalyzer();
