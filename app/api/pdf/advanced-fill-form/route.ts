import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
// Note: pdfjs-dist is browser-focused and requires DOM APIs (e.g., DOMMatrix).
// It is not needed for server-side filling with pdf-lib, so we avoid importing it here
// to keep the server build environment Node-compatible on Vercel.

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Advanced PDF Fill API called');
    
    const { userId, formId, fieldValues, pdfData, formAnalysis } = await request.json();

    console.log('📋 Request data:', {
      userId,
      formId,
      fieldValuesCount: Object.keys(fieldValues || {}).length,
      hasPdfData: !!pdfData,
      hasFormAnalysis: !!formAnalysis
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
        error: 'PDF data is required for coordinate-based filling'
      }, { status: 400 });
    }

    console.log('📄 Loading PDF with pdf-lib...');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    console.log(`📋 Filling ${Object.keys(fieldValues).length} fields with coordinate mapping`);

    // Fill form fields using coordinate mapping
    for (const [fieldId, value] of Object.entries(fieldValues)) {
      try {
        // Find field info from form analysis
        const fieldInfo = formAnalysis?.fields?.find((f: any) => f.id === fieldId);
        
        if (!fieldInfo || !fieldInfo.inputCoords || !fieldInfo.coordinateMatched) {
          console.warn(`⚠️ No coordinate mapping for field: ${fieldId}`);
          continue;
        }

        const pageIndex = fieldInfo.page || 0;
        if (pageIndex >= pages.length) {
          console.warn(`⚠️ Page index ${pageIndex} out of range for field: ${fieldId}`);
          continue;
        }

        const page = pages[pageIndex];
        const coords = fieldInfo.inputCoords;

        console.log(`📍 Filling field ${fieldId} at coordinates (${coords.x}, ${coords.y}) on page ${pageIndex}`);

        if (fieldInfo.type === 'text') {
          // Insert text at coordinates
          page.drawText(String(value), {
            x: coords.x,
            y: coords.y,
            size: 11,
            color: rgb(0, 0, 0),
          });
        } else if (fieldInfo.type === 'checkbox') {
          // Draw a checkmark for checkboxes
          if (value === true || value === 'true' || value === 'yes') {
            // Draw checkmark (two lines forming a check)
            const checkSize = 6;
            const centerX = coords.x + checkSize / 2;
            const centerY = coords.y - checkSize / 2;
            
            // First line of checkmark (top-left to center)
            page.drawLine({
              start: { x: centerX - checkSize/2, y: centerY + checkSize/3 },
              end: { x: centerX - checkSize/6, y: centerY - checkSize/6 },
              thickness: 1.5,
              color: rgb(0, 0, 0),
            });
            
            // Second line of checkmark (center to bottom-right)
            page.drawLine({
              start: { x: centerX - checkSize/6, y: centerY - checkSize/6 },
              end: { x: centerX + checkSize/2, y: centerY + checkSize/2 },
              thickness: 1.5,
              color: rgb(0, 0, 0),
            });
          }
        } else if (fieldInfo.type === 'radio') {
          // Draw a filled circle for radio buttons
          if (value === true || value === 'true' || value === 'yes') {
            page.drawCircle({
              x: coords.x + 4,
              y: coords.y - 4,
              size: 3,
              borderColor: rgb(0, 0, 0),
              borderWidth: 1,
              color: rgb(0, 0, 0),
            });
          }
        }

        console.log(`✅ Successfully filled field: ${fieldId}`);

      } catch (fieldError) {
        console.error(`❌ Error filling field ${fieldId}:`, fieldError);
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({
      success: false,
      error: `Error filling PDF form: ${error instanceof Error ? error.message : String(error)}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
