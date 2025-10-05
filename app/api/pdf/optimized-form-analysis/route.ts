import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Optimized PDF Form Analysis API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log('📋 Request data:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId
    });

    if (!file || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing file or userId'
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({
        success: false,
        error: 'File must be a PDF'
      }, { status: 400 });
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Load PDF with pdf-lib
    console.log('📄 Loading PDF with pdf-lib...');
    let pdfDoc;
    let form;
    let fields = [];
    
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer);
      form = pdfDoc.getForm();
      fields = form.getFields();
      console.log(`📋 Successfully loaded PDF with ${fields.length} form fields`);
    } catch (pdfError) {
      console.warn('⚠️ PDF has no form fields or is not a fillable form:', pdfError.message);
      fields = [];
    }

    // Extract technical form fields
    const technicalFields = fields.map((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      return {
        name: fieldName,
        type: fieldType,
        index: index
      };
    });

    console.log('🔍 Technical fields found:', technicalFields);

    // Advanced field mapping with context-aware recognition
    const enhancedFields = technicalFields.map((techField) => {
      const fieldName = techField.name;
      
      // Map field types
      let type = 'text';
      if (techField.type === 'PDFCheckBox') {
        type = 'checkbox';
      } else if (techField.type === 'PDFRadioGroup') {
        type = 'radio';
      } else if (techField.type === 'PDFDropdown') {
        type = 'dropdown';
      }
      
      // Advanced field recognition with context
      const fieldInfo = recognizeField(fieldName, type);
      
      return {
        id: fieldName,
        originalName: fieldInfo.original,
        englishLabel: fieldInfo.english,
        tooltip: `Original: ${fieldInfo.original}`,
        type: type,
        required: fieldInfo.required,
        validation: fieldInfo.validation,
        options: fieldInfo.options,
        autofill: fieldInfo.autofill,
        geminiMatched: false,
        coordinateMatched: false,
        enhanced: true
      };
    });
    
    console.log(`✅ Optimized ${enhancedFields.length} fields with advanced recognition`);

    return NextResponse.json({
      success: true,
      data: {
        id: `temp_${Date.now()}`,
        language: 'DE',
        languageName: 'German',
        formTitle: 'PDF Form (Optimized)',
        fields: enhancedFields,
        totalFields: enhancedFields.length,
        geminiMatchedFields: 0,
        coordinateMatchedFields: 0,
        enhancedFields: enhancedFields.length,
        pdfData: base64
      }
    });

  } catch (error) {
    console.error('Error processing PDF form:', error);
    return NextResponse.json({
      success: false,
      error: `Error processing PDF form: ${error.message}`,
      details: error.message
    }, { status: 500 });
  }
}

function recognizeField(fieldName: string, type: string): {
  original: string;
  english: string;
  required: boolean;
  validation: string;
  options: Array<{ original: string; translated: string }>;
  autofill?: string;
} {
  // Comprehensive field recognition database
  const fieldDatabase: Record<string, {
    original: string;
    english: string;
    required: boolean;
    validation: string;
    options?: Array<{ original: string; translated: string }>;
    autofill?: string;
  }> = {
    // Personal Information
    'firstName': { original: 'Vorname', english: 'First Name', required: true, validation: 'text', autofill: 'user.firstName' },
    'familyName': { original: 'Familienname', english: 'Family Name', required: true, validation: 'text', autofill: 'user.lastName' },
    'lastName': { original: 'Nachname', english: 'Last Name', required: true, validation: 'text', autofill: 'user.lastName' },
    'birthDate': { original: 'Geburtsdatum', english: 'Birth Date', required: true, validation: 'date', autofill: 'user.birthDate' },
    'gender': { 
      original: 'Geschlecht', 
      english: 'Gender', 
      required: true, 
      validation: 'radio',
      autofill: 'user.gender',
      options: [
        { original: 'männlich', translated: 'Male' },
        { original: 'weiblich', translated: 'Female' }
      ]
    },
    
    // Contact Information
    'address': { original: 'Adresse', english: 'Address', required: true, validation: 'text', autofill: 'user.address' },
    'street': { original: 'Strasse', english: 'Street', required: true, validation: 'text', autofill: 'user.street' },
    'houseNumber': { original: 'Hausnummer', english: 'House Number', required: true, validation: 'text', autofill: 'user.houseNumber' },
    'postalCode': { original: 'Postleitzahl', english: 'Postal Code', required: true, validation: 'text', autofill: 'user.postalCode' },
    'city': { original: 'Ort', english: 'City', required: true, validation: 'text', autofill: 'user.city' },
    'phone': { original: 'Telefon', english: 'Phone', required: false, validation: 'tel', autofill: 'user.phone' },
    'email': { original: 'E-Mail', english: 'Email', required: false, validation: 'email', autofill: 'user.email' },
    
    // Family Information
    'hasChildren': { 
      original: 'Hat Kinder', 
      english: 'Has Children', 
      required: false, 
      validation: 'radio',
      autofill: 'user.hasChildren',
      options: [
        { original: 'ja', translated: 'Yes' },
        { original: 'nein', translated: 'No' }
      ]
    },
    'childName': { original: 'Kind Name', english: 'Child Name', required: false, validation: 'text', autofill: 'user.childName' },
    'childBirthDate': { original: 'Kind Geburtsdatum', english: 'Child Birth Date', required: false, validation: 'date', autofill: 'user.childBirthDate' },
    
    // School Information
    'schoolName': { original: 'Schulname', english: 'School Name', required: false, validation: 'text' },
    'grade': { original: 'Klasse', english: 'Grade', required: false, validation: 'text' },
    'schoolYear': { original: 'Schuljahr', english: 'School Year', required: false, validation: 'text' },
    
    // Employment Information
    'employer': { original: 'Arbeitgeber', english: 'Employer', required: false, validation: 'text' },
    'jobTitle': { original: 'Beruf', english: 'Job Title', required: false, validation: 'text' },
    'workAddress': { original: 'Arbeitsadresse', english: 'Work Address', required: false, validation: 'text' },
    
    // Legal Information
    'nationality': { original: 'Nationalität', english: 'Nationality', required: true, validation: 'text', autofill: 'user.nationality' },
    'passportNumber': { original: 'Passnummer', english: 'Passport Number', required: false, validation: 'text', autofill: 'user.passportNumber' },
    'idNumber': { original: 'Ausweisnummer', english: 'ID Number', required: false, validation: 'text', autofill: 'user.idNumber' },
    
    // Emergency Contact
    'emergencyContact': { original: 'Notfallkontakt', english: 'Emergency Contact', required: false, validation: 'text' },
    'emergencyPhone': { original: 'Notfalltelefon', english: 'Emergency Phone', required: false, validation: 'tel' },
    
    // Medical Information
    'healthInsurance': { original: 'Krankenversicherung', english: 'Health Insurance', required: false, validation: 'text' },
    'medicalConditions': { original: 'Gesundheitszustand', english: 'Medical Conditions', required: false, validation: 'text' },
    
    // Language Skills
    'germanLevel': { 
      original: 'Deutschkenntnisse', 
      english: 'German Language Skills', 
      required: false, 
      validation: 'text',
      options: [
        { original: 'gut', translated: 'Good' },
        { original: 'mittel', translated: 'Intermediate' },
        { original: 'schlecht', translated: 'Poor' },
        { original: 'keine', translated: 'None' }
      ]
    },
    'englishLevel': { 
      original: 'Englischkenntnisse', 
      english: 'English Language Skills', 
      required: false, 
      validation: 'text',
      options: [
        { original: 'gut', translated: 'Good' },
        { original: 'mittel', translated: 'Intermediate' },
        { original: 'schlecht', translated: 'Poor' },
        { original: 'keine', translated: 'None' }
      ]
    }
  };
  
  // Direct lookup
  if (fieldDatabase[fieldName]) {
    const field = fieldDatabase[fieldName];
    return {
      original: field.original,
      english: field.english,
      required: field.required,
      validation: field.validation,
      options: field.options || [],
      autofill: field.autofill
    };
  }
  
  // Pattern-based recognition
  const lowerFieldName = fieldName.toLowerCase();
  
  // Name patterns
  if (lowerFieldName.includes('first') || lowerFieldName.includes('vorname')) {
    return { original: 'Vorname', english: 'First Name', required: true, validation: 'text', autofill: 'user.firstName', options: [] };
  }
  if (lowerFieldName.includes('last') || lowerFieldName.includes('nachname') || lowerFieldName.includes('family')) {
    return { original: 'Nachname', english: 'Last Name', required: true, validation: 'text', autofill: 'user.lastName', options: [] };
  }
  if (lowerFieldName.includes('birth') || lowerFieldName.includes('geburt')) {
    return { original: 'Geburtsdatum', english: 'Birth Date', required: true, validation: 'date', autofill: 'user.birthDate', options: [] };
  }
  if (lowerFieldName.includes('gender') || lowerFieldName.includes('geschlecht')) {
    return { 
      original: 'Geschlecht', 
      english: 'Gender', 
      required: true, 
      validation: 'radio',
      autofill: 'user.gender',
      options: [
        { original: 'männlich', translated: 'Male' },
        { original: 'weiblich', translated: 'Female' }
      ]
    };
  }
  
  // Contact patterns
  if (lowerFieldName.includes('address') || lowerFieldName.includes('adresse')) {
    return { original: 'Adresse', english: 'Address', required: true, validation: 'text', autofill: 'user.address', options: [] };
  }
  if (lowerFieldName.includes('phone') || lowerFieldName.includes('telefon')) {
    return { original: 'Telefon', english: 'Phone', required: false, validation: 'tel', autofill: 'user.phone', options: [] };
  }
  if (lowerFieldName.includes('email') || lowerFieldName.includes('mail')) {
    return { original: 'E-Mail', english: 'Email', required: false, validation: 'email', autofill: 'user.email', options: [] };
  }
  
  // School patterns
  if (lowerFieldName.includes('school') || lowerFieldName.includes('schule')) {
    return { original: 'Schule', english: 'School', required: false, validation: 'text', options: [] };
  }
  if (lowerFieldName.includes('grade') || lowerFieldName.includes('klasse')) {
    return { original: 'Klasse', english: 'Grade', required: false, validation: 'text', options: [] };
  }
  
  // Default fallback
  return {
    original: fieldName,
    english: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    required: false,
    validation: 'text',
    options: []
  };
}
