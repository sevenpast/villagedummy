import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Document upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const documentType = formData.get('documentType') as string;
    const tags = formData.get('tags') as string;
    const confidence = formData.get('confidence') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate unique filename with safe characters
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    
    // Clean filename: remove special characters and spaces
    const cleanFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')  // Replace special chars with underscore
      .replace(/_+/g, '_')              // Replace multiple underscores with single
      .replace(/^_|_$/g, '');           // Remove leading/trailing underscores
    
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    
    // Clean userId for storage path
    const cleanUserId = userId.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${cleanUserId}/${uniqueFileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // Use provided document type or run intelligent analysis
    let finalDocumentType = documentType;
    let finalTags = ['unrecognized'];
    let finalConfidence = 0.5;
    
    if (!finalDocumentType) {
      try {
        // Call intelligent analysis API
        const analysisFormData = new FormData();
        analysisFormData.append('file', file);
        analysisFormData.append('userId', userId);

        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/analyze-intelligent`, {
          method: 'POST',
          body: analysisFormData,
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (analysisData.success && analysisData.analysis) {
            const analysis = analysisData.analysis;
            finalDocumentType = analysis.documentType;
            finalTags = analysis.tags || [];
            finalConfidence = analysis.confidence || 0.5;
            
            console.log(`✅ AI Analysis completed: ${finalDocumentType} (confidence: ${finalConfidence})`);
            console.log(`🏷️ Tags: ${finalTags.join(', ')}`);
          }
        } else {
          throw new Error('AI analysis failed');
        }
      } catch (error) {
        console.log('⚠️ AI analysis error, using fallback detection:', error);
        
        // Fallback to filename-based detection
        const fileName = file.name.toLowerCase();
        if (fileName.includes('passport') || fileName.includes('pass') || fileName.includes('reisepass')) {
          finalDocumentType = 'Reisepass/ID';
          finalTags = ['passport', 'identity'];
          finalConfidence = 0.8;
        } else if (fileName.includes('id') || fileName.includes('identity')) {
          finalDocumentType = 'Reisepass/ID';
          finalTags = ['id', 'identity'];
          finalConfidence = 0.8;
        } else if (fileName.includes('diploma') || fileName.includes('degree') || fileName.includes('zeugnis')) {
          finalDocumentType = 'Diplome & Zertifikate';
          finalTags = ['education', 'certificate'];
          finalConfidence = 0.8;
        } else if (fileName.includes('contract') || fileName.includes('employment')) {
          finalDocumentType = 'Arbeitsvertrag';
          finalTags = ['employment', 'contract'];
          finalConfidence = 0.8;
        } else if (fileName.includes('rental') || fileName.includes('miete')) {
          finalDocumentType = 'Mietvertrag';
          finalTags = ['rental', 'housing'];
          finalConfidence = 0.8;
        } else if (fileName.includes('insurance') || fileName.includes('versicherung')) {
          finalDocumentType = 'Versicherungsunterlagen';
          finalTags = ['insurance', 'health'];
          finalConfidence = 0.8;
        } else if (fileName.includes('birth') || fileName.includes('geburt')) {
          finalDocumentType = 'Geburtsurkunde';
          finalTags = ['birth', 'certificate'];
          finalConfidence = 0.8;
        } else if (fileName.includes('marriage') || fileName.includes('heirat')) {
          finalDocumentType = 'Heiratsurkunde';
          finalTags = ['marriage', 'certificate'];
          finalConfidence = 0.8;
        } else {
          finalDocumentType = 'Unbekanntes Dokument';
          finalTags = ['unrecognized'];
          finalConfidence = 0.3;
        }
        
        console.log(`✅ Fallback detection: ${finalDocumentType} (confidence: ${finalConfidence})`);
      }
    }

    // Use tags and confidence from intelligent analysis or provided values
    let parsedTags = finalTags;
    let parsedConfidence = finalConfidence;
    
    try {
      if (tags) {
        parsedTags = JSON.parse(tags);
      }
      if (confidence) {
        parsedConfidence = parseFloat(confidence);
      }
    } catch (error) {
      console.warn('Failed to parse provided tags or confidence, using AI analysis results');
    }

    // Save document metadata to database with AI analysis results
    // Handle non-UUID user IDs by using null for user_id
    // Temporarily use basic structure until database schema is updated
    const insertData = {
      user_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ? userId : null,
      file_name: file.name,
      file_type: file.type || `application/${fileExtension}`,
      file_size: file.size,
      storage_path: storagePath,
      document_type: finalDocumentType,
      uploaded_at: new Date().toISOString()
    };

    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
    }

    console.log(`✅ Document uploaded successfully: ${file.name}`);

    return NextResponse.json({
      success: true,
      document: {
        id: dbData.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType: documentType,
        uploadedAt: dbData.uploaded_at,
        storagePath: storagePath
      }
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}