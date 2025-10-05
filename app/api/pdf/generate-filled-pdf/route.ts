import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Generate Filled PDF API called');
    
    const { originalPdfBase64, formData, elements } = await request.json();
    
    if (!originalPdfBase64 || !formData || !elements) {
      return NextResponse.json({ 
        error: 'Missing required data: originalPdfBase64, formData, or elements' 
      }, { status: 400 });
    }

    console.log(`📄 Processing form data with ${Object.keys(formData).length} fields`);
    console.log(`📋 Processing ${elements.length} elements`);

    // Load the original PDF
    const pdfBytes = Buffer.from(originalPdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    console.log(`📄 Loaded PDF with ${pages.length} pages`);

    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    // Process each element and fill the PDF
    let filledFields = 0;
    
    for (const element of elements) {
      if (element.elementType === 'input_field' && element.original_text) {
        const fieldKey = element.original_text.replace(/[^a-zA-Z0-9]/g, '');
        const value = formData[fieldKey];
        
        if (value !== undefined && value !== null && value !== '') {
          const page = pages[element.pageNumber - 1];
          if (page) {
            const { width: pageWidth, height: pageHeight } = page.getSize();
            
            // Convert relative coordinates to absolute coordinates
            const x = (element.position.x / 100) * pageWidth;
            const y = pageHeight - (element.position.y / 100) * pageHeight - (element.size.height / 100) * pageHeight;
            const fieldWidth = (element.size.width / 100) * pageWidth;
            const fieldHeight = (element.size.height / 100) * pageHeight;
            
            // Handle different field types
            if (element.field_type === 'checkbox' && value === true) {
              // Draw a checkmark for checkboxes
              page.drawText('✓', {
                x: x + 2,
                y: y + 2,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
              });
            } else if (element.field_type === 'date') {
              // Format date properly
              const dateValue = typeof value === 'string' ? value : new Date(value).toISOString().split('T')[0];
              page.drawText(dateValue, {
                x: x + 2,
                y: y + 2,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
              });
            } else {
              // Regular text field
              const textValue = String(value);
              
              // Truncate text if it's too long for the field
              const maxChars = Math.floor(fieldWidth / (fontSize * 0.6));
              const displayText = textValue.length > maxChars ? textValue.substring(0, maxChars) + '...' : textValue;
              
              page.drawText(displayText, {
                x: x + 2,
                y: y + 2,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
              });
            }
            
            filledFields++;
            console.log(`✏️ Filled field "${element.original_text}" with value: "${value}"`);
          }
        }
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    console.log(`✅ PDF filled successfully: ${filledFields} fields filled`);
    console.log(`📄 Final PDF size: ${modifiedPdfBytes.length} bytes`);

    // Return the filled PDF
    return new NextResponse(modifiedPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"',
        'Content-Length': modifiedPdfBytes.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return NextResponse.json({ 
      error: 'PDF generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
