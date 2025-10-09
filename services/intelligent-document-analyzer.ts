import { DocumentDatabase, DocumentType } from './document-database';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export interface IntelligentAnalysisResult {
  documentType: string;
  confidence: number;
  tags: string[];
  description: string;
  language: string;
  isSwissDocument: boolean;
  analysisMethod: 'database' | 'ai' | 'hybrid';
  reasoning: string;
}

export class IntelligentDocumentAnalyzer {
  private model = genAI.getGenerativeModel({ model: "gemini-pro" });

  async analyzeDocument(fileName: string): Promise<IntelligentAnalysisResult> {
    try {
      console.log('🧠 Starting intelligent document analysis for:', fileName);

      // Step 1: Database Analysis (Primary Method)
      const dbResult = DocumentDatabase.findBestMatch(fileName);
      
      // If database gives high confidence, use it
      if (dbResult.confidence > 0.8 && dbResult.id !== 'unknown') {
        console.log('✅ High confidence database match found');
        return {
          documentType: dbResult.name,
          confidence: dbResult.confidence,
          tags: dbResult.tags,
          description: dbResult.description,
          language: this.detectLanguage(fileName),
          isSwissDocument: this.isSwissDocument(fileName, dbResult),
          analysisMethod: 'database',
          reasoning: `Matched based on filename patterns and keywords`
        };
      }

      // Step 2: AI Analysis (Fallback for uncertain cases)
      console.log('🤖 Database uncertain, using AI analysis...');
      const aiResult = await this.aiAnalysis(fileName);
      
      // Step 3: Hybrid Decision
      if (aiResult.confidence > 0.7) {
        console.log('✅ AI analysis provides good confidence');
        return {
          ...aiResult,
          analysisMethod: 'ai',
          reasoning: `AI analysis provided confident classification`
        };
      }

      // Step 4: Best Guess (Use database result even if uncertain)
      console.log('🎯 Using best database match as fallback');
      return {
        documentType: dbResult.name,
        confidence: Math.max(dbResult.confidence, 0.6), // Minimum 60% confidence
        tags: dbResult.tags,
        description: dbResult.description,
        language: this.detectLanguage(fileName),
        isSwissDocument: this.isSwissDocument(fileName, dbResult),
        analysisMethod: 'hybrid',
        reasoning: `Used database match as best available option (confidence: ${dbResult.confidence})`
      };

    } catch (error) {
      console.error('❌ Intelligent analysis failed:', error);
      
      // Ultimate fallback: database match
      const dbResult = DocumentDatabase.findBestMatch(fileName);
      return {
        documentType: dbResult.name,
        confidence: 0.5,
        tags: dbResult.tags,
        description: 'Analysis failed, using filename-based classification',
        language: 'unknown',
        isSwissDocument: false,
        analysisMethod: 'database',
        reasoning: 'Analysis failed, using database fallback'
      };
    }
  }

  private async aiAnalysis(fileName: string): Promise<Omit<IntelligentAnalysisResult, 'analysisMethod' | 'reasoning'>> {
    try {
      const prompt = `
        Analyze this filename and determine the most likely document type. Be confident in your assessment.

        Filename: ${fileName}

        Return a JSON object with this exact structure:
        {
          "documentType": "Passport/ID|Diplomas & Certificates|Employment Contract|Rental Agreement|Payroll|Invoices|Insurance Documents|Birth Certificate|Marriage Certificate|Residence Permit|Banking Documents|Tax Documents|Medical Documents|School Registration|Unknown Document",
          "confidence": 0.85,
          "tags": ["passport", "identity"],
          "description": "Brief description of the document",
          "language": "German|English|French|Italian|Multiple|unknown",
          "isSwissDocument": true
        }

        Be confident in your assessment. Even if uncertain, pick the most likely option.
        Return ONLY the JSON object, no additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }

    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw error;
    }
  }

  private detectLanguage(fileName: string): string {
    const fileNameLower = fileName.toLowerCase();
    
    // German indicators
    if (fileNameLower.includes('anmeldung') || fileNameLower.includes('arbeitsvertrag') || 
        fileNameLower.includes('mietvertrag') || fileNameLower.includes('versicherung')) {
      return 'German';
    }
    
    // French indicators
    if (fileNameLower.includes('inscription') || fileNameLower.includes('contrat') || 
        fileNameLower.includes('assurance') || fileNameLower.includes('facture')) {
      return 'French';
    }
    
    // Italian indicators
    if (fileNameLower.includes('iscrizione') || fileNameLower.includes('contratto') || 
        fileNameLower.includes('assicurazione') || fileNameLower.includes('fattura')) {
      return 'Italian';
    }
    
    return 'unknown';
  }

  private isSwissDocument(fileName: string, docType: DocumentType): boolean {
    const fileNameLower = fileName.toLowerCase();
    
    // Swiss-specific indicators
    const swissIndicators = [
      'chf', 'swiss', 'schweiz', 'suisse', 'svizzera',
      'zürich', 'zurich', 'basel', 'bern', 'geneva', 'genève',
      'lausanne', 'winterthur', 'luzern', 'st. gallen',
      'bundesamt', 'gemeinde', 'kanton', 'canton'
    ];
    
    for (const indicator of swissIndicators) {
      if (fileNameLower.includes(indicator)) {
        return true;
      }
    }
    
    // Swiss document types
    const swissDocumentTypes = ['residence', 'school_registration', 'employment'];
    if (swissDocumentTypes.includes(docType.id)) {
      return true;
    }
    
    return false;
  }
}
