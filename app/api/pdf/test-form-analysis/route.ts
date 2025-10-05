import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Test PDF Form Analysis API called');
    
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

    // Extract real form fields from PDF
    const realFields = fields.map((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      // Map field types to our system
      let type = 'text';
      if (fieldType === 'PDFCheckBox') {
        type = 'checkbox';
      } else if (fieldType === 'PDFRadioGroup') {
        type = 'radio';
      } else if (fieldType === 'PDFDropdown') {
        type = 'dropdown';
      }
      
      // Create user-friendly labels based on field name
      let englishLabel = fieldName;
      let originalName = fieldName;
      
      // Common field name mappings
      const fieldMappings: Record<string, { original: string; english: string }> = {
        'firstName': { original: 'Vorname', english: 'First Name' },
        'lastName': { original: 'Nachname', english: 'Last Name' },
        'birthDate': { original: 'Geburtsdatum', english: 'Birth Date' },
        'gender': { original: 'Geschlecht', english: 'Gender' },
        'address': { original: 'Adresse', english: 'Address' },
        'phone': { original: 'Telefon', english: 'Phone' },
        'email': { original: 'E-Mail', english: 'Email' },
        'hasChildren': { original: 'Hat Kinder', english: 'Has Children' }
      };
      
      if (fieldMappings[fieldName]) {
        originalName = fieldMappings[fieldName].original;
        englishLabel = fieldMappings[fieldName].english;
      } else {
        // Convert camelCase to readable format
        englishLabel = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      }
      
      return {
        id: fieldName,
        originalName: originalName,
        englishLabel: englishLabel,
        tooltip: `Original: ${originalName}`,
        type: type,
        required: false,
        validation: 'text',
        options: [],
        geminiMatched: false, // Real fields, not AI-generated
        coordinateMatched: false
      };
    });

    console.log(`✅ Extracted ${realFields.length} real form fields from PDF`);

    return NextResponse.json({
      success: true,
      data: {
        id: `temp_${Date.now()}`,
        language: 'DE',
        languageName: 'German',
        formTitle: 'School Registration Form',
        fields: realFields,
        totalFields: realFields.length,
        geminiMatchedFields: 0, // Real fields, not AI-generated
        coordinateMatchedFields: 0,
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
