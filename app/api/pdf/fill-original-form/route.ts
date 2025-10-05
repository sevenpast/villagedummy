import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, formId, fieldValues, pdfData } = await request.json();

    if (!userId || !formId || !fieldValues) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId, formId, or fieldValues'
      }, { status: 400 });
    }

    console.log(`📝 Filling original PDF form: ${formId}`);

    let pdfBuffer: Buffer;

    // Try to get PDF data from request first (for temporary forms)
    if (pdfData) {
      pdfBuffer = Buffer.from(pdfData, 'base64');
      console.log('✅ Using PDF data from request');
    } else {
      // Try to get from database
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({
          success: false,
          error: 'No PDF data provided and database not configured'
        }, { status: 500 });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: formAnalysis, error: fetchError } = await supabase
        .from('form_analyses')
        .select('*')
        .eq('id', formId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !formAnalysis) {
        return NextResponse.json({
          success: false,
          error: 'Form analysis not found'
        }, { status: 404 });
      }

      pdfBuffer = Buffer.from(formAnalysis.pdf_data, 'base64');
      console.log('✅ Using PDF data from database');
    }
    console.log('📄 Loading PDF with pdf-lib...');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();

    console.log(`📋 Filling ${Object.keys(fieldValues).length} fields`);

    // Fill form fields with English values, keeping original field names
    for (const [fieldId, value] of Object.entries(fieldValues)) {
      try {
        const field = form.getField(fieldId);
        
        if (field.constructor.name === 'PDFTextField') {
          (field as any).setText(String(value));
        } else if (field.constructor.name === 'PDFCheckBox') {
          if (value === true || value === 'true' || value === 'yes') {
            (field as any).check();
          } else {
            (field as any).uncheck();
          }
        } else if (field.constructor.name === 'PDFDropdown') {
          (field as any).select(String(value));
        } else if (field.constructor.name === 'PDFRadioGroup') {
          (field as any).select(String(value));
        }
        
        console.log(`✅ Filled field: ${fieldId} = ${value}`);
      } catch (fieldError) {
        console.warn(`⚠️ Could not fill field ${fieldId}:`, fieldError);
        // Continue with other fields
      }
    }

    // Flatten form to prevent further editing (optional)
    form.flatten();

    // Generate filled PDF
    const filledPdfBytes = await pdfDoc.save();

    console.log(`✅ Generated filled PDF (${filledPdfBytes.length} bytes)`);

    // Return filled PDF
    return new NextResponse(filledPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="filled-${formAnalysis.original_filename}"`,
        'Content-Length': filledPdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error filling PDF form:', error);
    return NextResponse.json({
      success: false,
      error: 'Error filling PDF form'
    }, { status: 500 });
  }
}
