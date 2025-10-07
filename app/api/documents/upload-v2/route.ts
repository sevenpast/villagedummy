import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Document upload API v2 called');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }

    // Generate unique storage path
    const fileExtension = file.name.split('.').pop() || 'bin';
    const documentId = crypto.randomUUID();
    const storagePath = `${userId}/${documentId}/${file.name}`;

    console.log(`📄 Uploading: ${file.name} to ${storagePath}`);

    // 1. Insert document record first
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        storage_bucket: 'documents',
        storage_path: storagePath,
        mime_type: file.type || `application/${fileExtension}`,
        size_bytes: file.size,
        status: 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 });
    }

    // 2. Upload file to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type
      });

    if (storageError) {
      console.error('❌ Storage upload error:', storageError);
      
      // Cleanup database record
      await supabase.from('documents').delete().eq('id', document.id);
      
      return NextResponse.json({ 
        error: 'Storage upload failed', 
        details: storageError.message 
      }, { status: 500 });
    }

    // 3. Trigger classification (the trigger will automatically enqueue the job)
    console.log(`✅ Document uploaded successfully: ${file.name}`);
    console.log(`🔄 Classification job will be automatically enqueued for document ${document.id}`);

    return NextResponse.json({
      success: true,
      documentId: document.id,
      message: 'Document uploaded and classification queued'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
