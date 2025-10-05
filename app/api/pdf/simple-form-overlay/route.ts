import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Simple PDF Form Overlay API called');
    
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
      console.error('❌ Missing required data:', { file: !!file, userId: !!userId });
      return NextResponse.json({
        success: false,
        error: 'Missing file or userId'
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json({
        success: false,
        error: 'File must be a PDF'
      }, { status: 400 });
    }

    console.log('📄 Loading PDF with pdf-lib...');
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`📋 Found ${fields.length} form fields in PDF`);

    // Create simple field analysis
    const processedFields = fields.map((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      return {
        id: fieldName,
        originalName: fieldName,
        englishLabel: `Field ${index + 1}: ${fieldName}`,
        tooltip: `Original: ${fieldName}`,
        type: getFieldType(fieldType),
        required: false,
        validation: 'text',
        geminiMatched: false
      };
    });

    console.log(`✅ Processed form with ${processedFields.length} fields`);

    return NextResponse.json({
      success: true,
      data: {
        id: `temp_${Date.now()}`,
        language: 'DE',
        languageName: 'German',
        formTitle: 'PDF Form',
        fields: processedFields,
        totalFields: processedFields.length,
        geminiMatchedFields: 0,
        pdfData: base64
      }
    });

  } catch (error) {
    console.error('Error processing PDF form:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({
      success: false,
      error: `Error processing PDF form: ${error.message}`,
      details: error.message
    }, { status: 500 });
  }
}

function getFieldType(pdfLibType: string): string {
  switch (pdfLibType) {
    case 'PDFTextField':
      return 'text';
    case 'PDFCheckBox':
      return 'checkbox';
    case 'PDFDropdown':
      return 'dropdown';
    case 'PDFRadioGroup':
      return 'radio';
    default:
      return 'text';
  }
}
