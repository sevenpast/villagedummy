import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface UserProfile {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  country_of_origin: string;
  current_address: string;
  municipality: string;
  canton: string;
  postal_code: string;
  phone: string;
  email: string;
  employer: string;
  has_kids: boolean;
  num_children: number;
  // For school registration specifically
  children?: Array<{
    name: string;
    date_of_birth: string;
    gender: string;
    allergies?: string;
  }>;
}

interface PDFField {
  name: string;
  originalName: string;
  translation: string;
  value: string;
  confidence: number;
  isAutoFilled: boolean;
  fieldType: 'text' | 'date' | 'checkbox' | 'select';
}

interface PDFAnalysisResult {
  fields: PDFField[];
  detectedLanguage: string;
  formType: string;
  confidence: number;
  missingFields: string[];
  requiredDocuments: string[];
}

/**
 * Extract text from PDF
 */
export async function extractPDFText(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Analyze PDF form and map to user profile
 */
export async function analyzePDFForm(
  pdfText: string,
  userProfile: UserProfile,
  formType: 'school_registration' | 'gemeinde' | 'health_insurance' | 'general'
): Promise<PDFAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert at analyzing Swiss administrative forms and mapping user data to form fields.

**TASK:** Analyze this PDF form text and create a field mapping.

**PDF FORM TEXT:**
${pdfText.substring(0, 4000)} 

**USER PROFILE:**
${JSON.stringify(userProfile, null, 2)}

**FORM TYPE:** ${formType}

**YOUR JOB:**
1. **Detect Language:** German, French, or Italian
2. **Identify Form Type:** School registration, Gemeinde registration, etc.
3. **Extract All Form Fields:** Find every field that needs to be filled
4. **Translate Fields:** Provide English translation for each field
5. **Auto-Fill:** Map user profile data to fields where possible
6. **Flag Missing Data:** Identify fields that cannot be auto-filled
7. **Required Documents:** List documents that need to be attached

**SPECIAL RULES FOR SWISS FORMS:**
- Dates MUST be in DD.MM.YYYY format (Swiss standard)
- Phone numbers in +41 format
- Names exactly as in passport (no nicknames)
- "Familienname" = Last Name, "Vorname" = First Name
- "Geburtsdatum" = Date of Birth
- "Staatsangehörigkeit" / "Nationalität" = Nationality (country name)
- "Muttersprache" = Native Language
- "Adresse" = Full address
- "PLZ" = Postal Code, "Ort" = City
- "Geschlecht" = Gender (m/w/d in German forms)

**FOR SCHOOL REGISTRATION SPECIFICALLY:**
- Look for child-specific fields (child's name, DOB, gender, etc.)
- Check for "Gewünschtes Eintrittsdatum" (Desired Entry Date)
- Look for "Besondere Bedürfnisse" (Special Needs) or "Allergien" (Allergies)
- Check for parent/guardian information

**OUTPUT FORMAT (JSON):**
{
  "detectedLanguage": "German",
  "formType": "Kindergarten Registration - Zurich",
  "confidence": 0.95,
  "fields": [
    {
      "name": "child_last_name",
      "originalName": "Familienname des Kindes",
      "translation": "Child's Last Name",
      "value": "Santos",
      "confidence": 1.0,
      "isAutoFilled": true,
      "fieldType": "text"
    },
    {
      "name": "desired_entry_date",
      "originalName": "Gewünschtes Eintrittsdatum",
      "translation": "Desired Entry Date",
      "value": "",
      "confidence": 0.0,
      "isAutoFilled": false,
      "fieldType": "date"
    }
  ],
  "missingFields": [
    "Desired Entry Date (user must enter)",
    "Previous School/Daycare (if applicable)"
  ],
  "requiredDocuments": [
    "Child's birth certificate",
    "Passport copy",
    "Proof of residence (rental contract)",
    "Vaccination records (if available)"
  ]
}

**IMPORTANT:**
- Be accurate with field detection
- If unsure about a field, set confidence < 0.8
- Always include all fields found in the form
- Provide helpful translations
- List ALL required documents mentioned in the form`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis: PDFAnalysisResult = JSON.parse(jsonMatch[0]);

    // Validate and enhance
    return enhanceAnalysis(analysis, userProfile);
  } catch (error) {
    console.error('AI analysis failed:', error);
    // Fallback to basic analysis
    return createFallbackAnalysis(pdfText, userProfile, formType);
  }
}

/**
 * Enhance AI analysis with additional logic
 */
function enhanceAnalysis(
  analysis: PDFAnalysisResult,
  userProfile: UserProfile
): PDFAnalysisResult {
  // Add Swiss-specific formatting
  analysis.fields = analysis.fields.map(field => {
    // Format dates to DD.MM.YYYY
    if (field.fieldType === 'date' && field.value && field.value.includes('-')) {
      const [year, month, day] = field.value.split('-');
      field.value = `${day}.${month}.${year}`;
    }

    // Format phone numbers
    if (field.name.includes('phone') || field.name.includes('telefon')) {
      if (field.value && !field.value.startsWith('+41')) {
        // Try to format as Swiss number
        field.value = field.value.replace(/^0/, '+41 ');
      }
    }

    return field;
  });

  return analysis;
}

/**
 * Fallback analysis if AI fails
 */
function createFallbackAnalysis(
  pdfText: string,
  userProfile: UserProfile,
  formType: string
): PDFAnalysisResult {
  // Detect language
  const detectedLanguage = detectLanguage(pdfText);

  // Basic field mapping
  const fields: PDFField[] = [
    {
      name: 'last_name',
      originalName: detectedLanguage === 'German' ? 'Familienname' : 'Nom de famille',
      translation: 'Last Name',
      value: userProfile.last_name || '',
      confidence: 0.9,
      isAutoFilled: !!userProfile.last_name,
      fieldType: 'text'
    },
    {
      name: 'first_name',
      originalName: detectedLanguage === 'German' ? 'Vorname' : 'Prénom',
      translation: 'First Name',
      value: userProfile.first_name || '',
      confidence: 0.9,
      isAutoFilled: !!userProfile.first_name,
      fieldType: 'text'
    }
  ];

  return {
    fields,
    detectedLanguage,
    formType: 'General Form',
    confidence: 0.6,
    missingFields: ['Please review all fields manually'],
    requiredDocuments: ['Check form for document requirements']
  };
}

/**
 * Simple language detection
 */
function detectLanguage(text: string): string {
  const germanWords = ['und', 'der', 'die', 'das', 'für', 'von'];
  const frenchWords = ['et', 'le', 'la', 'pour', 'de', 'du'];
  const italianWords = ['e', 'il', 'la', 'per', 'di', 'del'];

  const lowerText = text.toLowerCase();
  
  const germanCount = germanWords.filter(w => lowerText.includes(w)).length;
  const frenchCount = frenchWords.filter(w => lowerText.includes(w)).length;
  const italianCount = italianWords.filter(w => lowerText.includes(w)).length;

  if (germanCount > frenchCount && germanCount > italianCount) return 'German';
  if (frenchCount > italianCount) return 'French';
  return 'Italian';
}

/**
 * Generate email for school/municipality
 */
export async function generateSubmissionEmail(
  formType: string,
  userProfile: UserProfile,
  recipientEmail: string,
  language: 'de' | 'fr' | 'it' = 'de'
): Promise<{ subject: string; body: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Generate a professional email in ${language === 'de' ? 'German' : language === 'fr' ? 'French' : 'Italian'} for submitting a ${formType} form.

**USER INFO:**
Name: ${userProfile.first_name} ${userProfile.last_name}
Email: ${userProfile.email}
Municipality: ${userProfile.municipality}

**REQUIREMENTS:**
- Formal tone (use "Sie")
- Clear subject line
- Polite introduction
- State purpose (submitting form)
- Mention attached documents
- Ask for confirmation
- Professional closing

**OUTPUT JSON:**
{
  "subject": "...",
  "body": "..."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    // Fallback
    return {
      subject: `Anmeldung - ${userProfile.first_name} ${userProfile.last_name}`,
      body: `Sehr geehrte Damen und Herren,\n\nanbei sende ich das ausgefüllte Anmeldeformular.\n\nMit freundlichen Grüßen,\n${userProfile.first_name} ${userProfile.last_name}`
    };
  }

  return JSON.parse(jsonMatch[0]);
}
