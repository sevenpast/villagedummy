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

    // Determine document type based on filename and content
    let documentType = 'Other';
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('passport') || fileName.includes('pass')) {
      documentType = 'Passport';
    } else if (fileName.includes('id') || fileName.includes('identity')) {
      documentType = 'ID Card';
    } else if (fileName.includes('contract') || fileName.includes('employment')) {
      documentType = 'Employment Contract';
    } else if (fileName.includes('rental') || fileName.includes('lease')) {
      documentType = 'Rental Agreement';
    } else if (fileName.includes('insurance')) {
      documentType = 'Insurance';
    } else if (fileName.includes('birth') || fileName.includes('certificate')) {
      documentType = 'Birth Certificate';
    } else if (fileName.includes('marriage')) {
      documentType = 'Marriage Certificate';
    } else if (fileName.includes('diploma') || fileName.includes('degree')) {
      documentType = 'Education Certificate';
    }

    // Save document metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_type: file.type || `application/${fileExtension}`,
        file_size: file.size,
        storage_path: storagePath,
        document_type: documentType,
        uploaded_at: new Date().toISOString()
      })
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