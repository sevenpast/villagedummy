import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SimpleDocumentAnalyzer } from '../../../../services/simple-document-analyzer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }

    console.log('📤 Starting simple upload for:', file.name);

    // Step 1: Simple Document Analysis from Filename
    console.log('🔍 Step 1: Analyzing document from filename');
    const analyzer = new SimpleDocumentAnalyzer();
    const analysisResult = await analyzer.analyzeFromFilename(file.name);
    
    console.log('✅ Analysis completed:', {
      documentType: analysisResult.documentType,
      confidence: analysisResult.confidence,
      tags: analysisResult.tags
    });

    // Step 2: Upload to Supabase Storage
    console.log('☁️ Step 2: Uploading to Supabase Storage');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `documents/${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ Storage upload failed:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    console.log('✅ File uploaded to storage:', filePath);

    // Step 3: Save to Database
    console.log('💾 Step 3: Saving to database');
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId === 'default' ? null : userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        document_type: analysisResult.documentType,
        tags: analysisResult.tags,
        confidence: analysisResult.confidence,
        description: analysisResult.description,
        language: analysisResult.language,
        is_swiss_document: analysisResult.isSwissDocument,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert failed:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return NextResponse.json({ error: 'Failed to save document to database' }, { status: 500 });
    }

    console.log('✅ Document saved to database:', documentData.id);

    return NextResponse.json({
      success: true,
      document: {
        id: documentData.id,
        fileName: file.name,
        documentType: analysisResult.documentType,
        confidence: analysisResult.confidence,
        tags: analysisResult.tags,
        description: analysisResult.description,
        language: analysisResult.language,
        isSwissDocument: analysisResult.isSwissDocument
      },
      analysis: {
        method: 'filename-based',
        confidence: analysisResult.confidence
      }
    });

  } catch (error) {
    console.error('❌ Simple upload failed:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
