import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Fill PDF with Coordinates API called');
    
    const body = await request.json();
    const { pdfData, fieldValues, originalPdfBase64 } = body;
    
    if (!pdfData || !fieldValues) {
      return NextResponse.json({ error: 'Missing pdfData or fieldValues' }, { status: 400 });
    }

    console.log(`📄 Filling PDF with ${Object.keys(fieldValues).length} field values`);

    // Load the original PDF
    let pdfBytes: Uint8Array;
    if (originalPdfBase64) {
      // Use the original PDF from the request
      pdfBytes = Buffer.from(originalPdfBase64, 'base64');
    } else {
      // Use a default PDF (fallback)
      return NextResponse.json({ error: 'No original PDF provided' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    console.log(`📏 PDF dimensions: ${width} x ${height}`);

    // Fill the PDF with field values using coordinates
    for (const [fieldName, value] of Object.entries(fieldValues)) {
      if (!value || value === '') continue;

      // Find the field definition in pdfData
      const fieldDef = pdfData.fields?.find((f: any) => f.fieldName === fieldName);
      if (!fieldDef || !fieldDef.position) continue;

      const { x, y } = fieldDef.position;
      const { width: fieldWidth = 150, height: fieldHeight = 25 } = fieldDef.size || {};

      console.log(`✏️ Filling field "${fieldName}" at position (${x}, ${y}) with value: "${value}"`);

      // Convert coordinates (PDF coordinates start from bottom-left)
      const pdfY = height - y - fieldHeight;

      // Add text to the PDF
      firstPage.drawText(String(value), {
        x: x,
        y: pdfY,
        size: 10,
        color: rgb(0, 0, 0), // Black text
      });

      // For checkboxes, draw a small box
      if (fieldDef.fieldType === 'checkbox' && value === 'true') {
        firstPage.drawRectangle({
          x: x,
          y: pdfY,
          width: 10,
          height: 10,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        
        // Draw a checkmark
        firstPage.drawText('✓', {
          x: x + 2,
          y: pdfY + 2,
          size: 8,
          color: rgb(0, 0, 0),
        });
      }
    }

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    
    console.log(`✅ PDF filled successfully, size: ${filledPdfBytes.length} bytes`);

    // Return the filled PDF as base64
    const filledPdfBase64 = Buffer.from(filledPdfBytes).toString('base64');

    return NextResponse.json({
      success: true,
      filledPdf: filledPdfBase64,
      message: `PDF filled with ${Object.keys(fieldValues).length} field values`
    });

  } catch (error) {
    console.error('❌ PDF filling failed:', error);
    
    return NextResponse.json({ 
      error: 'PDF filling failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
