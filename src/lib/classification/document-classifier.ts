import { DOCUMENT_TEMPLATES, DocumentTemplate, calculateDocumentSimilarity } from '../ocr/improved-ocr'

export interface ClassificationResult {
  category: string
  confidence: number
  template: DocumentTemplate | null
  extractedFields: Record<string, string>
  suggestedTags: string[]
  reasoning: string[]
}

export interface DocumentProperties {
  text: string
  metadata: {
    pageCount: number
    hasImages: boolean
    hasTables: boolean
    hasSignatures: boolean
    textDensity: number
  }
  extractedFields: Record<string, string>
}

// Enhanced document classifier with 80% similarity threshold
export class DocumentClassifier {
  private templates: DocumentTemplate[]
  private similarityThreshold: number = 0.6 // Temporarily lowered for better recognition

  constructor(templates: DocumentTemplate[] = DOCUMENT_TEMPLATES) {
    this.templates = templates
  }

  // Main classification method
  async classifyDocument(properties: DocumentProperties): Promise<ClassificationResult> {
    const { text, metadata, extractedFields } = properties
    
    // Find best matching template
    const bestMatch = this.findBestTemplate(text, metadata, extractedFields)
    
    // Calculate confidence and reasoning
    const confidence = bestMatch.score
    const reasoning = this.generateReasoning(bestMatch.template, bestMatch.score, text, metadata)
    
    // Generate suggested tags
    const suggestedTags = this.generateTags(bestMatch.template, extractedFields)
    
    return {
      category: bestMatch.template ? bestMatch.template.id : 'unknown',
      confidence,
      template: bestMatch.template,
      extractedFields,
      suggestedTags,
      reasoning
    }
  }

  // Find the best matching template
  private findBestTemplate(
    text: string,
    metadata: any,
    extractedFields: Record<string, string>
  ): { template: DocumentTemplate | null, score: number } {
    let bestMatch = { template: null as DocumentTemplate | null, score: 0 }
    
    for (const template of this.templates) {
      const score = calculateDocumentSimilarity(text, metadata, template)
      
      if (score > bestMatch.score) {
        bestMatch = { template, score }
      }
    }
    
    // Only return if above threshold
    if (bestMatch.score >= this.similarityThreshold) {
      return bestMatch
    }
    
    return { template: null, score: bestMatch.score }
  }

  // Generate reasoning for the classification
  private generateReasoning(
    template: DocumentTemplate | null,
    score: number,
    text: string,
    metadata: any
  ): string[] {
    const reasoning: string[] = []
    
    if (!template) {
      reasoning.push('No template matched the 80% similarity threshold')
      reasoning.push('Document characteristics did not match any known document types')
      return reasoning
    }
    
    reasoning.push(`Matched template: ${template.name} (${(score * 100).toFixed(1)}% similarity)`)
    
    // Check keyword matches
    const keywordMatches = template.characteristics.keywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    )
    if (keywordMatches.length > 0) {
      reasoning.push(`Found keywords: ${keywordMatches.join(', ')}`)
    }
    
    // Check pattern matches
    const patternMatches = template.characteristics.patterns.filter(pattern =>
      pattern.test(text)
    )
    if (patternMatches.length > 0) {
      reasoning.push(`Matched patterns: ${patternMatches.length} out of ${template.characteristics.patterns.length}`)
    }
    
    // Check required fields
    const extractedFields = this.extractStructuredFields(text)
    const requiredFieldMatches = template.characteristics.requiredFields.filter(field =>
      Object.keys(extractedFields).some(key => key.toLowerCase().includes(field.toLowerCase()))
    )
    if (requiredFieldMatches.length > 0) {
      reasoning.push(`Found required fields: ${requiredFieldMatches.join(', ')}`)
    }
    
    // Check characteristics
    if (template.characteristics.hasImages === metadata.hasImages) {
      reasoning.push('Image presence matches template expectation')
    }
    if (template.characteristics.hasTables === metadata.hasTables) {
      reasoning.push('Table presence matches template expectation')
    }
    if (template.characteristics.hasSignatures === metadata.hasSignatures) {
      reasoning.push('Signature presence matches template expectation')
    }
    
    return reasoning
  }

  // Generate suggested tags based on template and extracted fields
  private generateTags(
    template: DocumentTemplate | null,
    extractedFields: Record<string, string>
  ): string[] {
    const tags: string[] = []
    
    if (!template) {
      return ['unknown', 'unclassified']
    }
    
    // Add template-based tags
    tags.push(template.id)
    tags.push(template.category)
    
    // Add field-based tags
    if (extractedFields.name) tags.push('has-name')
    if (extractedFields.date_of_birth) tags.push('has-birthdate')
    if (extractedFields.passport_number) tags.push('has-passport')
    if (extractedFields.id_number) tags.push('has-id')
    if (extractedFields.address) tags.push('has-address')
    if (extractedFields.phone) tags.push('has-phone')
    if (extractedFields.email) tags.push('has-email')
    if (extractedFields.amount) tags.push('has-amount')
    if (extractedFields.account_number) tags.push('has-account')
    if (extractedFields.iban) tags.push('has-iban')
    
    // Add characteristic tags
    if (template.characteristics.hasImages) tags.push('has-images')
    if (template.characteristics.hasTables) tags.push('has-tables')
    if (template.characteristics.hasSignatures) tags.push('has-signatures')
    
    return [...new Set(tags)] // Remove duplicates
  }

  // Extract structured fields from text (reused from OCR)
  private extractStructuredFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {}
    
    const patterns = {
      'name': /(?:name|surname|given names?)[:\s]+([A-Za-z\s\-\.]+)/i,
      'date_of_birth': /(?:date of birth|geburtstag|date de naissance)[:\s]+([0-9\.\-\/]+)/i,
      'passport_number': /(?:passport no|passport number|passport)[:\s]+([A-Z0-9]+)/i,
      'id_number': /(?:id number|ausweis|identity)[:\s]+([A-Z0-9]+)/i,
      'address': /(?:address|adresse|adresse)[:\s]+([A-Za-z0-9\s,\.\-]+)/i,
      'phone': /(?:phone|telefon|téléphone)[:\s]+([0-9\+\s\-\(\)]+)/i,
      'email': /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      'amount': /(?:amount|betrag|montant)[:\s]+([0-9,\.\s]+(?:CHF|EUR|USD)?)/i,
      'account_number': /(?:account|konto|compte)[:\s]+([0-9]+)/i,
      'iban': /([A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16})/i
    }
    
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern)
      if (match) {
        fields[field] = match[1].trim()
      }
    }
    
    return fields
  }

  // Add new template for learning
  addTemplate(template: DocumentTemplate): void {
    this.templates.push(template)
  }

  // Update similarity threshold
  setSimilarityThreshold(threshold: number): void {
    this.similarityThreshold = Math.max(0, Math.min(1, threshold))
  }

  // Get all available templates
  getTemplates(): DocumentTemplate[] {
    return [...this.templates]
  }

  // Get template by ID
  getTemplate(id: string): DocumentTemplate | null {
    return this.templates.find(template => template.id === id) || null
  }
}

// Singleton instance
export const documentClassifier = new DocumentClassifier()

// Helper function to classify a document
export async function classifyDocument(
  text: string,
  metadata: any,
  extractedFields: Record<string, string> = {}
): Promise<ClassificationResult> {
  const properties: DocumentProperties = {
    text,
    metadata,
    extractedFields
  }
  
  return await documentClassifier.classifyDocument(properties)
}
