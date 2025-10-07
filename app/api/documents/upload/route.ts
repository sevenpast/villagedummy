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

    // Use provided document type or fallback to filename analysis
    let finalDocumentType = documentType;
    if (!finalDocumentType) {
      const fileName = file.name.toLowerCase();
      
      if (fileName.includes('passport') || fileName.includes('pass')) {
        finalDocumentType = 'Passport';
      } else if (fileName.includes('id') || fileName.includes('identity')) {
        finalDocumentType = 'ID Card';
      } else if (fileName.includes('contract') || fileName.includes('employment')) {
        finalDocumentType = 'Employment Contract';
      } else if (fileName.includes('rental') || fileName.includes('lease')) {
        finalDocumentType = 'Rental Agreement';
      } else if (fileName.includes('insurance')) {
        finalDocumentType = 'Insurance';
      } else if (fileName.includes('birth') || fileName.includes('certificate')) {
        finalDocumentType = 'Birth Certificate';
      } else if (fileName.includes('marriage')) {
        finalDocumentType = 'Marriage Certificate';
      } else if (fileName.includes('diploma') || fileName.includes('degree')) {
        finalDocumentType = 'Education Certificate';
      } else {
        finalDocumentType = 'Other';
      }
    }

    // Parse tags and confidence from Gemini analysis
    let parsedTags = ['unrecognized'];
    let parsedConfidence = 0.5;
    
    try {
      if (tags) {
        parsedTags = JSON.parse(tags);
      }
      if (confidence) {
        parsedConfidence = parseFloat(confidence);
      }
    } catch (error) {
      console.warn('Failed to parse tags or confidence, using defaults');
    }

    // Save document metadata to database
    // Handle non-UUID user IDs by using null for user_id
    const insertData = {
      user_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ? userId : null,
      file_name: file.name,
      file_type: file.type || `application/${fileExtension}`,
      file_size: file.size,
      storage_path: storagePath,
      document_type: finalDocumentType,
      tags: parsedTags,
      confidence: parsedConfidence,
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