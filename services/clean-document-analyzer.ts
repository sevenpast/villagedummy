import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Step 1: Quick filename analysis (fast, reliable)
    const filenameResult = this.analyzeFilename(file.name);
    if (filenameResult.confidence >= 0.8) {
      console.log('✅ High confidence filename match:', filenameResult.documentType);
      return filenameResult;
    }

    // Step 2: AI analysis if available (comprehensive)
    if (this.genAI) {
      try {
        const aiResult = await this.analyzeWithGemini(file);
        console.log('✅ AI analysis completed:', aiResult.documentType);
        return aiResult;
      } catch (error) {
        console.log('⚠️ AI analysis failed, using filename fallback:', error);
      }
    }

    // Step 3: Fallback to filename analysis
    console.log('📁 Using filename analysis as fallback');
    return filenameResult;
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

    if (lowerName.includes('anmeldung') || lowerName.includes('registration') || lowerName.includes('schule') || lowerName.includes('kindergarten')) {
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

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
**Role:** You are an intelligent document analysis service specialized in Swiss expat documents.

**Task:** Analyze this document image and provide a structured response.

**Document Types (choose ONE):**
- Reisepass/ID
- Diplome & Zertifikate  
- Arbeitsvertrag
- Mietvertrag
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

**Response Format (JSON only, no markdown):**
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

      // Parse JSON response
      const analysis = JSON.parse(text);
      
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
      console.error('Gemini analysis error:', error);
      throw new Error('AI analysis failed');
    }
  }
}

// Export singleton instance
export const cleanDocumentAnalyzer = new CleanDocumentAnalyzer();
