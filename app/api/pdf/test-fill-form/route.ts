import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Test PDF Fill API called');
    
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
            console.log(`✅ Filled text field: ${fieldName} = ${value}`);
          } else if (field.constructor.name === 'PDFCheckBox') {
            if (value === true || value === 'true' || value === 'yes') {
              field.check();
              console.log(`✅ Checked checkbox: ${fieldName}`);
            } else {
              field.uncheck();
              console.log(`✅ Unchecked checkbox: ${fieldName}`);
            }
          } else if (field.constructor.name === 'PDFDropdown') {
            field.select(String(value));
            console.log(`✅ Selected dropdown: ${fieldName} = ${value}`);
          } else if (field.constructor.name === 'PDFRadioGroup') {
            field.select(String(value));
            console.log(`✅ Selected radio: ${fieldName} = ${value}`);
          }
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
    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"',
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error filling PDF form:', error);
    return NextResponse.json({
      success: false,
      error: `Error filling PDF form: ${error instanceof Error ? error.message : String(error)}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
