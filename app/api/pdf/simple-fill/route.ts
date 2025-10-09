import { NextRequest, NextResponse } from 'next/server';
import { SimplePDFFiller } from '../../../../services/simple-pdf-filler';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userDataJson = formData.get('userData') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userDataJson) {
      return NextResponse.json({ error: 'No user data provided' }, { status: 400 });
    }

    const userData = JSON.parse(userDataJson);
    console.log('📝 Simple PDF fill request for:', file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Fill the PDF with user data
    const result = await SimplePDFFiller.fillPDFWithUserData(pdfBuffer, userData);

    if (!result.success) {
      return NextResponse.json({
        error: 'PDF filling failed',
        details: result.error
      }, { status: 500 });
    }

    // Convert filled PDF back to base64 for response
    const filledPdfBase64 = Buffer.from(await PDFDocument.load(pdfBuffer).then(doc => doc.save())).toString('base64');

    return NextResponse.json({
      success: true,
      message: `Successfully filled ${result.filledFields.length} fields`,
      filledFields: result.filledFields,
      filledPdf: filledPdfBase64
    });

  } catch (error) {
    console.error('❌ Simple PDF fill API error:', error);
    return NextResponse.json({
      error: 'PDF processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
