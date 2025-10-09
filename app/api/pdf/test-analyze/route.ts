import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData } = body;

    console.log('🔍 Test PDF analysis request');

    // Create simple analysis result
    const analysisResult = {
      fields: [
        {
          name: 'vorname',
          label: 'First Name',
          type: 'text',
          value: userData?.first_name || '',
          required: false,
          confidence: 1.0,
          userDataMatch: 'first_name'
        },
        {
          name: 'nachname',
          label: 'Last Name',
          type: 'text',
          value: userData?.last_name || '',
          required: false,
          confidence: 1.0,
          userDataMatch: 'last_name'
        },
        {
          name: 'email',
          label: 'Email',
          type: 'text',
          value: userData?.email || '',
          required: false,
          confidence: 1.0,
          userDataMatch: 'email'
        }
      ].filter(field => field.value !== ''), // Only include fields with data
      documentType: 'Form Document',
      language: 'de',
      confidence: 1.0,
      extractedText: ''
    };

    console.log('✅ Test PDF analysis completed:', {
      documentType: analysisResult.documentType,
      fieldsCount: analysisResult.fields.length
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('❌ Test PDF analysis API error:', error);
    return NextResponse.json({
      error: 'PDF analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
