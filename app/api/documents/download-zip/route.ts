import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('📦 ZIP Download API called');
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all documents for the user
    let query = supabase
      .from('documents')
      .select('id, file_name, file_type, file_size, document_type, uploaded_at, storage_path')
      .order('uploaded_at', { ascending: false });
    
    // Only filter by user_id if it's a valid UUID, otherwise get all documents
    if (userId && userId !== 'default' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      query = query.eq('user_id', userId);
    }
    
    const { data: documents, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Error fetching documents:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch documents',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    console.log(`📄 Found ${documents.length} documents for user ${userId}`);

    // Create a new ZIP file
    const zip = new JSZip();

    // Download each document and add to ZIP
    for (const doc of documents) {
      try {
        if (doc.storage_path) {
          // Download file from Supabase Storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(doc.storage_path);

          if (downloadError) {
            console.error(`❌ Error downloading ${doc.storage_path}:`, downloadError);
            continue;
          }

          // Convert blob to buffer
          const arrayBuffer = await fileData.arrayBuffer();
          
          // Create a clean filename
          const cleanFilename = doc.file_name || `${doc.document_type || 'document'}_${doc.id}.pdf`;
          
          // Add file to ZIP
          zip.file(cleanFilename, arrayBuffer);
          
          console.log(`✅ Added ${cleanFilename} to ZIP`);
        }
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error);
        continue;
      }
    }

    // Check if any files were added to the ZIP
    const zipFiles = Object.keys(zip.files);
    if (zipFiles.length === 0) {
      return NextResponse.json({ error: 'No files could be added to ZIP' }, { status: 404 });
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    console.log(`✅ ZIP created successfully with ${zipFiles.length} files`);

    // Return the ZIP file as a Blob
    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="documents_${userId}_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });

  } catch (error) {
    console.error('❌ ZIP download failed:', error);
    return NextResponse.json({
      error: 'Failed to generate ZIP file',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
