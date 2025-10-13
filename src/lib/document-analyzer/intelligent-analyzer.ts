import { DocumentDatabase, DocumentType } from './document-database';

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

      // Step 2: Best Guess (Use database result even if uncertain)
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

// Export singleton instance
export const intelligentDocumentAnalyzer = new IntelligentDocumentAnalyzer();
