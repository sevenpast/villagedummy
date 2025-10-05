import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Enhanced PDF Form Analysis API called');
    
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

    // Enhanced field mapping with better German labels
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
      
      // Enhanced field name mappings with more German variations
      const fieldMappings: Record<string, { original: string; english: string; description: string }> = {
        'firstName': { 
          original: 'Vorname', 
          english: 'First Name',
          description: 'Given name or first name'
        },
        'familyName': { 
          original: 'Familienname', 
          english: 'Family Name',
          description: 'Surname or family name'
        },
        'lastName': { 
          original: 'Nachname', 
          english: 'Last Name',
          description: 'Surname or last name'
        },
        'birthDate': { 
          original: 'Geburtsdatum', 
          english: 'Birth Date',
          description: 'Date of birth (DD.MM.YYYY)'
        },
        'gender': { 
          original: 'Geschlecht', 
          english: 'Gender',
          description: 'Gender (Male/Female)'
        },
        'address': { 
          original: 'Adresse', 
          english: 'Address',
          description: 'Street address'
        },
        'phone': { 
          original: 'Telefon', 
          english: 'Phone',
          description: 'Phone number'
        },
        'email': { 
          original: 'E-Mail', 
          english: 'Email',
          description: 'Email address'
        },
        'hasChildren': { 
          original: 'Hat Kinder', 
          english: 'Has Children',
          description: 'Do you have children?'
        },
        'childName': {
          original: 'Kind Name',
          english: 'Child Name',
          description: 'Name of the child'
        },
        'childBirthDate': {
          original: 'Kind Geburtsdatum',
          english: 'Child Birth Date',
          description: 'Child\'s date of birth'
        },
        'schoolName': {
          original: 'Schulname',
          english: 'School Name',
          description: 'Name of the school'
        },
        'grade': {
          original: 'Klasse',
          english: 'Grade',
          description: 'School grade/class'
        }
      };
      
      let originalName = fieldName;
      let englishLabel = fieldName;
      let description = '';
      
      if (fieldMappings[fieldName]) {
        const mapping = fieldMappings[fieldName];
        originalName = mapping.original;
        englishLabel = mapping.english;
        description = mapping.description;
      } else {
        // Convert camelCase to readable format
        englishLabel = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        originalName = englishLabel; // Fallback
      }
      
      return {
        id: fieldName,
        originalName: originalName,
        englishLabel: englishLabel,
        tooltip: `Original: ${originalName}${description ? ` - ${description}` : ''}`,
        type: type,
        required: false,
        validation: getValidationType(fieldName, type),
        options: getFieldOptions(fieldName, type),
        geminiMatched: false,
        coordinateMatched: false,
        enhanced: true
      };
    });
    
    console.log(`✅ Enhanced ${enhancedFields.length} fields with better mappings`);

    return NextResponse.json({
      success: true,
      data: {
        id: `temp_${Date.now()}`,
        language: 'DE',
        languageName: 'German',
        formTitle: 'PDF Form (Enhanced)',
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

function getValidationType(fieldName: string, type: string): string {
  if (type === 'checkbox' || type === 'radio') return 'text';
  if (fieldName.toLowerCase().includes('email')) return 'email';
  if (fieldName.toLowerCase().includes('phone')) return 'tel';
  if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('birth')) return 'date';
  if (fieldName.toLowerCase().includes('number')) return 'number';
  return 'text';
}

function getFieldOptions(fieldName: string, type: string): Array<{ original: string; translated: string }> {
  if (type === 'radio' && fieldName.toLowerCase().includes('gender')) {
    return [
      { original: 'männlich', translated: 'Male' },
      { original: 'weiblich', translated: 'Female' }
    ];
  }
  
  if (type === 'checkbox' && fieldName.toLowerCase().includes('children')) {
    return [
      { original: 'ja', translated: 'Yes' },
      { original: 'nein', translated: 'No' }
    ];
  }
  
  return [];
}
