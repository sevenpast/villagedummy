import { NextRequest, NextResponse } from 'next/server';
import { cleanDocumentAnalyzer } from '../../../../services/clean-document-analyzer';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Clean document analysis API called');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 Analyzing file: ${file.name} (${file.type})`);

    // Analyze document using clean analyzer
    const analysis = await cleanDocumentAnalyzer.analyzeDocument(file);

    console.log(`✅ Analysis completed: ${analysis.documentType} (confidence: ${analysis.confidence})`);

    return NextResponse.json({
      success: true,
      analysis: {
        documentType: analysis.documentType,
        confidence: analysis.confidence,
        tags: analysis.tags,
        description: analysis.description,
        language: analysis.language,
        isSwissDocument: analysis.isSwissDocument,
        extractedText: analysis.extractedText
      }
    });

  } catch (error) {
    console.error('❌ Clean analysis failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Document analysis failed' 
    }, { status: 500 });
  }
}
