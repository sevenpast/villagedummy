import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('👁️ Document preview API called');
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const userId = searchParams.get('userId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, get the document to find the storage path
    let query = supabase
      .from('documents')
      .select('storage_path, file_name, file_type')
      .eq('id', documentId);
    
    // Only filter by user_id if it's a valid UUID, otherwise get documents with null user_id
    if (userId && userId !== 'default' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      query = query.eq('user_id', userId);
    } else {
      // For non-UUID user IDs, get documents with null user_id
      query = query.is('user_id', null);
    }
    
    const { data: document, error: fetchError } = await query.single();

    if (fetchError) {
      console.error('❌ Error fetching document:', fetchError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError) {
      console.error('❌ Storage download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();

    console.log(`✅ Document preview loaded successfully: ${document.file_name}`);

    // Return the file with proper headers for preview
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': document.file_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${document.file_name}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('❌ Preview failed:', error);
    return NextResponse.json({
      error: 'Preview failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
