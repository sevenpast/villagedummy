// ============================================================================
// OCR & GEMINI DOCUMENT CLASSIFICATION
// Automatic document classification using Google Cloud Vision + Gemini
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini configuration
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

export interface OCRResult {
  text: string;
  language: string;
  confidence: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
  }>;
}

export interface ClassificationResult {
  category_code: string;
  confidence: number;
  extracted_fields: Record<string, any>;
  suggested_tags: string[];
  has_expiry_date: boolean;
  expiry_date?: string;
  reasoning: string;
}

export interface DocumentCategory {
  id: string;
  category_code: string;
  category_name: string;
  category_group: string;
  keywords: string[];
  typical_fields: Record<string, any>;
}

/**
 * Extract text from document using Google Cloud Vision OCR
 * This runs on the server side for security
 */
export async function extractTextFromDocument(
  fileBuffer: Buffer,
  mimeType: string
): Promise<OCRResult> {
  try {
    // For MVP, we'll use a simplified approach
    // In production, you'd use Google Cloud Vision API
    
    // Simulate OCR extraction (replace with actual Google Cloud Vision call)
    const mockOCRResult: OCRResult = {
      text: "MOCK OCR TEXT - Replace with actual Google Cloud Vision API call",
      language: "en",
      confidence: 0.95,
      pages: [
        {
          pageNumber: 1,
          text: "MOCK OCR TEXT - Replace with actual Google Cloud Vision API call",
          confidence: 0.95
        }
      ]
    };
    
    // TODO: Replace with actual Google Cloud Vision API call
    // const vision = require('@google-cloud/vision');
    // const client = new vision.ImageAnnotatorClient();
    // const [result] = await client.documentTextDetection({
    //   image: { content: fileBuffer }
    // });
    
    return mockOCRResult;
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from document');
  }
}

/**
 * Classify document using Gemini AI
 * This determines the document type and extracts relevant fields
 */
export async function classifyDocument(
  ocrText: string,
  fileName: string,
  categories: DocumentCategory[]
): Promise<ClassificationResult> {
  try {
    // Build the classification prompt
    const categoryList = categories.map(cat => 
      `- ${cat.category_code}: ${cat.category_name} (${cat.category_group})`
    ).join('\n');
    
    const prompt = `
You are a document classification AI. Analyze the following document and classify it into one of the categories.

Available categories:
${categoryList}

Document filename: ${fileName}
Document text: ${ocrText.substring(0, 2000)}...

Please respond with a JSON object containing:
{
  "category_code": "the_best_matching_category",
  "confidence": 0.95,
  "extracted_fields": {
    "field_name": "extracted_value"
  },
  "suggested_tags": ["tag1", "tag2"],
  "has_expiry_date": true/false,
  "expiry_date": "YYYY-MM-DD" (if found),
  "reasoning": "Brief explanation of classification decision"
}

Focus on:
1. Document type identification
2. Key information extraction (names, dates, numbers, etc.)
3. Expiry date detection (for passports, IDs, licenses, etc.)
4. Relevant tags for organization

Be conservative with confidence scores. Only use high confidence (>0.8) for obvious matches.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const classification = JSON.parse(text) as ClassificationResult;
    
    // Validate the response
    if (!classification.category_code || !classification.confidence) {
      throw new Error('Invalid classification response');
    }
    
    return classification;
  } catch (error) {
    console.error('Document classification failed:', error);
    
    // Return fallback classification
    return {
      category_code: 'other',
      confidence: 0.1,
      extracted_fields: {},
      suggested_tags: ['unclassified'],
      has_expiry_date: false,
      reasoning: 'Classification failed, using fallback category'
    };
  }
}

/**
 * Cache classification results to reduce API costs
 */
export async function getCachedClassification(
  fileHash: string
): Promise<ClassificationResult | null> {
  try {
    // TODO: Implement caching with Supabase
    // const { data } = await supabase
    //   .from('document_classification_cache')
    //   .select('*')
    //   .eq('file_hash', fileHash)
    //   .gt('expires_at', new Date().toISOString())
    //   .single();
    
    // if (data) {
    //   return {
    //     category_code: data.detected_category_id,
    //     confidence: data.confidence_score,
    //     extracted_fields: data.extracted_fields,
    //     suggested_tags: [],
    //     has_expiry_date: false,
    //     reasoning: 'Cached result'
    //   };
    // }
    
    return null;
  } catch (error) {
    console.error('Cache lookup failed:', error);
    return null;
  }
}

/**
 * Store classification result in cache
 */
export async function cacheClassification(
  fileHash: string,
  classification: ClassificationResult,
  categoryId: string
): Promise<void> {
  try {
    // TODO: Implement caching with Supabase
    // await supabase
    //   .from('document_classification_cache')
    //   .insert({
    //     file_hash: fileHash,
    //     detected_category_id: categoryId,
    //     confidence_score: classification.confidence,
    //     extracted_fields: classification.extracted_fields,
    //     expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    //   });
  } catch (error) {
    console.error('Cache storage failed:', error);
    // Don't throw - caching is not critical
  }
}

/**
 * Generate file hash for caching
 */
export async function generateFileHash(fileBuffer: Buffer): Promise<string> {
  // Convert Buffer to Uint8Array for crypto.subtle.digest
  const uint8Array = new Uint8Array(fileBuffer);
  const hashBuffer = await crypto.subtle.digest('SHA-256', uint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Process document: OCR + Classification
 * This is the main function that orchestrates the entire process
 */
export async function processDocument(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  categories: DocumentCategory[]
): Promise<{
  ocrResult: OCRResult;
  classification: ClassificationResult;
  categoryId?: string;
}> {
  try {
    // 1. Generate file hash for caching
    const fileHash = await generateFileHash(fileBuffer);
    
    // 2. Check cache first
    const cachedClassification = await getCachedClassification(fileHash);
    if (cachedClassification) {
      console.log('Using cached classification');
      // Still need OCR for display purposes
      const ocrResult = await extractTextFromDocument(fileBuffer, mimeType);
      return {
        ocrResult,
        classification: cachedClassification,
        categoryId: undefined // Will be resolved by category_code
      };
    }
    
    // 3. Extract text with OCR
    console.log('Extracting text with OCR...');
    const ocrResult = await extractTextFromDocument(fileBuffer, mimeType);
    
    // 4. Classify document with Gemini
    console.log('Classifying document with Gemini...');
    const classification = await classifyDocument(ocrResult.text, fileName, categories);
    
    // 5. Find matching category ID
    const matchingCategory = categories.find(
      cat => cat.category_code === classification.category_code
    );
    
    // 6. Cache the result
    if (matchingCategory) {
      await cacheClassification(fileHash, classification, matchingCategory.id);
    }
    
    return {
      ocrResult,
      classification,
      categoryId: matchingCategory?.id
    };
  } catch (error) {
    console.error('Document processing failed:', error);
    throw new Error('Failed to process document');
  }
}

/**
 * Get document categories from database
 */
export async function getDocumentCategories(): Promise<DocumentCategory[]> {
  try {
    // TODO: Implement with Supabase
    // const { data, error } = await supabase
    //   .from('document_categories')
    //   .select('*')
    //   .order('category_name');
    
    // if (error) throw error;
    // return data || [];
    
    // Mock data for now
    return [
      {
        id: '1',
        category_code: 'passport',
        category_name: 'Passport',
        category_group: 'identity',
        keywords: ['passport', 'reisepass', 'passeport'],
        typical_fields: {
          passport_number: 'string',
          full_name: 'string',
          date_of_birth: 'date',
          nationality: 'string',
          issue_date: 'date',
          expiry_date: 'date'
        }
      },
      {
        id: '2',
        category_code: 'id_card',
        category_name: 'ID Card / Residence Permit',
        category_group: 'identity',
        keywords: ['ausweis', 'identity', 'residence permit'],
        typical_fields: {
          id_number: 'string',
          full_name: 'string',
          date_of_birth: 'date',
          nationality: 'string',
          issue_date: 'date',
          expiry_date: 'date'
        }
      },
      {
        id: '3',
        category_code: 'other',
        category_name: 'Other Document',
        category_group: 'other',
        keywords: [],
        typical_fields: {}
      }
    ];
  } catch (error) {
    console.error('Failed to fetch document categories:', error);
    return [];
  }
}

/**
 * Validate classification result
 */
export function validateClassification(classification: ClassificationResult): boolean {
  return (
    classification.category_code &&
    typeof classification.confidence === 'number' &&
    classification.confidence >= 0 &&
    classification.confidence <= 1 &&
    Array.isArray(classification.suggested_tags) &&
    typeof classification.has_expiry_date === 'boolean'
  );
}
