import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export interface SimpleAnalysisResult {
  documentType: string;
  confidence: number;
  tags: string[];
  description: string;
  language: string;
  isSwissDocument: boolean;
}

export class SimpleDocumentAnalyzer {
  private model = genAI.getGenerativeModel({ model: "gemini-pro" });

  async analyzeFromFilename(fileName: string): Promise<SimpleAnalysisResult> {
    try {
      console.log('📄 Analyzing document from filename:', fileName);

      const prompt = `
        Analyze this filename and determine the document type. Return a JSON object with this exact structure:

        {
          "documentType": "Passport/ID|Diplomas & Certificates|Employment Contract|Rental Agreement|Payroll|Invoices|Insurance Documents|Birth Certificate|Marriage Certificate|Residence Permit|Banking Documents|Tax Documents|Medical Documents|Unknown Document",
          "confidence": 0.8,
          "tags": ["passport", "identity"],
          "description": "Document identified from filename",
          "language": "unknown",
          "isSwissDocument": false
        }

        Filename: ${fileName}

        Classification rules:
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
        - Anmeldung/Registration → Employment Contract or Residence Permit

        Return ONLY the JSON object, no additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }

    } catch (error) {
      console.error('❌ Filename analysis failed:', error);
      return {
        documentType: 'Unknown Document',
        confidence: 0.2,
        tags: ['unknown'],
        description: 'Filename analysis failed',
        language: 'unknown',
        isSwissDocument: false
      };
    }
  }
}
