import { NextRequest, NextResponse } from 'next/server';
import { PDFFormAnalyzer } from '../../../../services/pdf-form-analyzer';

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
    console.log('🔍 PDF form analysis request for:', file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Analyze the PDF form
    const analyzer = new PDFFormAnalyzer();
    const analysisResult = await analyzer.analyzePDFForm(pdfBuffer, file.name, userData);

    console.log('✅ PDF form analysis completed:', {
      documentType: analysisResult.documentType,
      fieldsCount: analysisResult.fields.length,
      confidence: analysisResult.confidence
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('❌ PDF form analysis API error:', error);
    return NextResponse.json({
      error: 'PDF form analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
