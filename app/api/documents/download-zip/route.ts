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

    // Fetch all documents for the user (same fields as load API)
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, file_name, file_type, file_size, document_type, uploaded_at, storage_path')
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
        // Use the correct field names from the database
        const storagePath = doc.storage_path;
        
        if (storagePath) {
          // Download file from Supabase Storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(storagePath);

          if (downloadError) {
            console.error(`❌ Error downloading ${storagePath}:`, downloadError);
            continue;
          }

          // Convert blob to buffer
          const arrayBuffer = await fileData.arrayBuffer();
          
          // Create a clean filename using the correct field names
          const cleanFilename = doc.file_name || `${doc.document_type || 'document'}_${doc.id}.pdf`;
          
          // Add file to ZIP
          zip.file(cleanFilename, arrayBuffer);
          
          console.log(`✅ Added ${cleanFilename} to ZIP`);
        } else {
          console.warn(`⚠️ No storage path found for document ${doc.id}:`, doc);
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
