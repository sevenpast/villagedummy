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
          description: 'AI analysis failed: ' + (error as Error).message,
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
   * AI-powered analysis using Gemini 2.5 Flash with optimized OCR
   */
  private async analyzeWithGemini(file: File): Promise<DocumentAnalysisResult> {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    // Use Gemini 2.5 Flash for best performance and accuracy
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    console.log('✅ Using Gemini 2.5 Flash for document analysis');

    // Step 1: Enhanced OCR text extraction from PDF
    let extractedText = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const formFields = pdfDoc.getForm().getFields();
      
      // Extract form field names and values
      let formText = '';
      formFields.forEach(field => {
        const fieldName = field.getName();
        if (fieldName && fieldName !== 'undefined' && !fieldName.startsWith('undefined_')) {
          formText += fieldName + ' ';
        }
      });
      
      extractedText = `PDF with ${pages.length} pages. Form fields: ${formText}`;
      console.log('📄 Enhanced OCR extracted:', extractedText);
    } catch (error) {
      console.log('⚠️ Enhanced OCR failed, using basic analysis:', error);
      extractedText = 'PDF document analysis';
    }

    // Step 2: Convert file to base64 for visual analysis
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const fileName = file.name;
    const prompt = `You are an expert Swiss document classifier with 90%+ accuracy. Analyze this document using advanced OCR and visual recognition.

**Document Information:**
- Filename: ${fileName}
- OCR Text: ${extractedText}
- Document Image: [Provided as base64]

**Analysis Process:**
1. **Advanced OCR**: Extract ALL visible text from the document image
2. **Visual Recognition**: Identify headers, logos, stamps, form structure
3. **Context Analysis**: Combine filename, OCR text, and visual cues
4. **Swiss Document Classification**: Determine exact document type

**Swiss Document Categories (choose ONE with 90%+ confidence):**
- **Reisepass/ID** - Passport, ID card, travel documents
- **Aufenthaltsbewilligung** - Residence permit, visa, work permit  
- **Arbeitsvertrag** - Employment contract, work agreement
- **Mietvertrag** - Rental agreement, lease contract
- **Versicherung** - Health insurance, liability insurance
- **Steuer** - Tax documents, tax returns
- **Schule/Kindergarten** - School registration, kindergarten forms
- **Gemeinde** - Municipality registration, address change
- **Bank** - Bank documents, account statements
- **Familie** - Marriage certificate, birth certificate, family documents
- **Diplome & Zertifikate** - Diplomas, certificates, qualifications
- **Medizinisch** - Medical documents, prescriptions, health records
- **Rechtlich** - Legal documents, contracts, agreements
- **Sonstiges** - Other documents not fitting above categories

**Key Recognition Patterns:**
- "Anmeldung", "Schule", "Kindergarten", "Name", "Vorname", "Geburtsdatum" → Schule/Kindergarten
- "Passport", "Reisepass", "ID", "Ausweis" → Reisepass/ID
- "Diplom", "Zeugnis", "Zertifikat", "Certificate" → Diplome & Zertifikate
- "Arbeitsvertrag", "Contract", "Employment" → Arbeitsvertrag
- "Mietvertrag", "Rental", "Lease" → Mietvertrag
- "Versicherung", "Insurance", "Krankenkasse" → Versicherung
- "Steuer", "Tax", "Finanzamt" → Steuer
- "Bank", "Konto", "Account" → Bank
- "Geburt", "Birth", "Geburtsurkunde" → Familie
- "Heirat", "Marriage", "Heiratsurkunde" → Familie

**Response Requirements:**
- Return ONLY valid JSON, no markdown, no code blocks
- Start with { and end with }
- No backtick wrappers
- High confidence (0.8-1.0) for accurate classifications

**Required JSON Format:**
{
  "documentType": "exact category from list above",
  "confidence": 0.95,
  "tags": ["relevant", "tags", "based", "on", "content"],
  "description": "Brief description of document content and purpose",
  "language": "DE|FR|IT|EN",
  "isSwissDocument": true,
  "extractedText": "ALL visible text extracted from document image"
}`;

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
      const codeBlockMarker = String.fromCharCode(96, 96, 96);
      if (cleanText.startsWith(codeBlockMarker + 'json')) {
        cleanText = cleanText.replace(new RegExp('^' + codeBlockMarker + 'json\\s*'), '').replace(new RegExp('\\s*' + codeBlockMarker + '$'), '');
      } else if (cleanText.startsWith(codeBlockMarker)) {
        cleanText = cleanText.replace(new RegExp('^' + codeBlockMarker + '\\s*'), '').replace(new RegExp('\\s*' + codeBlockMarker + '$'), '');
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
      throw new Error('AI analysis failed: ' + (error as Error).message);
    }
  }
}

// Export singleton instance
export const cleanDocumentAnalyzer = new CleanDocumentAnalyzer();
