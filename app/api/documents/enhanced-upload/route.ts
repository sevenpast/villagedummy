import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EnhancedOCRService } from '../../../../services/enhanced-ocr-service';
import { EnhancedGeminiAnalysisService } from '../../../../services/enhanced-gemini-analysis-service';

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

    console.log('📤 Starting enhanced upload for:', file.name);

    // Step 1: OCR Analysis
    console.log('🔍 Step 1: OCR Analysis');
    const ocrService = new EnhancedOCRService();
    const ocrResult = await ocrService.analyzeDocument(file);
    
    console.log('✅ OCR Analysis completed:', {
      textLength: ocrResult.text.length,
      confidence: ocrResult.confidence,
      blocks: ocrResult.layout.blocks.length,
      images: ocrResult.images.length
    });

    // Step 2: Gemini Analysis with OCR Data
    console.log('🧠 Step 2: Gemini Analysis with OCR Data');
    const geminiService = new EnhancedGeminiAnalysisService();
    const analysisResult = await geminiService.analyzeDocumentWithOCR(ocrResult, file.name);
    
    console.log('✅ Gemini Analysis completed:', {
      documentType: analysisResult.documentType,
      confidence: analysisResult.confidence,
      tags: analysisResult.tags,
      isSwissDocument: analysisResult.isSwissDocument
    });

    // Step 3: Upload to Supabase Storage
    console.log('☁️ Step 3: Uploading to Supabase Storage');
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

    // Step 4: Save to Database with Enhanced Analysis
    console.log('💾 Step 4: Saving to database with enhanced analysis');
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
        extracted_text: ocrResult.text,
        ocr_data: ocrResult, // Store full OCR result
        analysis_data: analysisResult, // Store full analysis result
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
        ocrConfidence: ocrResult.confidence,
        geminiConfidence: analysisResult.confidence,
        textLength: ocrResult.text.length,
        extractedFields: analysisResult.extractedData.keyFields.length
      }
    });

  } catch (error) {
    console.error('❌ Enhanced upload failed:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
