import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export interface PDFField {
  name: string;
  label: string;
  type: 'text' | 'checkbox' | 'radio' | 'select';
  value: string | boolean;
  required: boolean;
  confidence: number;
  userDataMatch: string | null;
}

export interface PDFFormAnalysis {
  fields: PDFField[];
  documentType: string;
  language: string;
  confidence: number;
  extractedText: string;
}

export class PDFFormAnalyzer {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async analyzePDFForm(pdfBuffer: Buffer, fileName: string, userData: any): Promise<PDFFormAnalysis> {
    try {
      console.log('🔍 Starting PDF form analysis for:', fileName);

      // Step 1: Extract text from PDF
      const extractedText = await this.extractTextFromPDF(pdfBuffer);
      console.log('📄 Extracted text length:', extractedText.length);

      // Step 2: Get form fields from PDF
      const pdfFields = await this.extractFormFields(pdfBuffer);
      console.log('📋 Found form fields:', pdfFields.length);

      // Step 3: Analyze with Gemini (with fallback)
      let analysisResult: PDFFormAnalysis;
      try {
        analysisResult = await this.analyzeWithGemini(extractedText, pdfFields, fileName, userData);
        console.log('🧠 Gemini analysis completed');
      } catch (geminiError) {
        console.warn('⚠️ Gemini analysis failed, using fallback:', geminiError);
        analysisResult = this.createFallbackAnalysis(pdfFields, fileName, userData);
      }

      return analysisResult;

    } catch (error) {
      console.error('❌ PDF form analysis failed:', error);
      // Return a basic fallback analysis
      return this.createFallbackAnalysis([], fileName, userData);
    }
  }

  private async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const { default: pdfParse } = await import('pdf-parse');
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }

  private async extractFormFields(pdfBuffer: Buffer): Promise<any[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      return fields.map(field => ({
        name: field.getName(),
        type: field instanceof PDFTextField ? 'text' : 
              field instanceof PDFCheckBox ? 'checkbox' : 'unknown'
      }));
    } catch (error) {
      console.error('Error extracting form fields:', error);
      return [];
    }
  }

  private async analyzeWithGemini(
    extractedText: string, 
    pdfFields: any[], 
    fileName: string, 
    userData: any
  ): Promise<PDFFormAnalysis> {
    try {
      const prompt = `
        You are an expert PDF form analyzer. Analyze the provided PDF form and match it with available user data.

        PDF Text Content:
        ${extractedText}

        Form Fields Found:
        ${JSON.stringify(pdfFields, null, 2)}

        Filename: ${fileName}

        Available User Data:
        ${JSON.stringify(userData, null, 2)}

        Your task:
        1. Identify the document type (e.g., "School Registration", "Municipality Registration", "Employment Contract", etc.)
        2. Determine the primary language (de, en, fr, it)
        3. For each form field, provide:
           - A human-readable label
           - The field type (text, checkbox, radio, select)
           - Whether it's required
           - A confidence score (0-1)
           - Which user data field it matches (if any)
           - The suggested value to pre-fill

        Return a JSON object with this exact structure:
        {
          "documentType": "string",
          "language": "string",
          "confidence": 0.85,
          "extractedText": "string (the provided extracted text)",
          "fields": [
            {
              "name": "field_name_from_pdf",
              "label": "Human readable label",
              "type": "text|checkbox|radio|select",
              "value": "suggested_value_or_empty_string",
              "required": true|false,
              "confidence": 0.9,
              "userDataMatch": "user_data_field_name_or_null"
            }
          ]
        }

        Guidelines:
        - Match form fields to user data intelligently (e.g., "vorname" -> first_name, "nachname" -> last_name)
        - For checkboxes, use "true" or "false" as values
        - For text fields, use the actual user data value
        - If no match is found, leave value as empty string
        - Be confident in your field matching
        - Provide clear, descriptive labels

        Return ONLY the JSON object, no additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis: PDFFormAnalysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Gemini analysis completed:', {
          documentType: analysis.documentType,
          language: analysis.language,
          fieldsCount: analysis.fields.length
        });
        return analysis;
      } else {
        throw new Error('No valid JSON found in Gemini response');
      }

    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      throw error;
    }
  }

  private createFallbackAnalysis(pdfFields: any[], fileName: string, userData: any): PDFFormAnalysis {
    console.log('🔄 Creating fallback analysis');
    
    // Create basic fields from PDF form fields - only include fields with actual user data
    const fields: PDFField[] = pdfFields
      .map(field => {
        const userValue = this.getUserValueForField(field.name, userData);
        const userDataMatch = this.getUserDataMatch(field.name, userData);
        
        // Only include fields that have actual user data
        if (userValue && userValue !== '') {
          return {
            name: field.name,
            label: this.generateLabelFromFieldName(field.name),
            type: field.type === 'checkbox' ? 'checkbox' : 'text',
            value: userValue,
            required: false,
            confidence: 1.0,
            userDataMatch: userDataMatch
          };
        }
        return null;
      })
      .filter(field => field !== null) as PDFField[];

    return {
      fields,
      documentType: this.guessDocumentType(fileName),
      language: 'de',
      confidence: 1.0,
      extractedText: ''
    };
  }

  private generateLabelFromFieldName(fieldName: string): string {
    const labelMap: { [key: string]: string } = {
      'vorname': 'First Name',
      'firstname': 'First Name',
      'prenom': 'First Name',
      'nome': 'First Name',
      'nachname': 'Last Name',
      'lastname': 'Last Name',
      'nom': 'Last Name',
      'cognome': 'Last Name',
      'email': 'Email',
      'telefon': 'Phone',
      'phone': 'Phone',
      'adresse': 'Address',
      'address': 'Address',
      'plz': 'Postal Code',
      'postal_code': 'Postal Code',
      'ort': 'City',
      'city': 'City',
      'land': 'Country',
      'country': 'Country'
    };

    const lowerFieldName = fieldName.toLowerCase();
    for (const [key, label] of Object.entries(labelMap)) {
      if (lowerFieldName.includes(key)) {
        return label;
      }
    }

    // Fallback: capitalize field name
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ');
  }

  private getUserValueForField(fieldName: string, userData: any): string | boolean {
    const lowerFieldName = fieldName.toLowerCase();
    
    if (lowerFieldName.includes('vorname') || lowerFieldName.includes('firstname') || lowerFieldName.includes('prenom') || lowerFieldName.includes('nome')) {
      return userData.first_name || '';
    }
    if (lowerFieldName.includes('nachname') || lowerFieldName.includes('lastname') || lowerFieldName.includes('nom') || lowerFieldName.includes('cognome')) {
      return userData.last_name || '';
    }
    if (lowerFieldName.includes('email')) {
      return userData.email || '';
    }
    if (lowerFieldName.includes('telefon') || lowerFieldName.includes('phone')) {
      return userData.phone || '';
    }
    if (lowerFieldName.includes('adresse') || lowerFieldName.includes('address')) {
      return userData.address || userData.current_address || '';
    }
    if (lowerFieldName.includes('plz') || lowerFieldName.includes('postal_code')) {
      return userData.target_postal_code || userData.postal_code || '';
    }
    if (lowerFieldName.includes('ort') || lowerFieldName.includes('city')) {
      return userData.target_municipality || userData.city || '';
    }
    if (lowerFieldName.includes('land') || lowerFieldName.includes('country')) {
      return userData.country_of_origin || userData.nationality || '';
    }

    return '';
  }

  private getUserDataMatch(fieldName: string, userData: any): string | null {
    const lowerFieldName = fieldName.toLowerCase();
    
    if (lowerFieldName.includes('vorname') || lowerFieldName.includes('firstname')) return 'first_name';
    if (lowerFieldName.includes('nachname') || lowerFieldName.includes('lastname')) return 'last_name';
    if (lowerFieldName.includes('email')) return 'email';
    if (lowerFieldName.includes('telefon') || lowerFieldName.includes('phone')) return 'phone';
    if (lowerFieldName.includes('adresse') || lowerFieldName.includes('address')) return 'address';
    if (lowerFieldName.includes('plz') || lowerFieldName.includes('postal_code')) return 'target_postal_code';
    if (lowerFieldName.includes('ort') || lowerFieldName.includes('city')) return 'target_municipality';
    if (lowerFieldName.includes('land') || lowerFieldName.includes('country')) return 'country_of_origin';

    return null;
  }

  private guessDocumentType(fileName: string): string {
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.includes('anmeldung') || lowerFileName.includes('registration')) {
      return 'Registration Form';
    }
    if (lowerFileName.includes('schule') || lowerFileName.includes('school') || lowerFileName.includes('kindergarten')) {
      return 'School Registration';
    }
    if (lowerFileName.includes('gemeinde') || lowerFileName.includes('municipality')) {
      return 'Municipality Registration';
    }
    if (lowerFileName.includes('arbeitsvertrag') || lowerFileName.includes('employment')) {
      return 'Employment Contract';
    }
    if (lowerFileName.includes('mietvertrag') || lowerFileName.includes('rental')) {
      return 'Rental Agreement';
    }

    return 'Form Document';
  }
}
