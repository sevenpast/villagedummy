import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Simple PDF Fill API called');
    
    const { userId, formId, fieldValues, pdfData } = await request.json();

    console.log('📋 Request data:', {
      userId,
      formId,
      fieldValuesCount: Object.keys(fieldValues || {}).length,
      hasPdfData: !!pdfData
    });

    if (!userId || !fieldValues) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId or fieldValues'
      }, { status: 400 });
    }

    // Load PDF data
    let pdfBuffer: Buffer;
    if (pdfData) {
      pdfBuffer = Buffer.from(pdfData, 'base64');
      console.log('✅ Using PDF data from request');
    } else {
      return NextResponse.json({
        success: false,
        error: 'PDF data is required'
      }, { status: 400 });
    }

    console.log('📄 Loading PDF with pdf-lib...');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();

    console.log(`📋 Filling ${Object.keys(fieldValues).length} fields`);

    // Fill form fields using pdf-lib's built-in form filling
    for (const [fieldName, value] of Object.entries(fieldValues)) {
      try {
        const field = form.getField(fieldName);
        
        if (field) {
          if (field.constructor.name === 'PDFTextField') {
            field.setText(String(value));
          } else if (field.constructor.name === 'PDFCheckBox') {
            if (value === true || value === 'true' || value === 'yes') {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field.constructor.name === 'PDFDropdown') {
            field.select(String(value));
          } else if (field.constructor.name === 'PDFRadioGroup') {
            field.select(String(value));
          }
          
          console.log(`✅ Successfully filled field: ${fieldName}`);
        } else {
          console.warn(`⚠️ Field not found: ${fieldName}`);
        }

      } catch (fieldError) {
        console.error(`❌ Error filling field ${fieldName}:`, fieldError);
        // Continue with other fields
      }
    }

    // Save the modified PDF
    console.log('💾 Saving filled PDF...');
    const pdfBytes = await pdfDoc.save();

    // Return the filled PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"',
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error filling PDF form:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({
      success: false,
      error: `Error filling PDF form: ${error.message}`,
      details: error.message
    }, { status: 500 });
  }
}
