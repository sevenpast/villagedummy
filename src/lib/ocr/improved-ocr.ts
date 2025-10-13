import { createClient } from '@supabase/supabase-js'

// Enhanced OCR with better text extraction and preprocessing
export interface OCRResult {
  text: string
  confidence: number
  language: string
  extractedFields: Record<string, string>
  documentType: string
  metadata: {
    pageCount: number
    hasImages: boolean
    hasTables: boolean
    hasSignatures: boolean
    textDensity: number
  }
}

export interface DocumentTemplate {
  id: string
  name: string
  category: string
  confidence: number
  characteristics: {
    keywords: string[]
    patterns: RegExp[]
    requiredFields: string[]
    optionalFields: string[]
    textDensity: {
      min: number
      max: number
    }
    hasImages: boolean
    hasTables: boolean
    hasSignatures: boolean
  }
}

// Document templates with their characteristics
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'passport',
    name: 'Passport',
    category: 'identity',
    confidence: 0.8,
    characteristics: {
      keywords: ['passport', 'reisepass', 'passeport', 'passaporte', 'passporto', 'paszport', 'republic', 'switzerland', 'schweiz'],
      patterns: [
        /passport/i,
        /reisepass/i,
        /passeport/i,
        /passport\s+no/i,
        /passport\s+number/i,
        /ausweis/i,
        /identity/i,
        /republic\s+of\s+switzerland/i,
        /schweiz/i,
        /swiss/i,
        /passport\s+no:\s*[A-Z0-9]+/i,
        /surname:\s*[A-Z\s]+/i,
        /given\s+names:\s*[A-Z\s]+/i,
        /date\s+of\s+birth:\s*[0-9\.]+/i,
        /nationality:\s*[A-Z\s]+/i
      ],
      requiredFields: ['passport number', 'name', 'date of birth', 'nationality'],
      optionalFields: ['place of birth', 'issue date', 'expiry date', 'authority', 'surname', 'given names'],
      textDensity: { min: 0.1, max: 0.4 },
      hasImages: true,
      hasTables: false,
      hasSignatures: true
    }
  },
  {
    id: 'id_card',
    name: 'ID Card / Residence Permit',
    category: 'identity',
    confidence: 0.8,
    characteristics: {
      keywords: ['identity card', 'ausweis', 'carte d\'identité', 'residence permit', 'aufenthaltstitel'],
      patterns: [
        /identity\s+card/i,
        /ausweis/i,
        /carte\s+d'identité/i,
        /residence\s+permit/i,
        /aufenthaltstitel/i,
        /id\s+card/i
      ],
      requiredFields: ['id number', 'name', 'date of birth'],
      optionalFields: ['address', 'nationality', 'issue date', 'expiry date'],
      textDensity: { min: 0.2, max: 0.6 },
      hasImages: true,
      hasTables: false,
      hasSignatures: true
    }
  },
  {
    id: 'drivers_license',
    name: 'Driver\'s License',
    category: 'identity',
    confidence: 0.8,
    characteristics: {
      keywords: ['driving license', 'führerschein', 'permis de conduire', 'patente', 'driver\'s license'],
      patterns: [
        /driving\s+license/i,
        /führerschein/i,
        /permis\s+de\s+conduire/i,
        /driver's\s+license/i,
        /patente/i
      ],
      requiredFields: ['license number', 'name', 'date of birth'],
      optionalFields: ['address', 'issue date', 'expiry date', 'categories'],
      textDensity: { min: 0.15, max: 0.5 },
      hasImages: true,
      hasTables: false,
      hasSignatures: true
    }
  },
  {
    id: 'work_contract',
    name: 'Work Contract',
    category: 'legal',
    confidence: 0.8,
    characteristics: {
      keywords: ['employment contract', 'arbeitsvertrag', 'contrat de travail', 'work contract'],
      patterns: [
        /employment\s+contract/i,
        /arbeitsvertrag/i,
        /contrat\s+de\s+travail/i,
        /work\s+contract/i,
        /employment\s+agreement/i
      ],
      requiredFields: ['employer', 'employee', 'position', 'salary'],
      optionalFields: ['start date', 'end date', 'working hours', 'benefits'],
      textDensity: { min: 0.3, max: 0.8 },
      hasImages: false,
      hasTables: true,
      hasSignatures: true
    }
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    category: 'financial',
    confidence: 0.8,
    characteristics: {
      keywords: ['bank statement', 'kontoauszug', 'relevé de compte', 'estratto conto'],
      patterns: [
        /bank\s+statement/i,
        /kontoauszug/i,
        /relevé\s+de\s+compte/i,
        /account\s+statement/i,
        /banking\s+statement/i
      ],
      requiredFields: ['account number', 'bank name', 'statement period'],
      optionalFields: ['balance', 'transactions', 'iban'],
      textDensity: { min: 0.4, max: 0.9 },
      hasImages: false,
      hasTables: true,
      hasSignatures: false
    }
  },
  {
    id: 'insurance_policy',
    name: 'Insurance Policy',
    category: 'financial',
    confidence: 0.8,
    characteristics: {
      keywords: ['insurance', 'versicherung', 'assurance', 'assicurazione', 'policy'],
      patterns: [
        /insurance\s+policy/i,
        /versicherung/i,
        /assurance/i,
        /assicurazione/i,
        /policy\s+number/i
      ],
      requiredFields: ['policy number', 'insurance company', 'insured person'],
      optionalFields: ['coverage', 'premium', 'start date', 'end date'],
      textDensity: { min: 0.2, max: 0.7 },
      hasImages: false,
      hasTables: true,
      hasSignatures: true
    }
  },
  {
    id: 'lease_agreement',
    name: 'Lease Agreement',
    category: 'legal',
    confidence: 0.8,
    characteristics: {
      keywords: ['lease agreement', 'mietvertrag', 'contrat de bail', 'contratto di affitto'],
      patterns: [
        /lease\s+agreement/i,
        /mietvertrag/i,
        /contrat\s+de\s+bail/i,
        /rental\s+agreement/i,
        /tenancy\s+agreement/i
      ],
      requiredFields: ['landlord', 'tenant', 'property address', 'rent amount'],
      optionalFields: ['lease period', 'deposit', 'utilities'],
      textDensity: { min: 0.3, max: 0.8 },
      hasImages: false,
      hasTables: true,
      hasSignatures: true
    }
  },
  {
    id: 'tax_document',
    name: 'Tax Document',
    category: 'financial',
    confidence: 0.8,
    characteristics: {
      keywords: ['tax', 'steuer', 'impôt', 'tassa', 'fiscal', 'irs'],
      patterns: [
        /tax\s+return/i,
        /steuer/i,
        /impôt/i,
        /tassa/i,
        /fiscal/i,
        /irs/i
      ],
      requiredFields: ['tax year', 'taxpayer', 'tax amount'],
      optionalFields: ['income', 'deductions', 'refund'],
      textDensity: { min: 0.4, max: 0.9 },
      hasImages: false,
      hasTables: true,
      hasSignatures: true
    }
  }
]

// Enhanced OCR processing with better text extraction
export async function processDocumentWithOCR(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<OCRResult> {
  try {
    // For now, we'll use a mock OCR that simulates better text extraction
    // In production, you would integrate with Google Cloud Vision API or similar
    
    const mockText = await extractTextFromFile(fileBuffer, fileName, mimeType)
    const confidence = 0.85 // Mock confidence score
    
    // Analyze document characteristics
    const metadata = analyzeDocumentCharacteristics(mockText, fileBuffer)
    
    // Extract structured fields
    const extractedFields = extractStructuredFields(mockText)
    
    // Determine document type
    const documentType = classifyDocument(mockText, metadata)
    
    return {
      text: mockText,
      confidence,
      language: detectLanguage(mockText),
      extractedFields,
      documentType,
      metadata
    }
    
  } catch (error) {
    console.error('OCR processing failed:', error)
    throw new Error('Failed to process document with OCR')
  }
}

// Mock text extraction (replace with real OCR service)
async function extractTextFromFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  // This is a mock implementation
  // In production, use Google Cloud Vision API, Tesseract, or similar
  
  const mockTexts = {
    'passport': `PASSPORT
REPUBLIC OF SWITZERLAND
Passport No: A1234567
Surname: HABLÜTZEL
Given Names: ANDY
Date of Birth: 15.03.1985
Place of Birth: ZURICH
Nationality: SWISS
Sex: M
Date of Issue: 01.01.2020
Date of Expiry: 01.01.2030
Authority: STADT ZÜRICH`,
    
    'bank_statement': `BANK STATEMENT
Account Number: 1234567890
Bank: UBS Switzerland
Statement Period: 01.01.2024 - 31.01.2024
Opening Balance: CHF 5,000.00
Closing Balance: CHF 4,750.00
Transactions:
01.01.2024 Salary CHF +3,000.00
15.01.2024 Rent CHF -1,200.00
20.01.2024 Groceries CHF -50.00`,
    
    'work_contract': `EMPLOYMENT CONTRACT
Employer: Tech Company AG
Employee: Andy Hablützel
Position: Software Developer
Start Date: 01.02.2024
Salary: CHF 8,000.00 per month
Working Hours: 40 hours per week
Benefits: Health insurance, pension fund`
  }
  
  // Simple filename-based text selection
  const lowerFileName = fileName.toLowerCase()
  if (lowerFileName.includes('pass')) return mockTexts.passport
  if (lowerFileName.includes('bank') || lowerFileName.includes('statement')) return mockTexts.bank_statement
  if (lowerFileName.includes('contract') || lowerFileName.includes('work')) return mockTexts.work_contract
  
  return `Document: ${fileName}
This is a sample document text extracted from ${fileName}.
The document appears to be of type ${mimeType}.
Additional content would be extracted here using real OCR technology.`
}

// Analyze document characteristics
function analyzeDocumentCharacteristics(text: string, fileBuffer: Buffer) {
  const textLength = text.length
  const fileSize = fileBuffer.length
  const textDensity = textLength / fileSize
  
  return {
    pageCount: Math.ceil(textLength / 2000), // Estimate pages
    hasImages: fileSize > 100000, // Large files likely have images
    hasTables: /table|row|column|\|\s*\|/i.test(text),
    hasSignatures: /signature|unterschrift|signature/i.test(text),
    textDensity
  }
}

// Extract structured fields from text
function extractStructuredFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {}
  
  // Common field patterns
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

// Classify document based on content and characteristics
function classifyDocument(text: string, metadata: any): string {
  let bestMatch = { template: null as DocumentTemplate | null, score: 0 }
  
  for (const template of DOCUMENT_TEMPLATES) {
    let score = 0
    
    // Check keywords
    const keywordMatches = template.characteristics.keywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length
    score += (keywordMatches / template.characteristics.keywords.length) * 0.4
    
    // Check patterns
    const patternMatches = template.characteristics.patterns.filter(pattern =>
      pattern.test(text)
    ).length
    score += (patternMatches / template.characteristics.patterns.length) * 0.3
    
    // Check required fields
    const extractedFields = extractStructuredFields(text)
    const requiredFieldMatches = template.characteristics.requiredFields.filter(field =>
      Object.keys(extractedFields).some(key => key.toLowerCase().includes(field.toLowerCase()))
    ).length
    score += (requiredFieldMatches / template.characteristics.requiredFields.length) * 0.2
    
    // Check characteristics
    if (template.characteristics.hasImages === metadata.hasImages) score += 0.05
    if (template.characteristics.hasTables === metadata.hasTables) score += 0.05
    if (template.characteristics.hasSignatures === metadata.hasSignatures) score += 0.05
    
    // Check text density
    if (metadata.textDensity >= template.characteristics.textDensity.min &&
        metadata.textDensity <= template.characteristics.textDensity.max) {
      score += 0.05
    }
    
    if (score > bestMatch.score) {
      bestMatch = { template, score }
    }
  }
  
  // Return classification if confidence is above threshold
  if (bestMatch.score >= 0.6) {
    return bestMatch.template!.id
  }
  
  return 'unknown'
}

// Detect language of the text
function detectLanguage(text: string): string {
  // Simple language detection based on common words
  const germanWords = ['der', 'die', 'das', 'und', 'ist', 'in', 'mit', 'für', 'auf', 'an']
  const frenchWords = ['le', 'la', 'les', 'et', 'est', 'dans', 'avec', 'pour', 'sur', 'à']
  const italianWords = ['il', 'la', 'le', 'e', 'è', 'in', 'con', 'per', 'su', 'a']
  
  const lowerText = text.toLowerCase()
  
  const germanCount = germanWords.filter(word => lowerText.includes(word)).length
  const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length
  const italianCount = italianWords.filter(word => lowerText.includes(word)).length
  
  if (germanCount > frenchCount && germanCount > italianCount) return 'german'
  if (frenchCount > germanCount && frenchCount > italianCount) return 'french'
  if (italianCount > germanCount && italianCount > frenchCount) return 'italian'
  
  return 'english'
}

// Calculate similarity between document and template
export function calculateDocumentSimilarity(
  text: string,
  metadata: any,
  template: DocumentTemplate
): number {
  let score = 0
  
  // Keyword matching (40% weight)
  const keywordMatches = template.characteristics.keywords.filter(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  ).length
  score += (keywordMatches / template.characteristics.keywords.length) * 0.4
  
  // Pattern matching (30% weight)
  const patternMatches = template.characteristics.patterns.filter(pattern =>
    pattern.test(text)
  ).length
  score += (patternMatches / template.characteristics.patterns.length) * 0.3
  
  // Required fields matching (20% weight)
  const extractedFields = extractStructuredFields(text)
  const requiredFieldMatches = template.characteristics.requiredFields.filter(field =>
    Object.keys(extractedFields).some(key => key.toLowerCase().includes(field.toLowerCase()))
  ).length
  score += (requiredFieldMatches / template.characteristics.requiredFields.length) * 0.2
  
  // Characteristics matching (10% weight)
  if (template.characteristics.hasImages === metadata.hasImages) score += 0.025
  if (template.characteristics.hasTables === metadata.hasTables) score += 0.025
  if (template.characteristics.hasSignatures === metadata.hasSignatures) score += 0.025
  
  // Text density matching (5% weight)
  if (metadata.textDensity >= template.characteristics.textDensity.min &&
      metadata.textDensity <= template.characteristics.textDensity.max) {
    score += 0.05
  }
  
  return Math.min(score, 1.0) // Cap at 1.0
}
