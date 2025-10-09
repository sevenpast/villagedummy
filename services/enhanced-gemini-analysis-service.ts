import { GoogleGenerativeAI } from '@google/generative-ai';
import { OCRResult } from './enhanced-ocr-service';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export interface DocumentAnalysisResult {
  documentType: string;
  confidence: number;
  tags: string[];
  description: string;
  language: string;
  isSwissDocument: boolean;
  extractedData: {
    keyFields: Array<{
      label: string;
      value: string;
      confidence: number;
    }>;
    importantDates: string[];
    amounts: string[];
    organizations: string[];
  };
}

export class EnhancedGeminiAnalysisService {
  private model = genAI.getGenerativeModel({ model: "gemini-pro" });
  private fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  async analyzeDocumentWithOCR(ocrResult: OCRResult, fileName: string): Promise<DocumentAnalysisResult> {
    try {
      console.log('🧠 Starting Gemini analysis with OCR data for:', fileName);

      const analysisPrompt = `
        You are an expert document analyst. Analyze the following OCR-extracted data and provide comprehensive document classification.

        FILENAME: ${fileName}
        
        OCR EXTRACTED DATA:
        - Full Text: ${ocrResult.text}
        - Confidence: ${ocrResult.confidence}
        - Language: ${ocrResult.metadata.language}
        - Document Type (OCR): ${ocrResult.metadata.documentType}
        - Has Images: ${ocrResult.metadata.hasImages}
        - Has Tables: ${ocrResult.metadata.hasTables}
        - Has Forms: ${ocrResult.metadata.hasForms}
        - Layout Blocks: ${JSON.stringify(ocrResult.layout.blocks)}
        - Images: ${JSON.stringify(ocrResult.images)}

        Based on this comprehensive OCR data, analyze and return a JSON object with this exact structure:

        {
          "documentType": "Passport/ID|Diplomas & Certificates|Employment Contract|Rental Agreement|Payroll|Invoices|Insurance Documents|Birth Certificate|Marriage Certificate|Residence Permit|Banking Documents|Tax Documents|Medical Documents|Unknown Document",
          "confidence": 0.95,
          "tags": ["passport", "identity", "travel"],
          "description": "Brief description of the document content",
          "language": "German|English|French|Italian|Multiple",
          "isSwissDocument": true/false,
          "extractedData": {
            "keyFields": [
              {"label": "Name", "value": "John Doe", "confidence": 0.9},
              {"label": "Date of Birth", "value": "1990-01-01", "confidence": 0.8}
            ],
            "importantDates": ["1990-01-01", "2024-01-01"],
            "amounts": ["CHF 1000", "€500"],
            "organizations": ["Swiss Federal Office", "Bank of Switzerland"]
          }
        }

        ANALYSIS RULES:
        1. Use the OCR text content as primary source
        2. Consider filename hints but prioritize OCR content
        3. Look for Swiss-specific elements (CHF, Swiss addresses, German/French/Italian text)
        4. Extract key personal information (names, dates, amounts)
        5. Identify document type based on content structure and keywords
        6. Provide high confidence scores for clear documents
        7. Be conservative with confidence for unclear documents

        SWISS DOCUMENT INDICATORS:
        - CHF currency
        - Swiss addresses (Zürich, Basel, Bern, etc.)
        - German/French/Italian text
        - Swiss phone numbers (+41)
        - Swiss postal codes (4 digits)
        - Swiss organizations (Bundesamt, Gemeinde, etc.)

        DOCUMENT TYPE CLASSIFICATION:
        - Passport/ID: Personal identification documents
        - Diplomas & Certificates: Educational certificates, diplomas
        - Employment Contract: Work contracts, job offers
        - Rental Agreement: Lease contracts, housing documents
        - Payroll: Salary statements, payslips
        - Invoices: Bills, receipts, invoices
        - Insurance Documents: Health, car, liability insurance
        - Birth Certificate: Birth certificates, family documents
        - Marriage Certificate: Marriage certificates, family documents
        - Residence Permit: Swiss residence permits, visas
        - Banking Documents: Bank statements, account documents
        - Tax Documents: Tax returns, tax certificates
        - Medical Documents: Medical reports, prescriptions
        - Unknown Document: If unclear or doesn't fit categories

        Return ONLY the JSON object, no additional text or formatting.
      `;

      let result;
      try {
        result = await this.model.generateContent(analysisPrompt);
      } catch (modelError) {
        console.log('⚠️ Primary model failed, trying fallback model...');
        result = await this.fallbackModel.generateContent(analysisPrompt);
      }
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      let analysisResult: DocumentAnalysisResult;
      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse analysis JSON:', parseError);
        // Fallback analysis
        analysisResult = {
          documentType: 'Unknown Document',
          confidence: 0.3,
          tags: ['unknown'],
          description: 'Document analysis failed',
          language: ocrResult.metadata.language || 'unknown',
          isSwissDocument: false,
          extractedData: {
            keyFields: [],
            importantDates: [],
            amounts: [],
            organizations: []
          }
        };
      }

      console.log('✅ Gemini analysis completed:', {
        documentType: analysisResult.documentType,
        confidence: analysisResult.confidence,
        tags: analysisResult.tags,
        isSwissDocument: analysisResult.isSwissDocument
      });

      return analysisResult;

    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeFilenameOnly(fileName: string): Promise<DocumentAnalysisResult> {
    try {
      console.log('📄 Analyzing filename only:', fileName);

      const filenamePrompt = `
        Analyze this filename and provide document classification based on filename patterns only.

        FILENAME: ${fileName}

        Return JSON with this structure:
        {
          "documentType": "Passport/ID|Diplomas & Certificates|Employment Contract|Rental Agreement|Payroll|Invoices|Insurance Documents|Birth Certificate|Marriage Certificate|Residence Permit|Banking Documents|Tax Documents|Medical Documents|Unknown Document",
          "confidence": 0.7,
          "tags": ["passport", "identity"],
          "description": "Document identified from filename",
          "language": "unknown",
          "isSwissDocument": false,
          "extractedData": {
            "keyFields": [],
            "importantDates": [],
            "amounts": [],
            "organizations": []
          }
        }

        Filename patterns:
        - Pass/Passport/ID/Identity → Passport/ID
        - Diploma/Certificate/Cert → Diplomas & Certificates
        - Contract/Arbeitsvertrag → Employment Contract
        - Invoice/Rechnung → Invoices
        - Insurance/Versicherung → Insurance Documents
        - Birth/Geburt → Birth Certificate
        - Marriage/Heirat → Marriage Certificate
        - Permit/Bewilligung → Residence Permit
        - Bank/Banking → Banking Documents
        - Tax/Steuer → Tax Documents
        - Medical/Medical → Medical Documents

        Return ONLY the JSON object.
      `;

      let result;
      try {
        result = await this.model.generateContent(filenamePrompt);
      } catch (modelError) {
        console.log('⚠️ Primary model failed, trying fallback model...');
        result = await this.fallbackModel.generateContent(filenamePrompt);
      }
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in filename analysis');
      }

    } catch (error) {
      console.error('❌ Filename analysis failed:', error);
      return {
        documentType: 'Unknown Document',
        confidence: 0.2,
        tags: ['unknown'],
        description: 'Filename analysis failed',
        language: 'unknown',
        isSwissDocument: false,
        extractedData: {
          keyFields: [],
          importantDates: [],
          amounts: [],
          organizations: []
        }
      };
    }
  }
}