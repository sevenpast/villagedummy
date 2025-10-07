import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('📥 Document download API called');
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const userId = searchParams.get('userId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get document metadata
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path, file_name, file_type')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching document:', fetchError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError) {
      console.error('❌ Storage download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();

    console.log(`✅ Document downloaded successfully: ${document.file_name}`);

    // Return the file with proper headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': document.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.file_name}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Download failed:', error);
    return NextResponse.json({
      error: 'Download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}