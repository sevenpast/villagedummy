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

    // Fetch all documents for the user
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('❌ Error fetching documents:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
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
          const cleanFilename = doc.original_filename || 
            `${doc.document_type || 'document'}_${doc.id}.pdf`;
          
          // Add file to ZIP
          zip.file(cleanFilename, arrayBuffer);
          
          console.log(`✅ Added ${cleanFilename} to ZIP`);
        }
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error);
        continue;
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    console.log('✅ ZIP file generated successfully');

    // Return ZIP file as response
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="documents_${userId}_${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ ZIP download failed:', error);
    return NextResponse.json({ 
      error: 'Failed to create ZIP file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
