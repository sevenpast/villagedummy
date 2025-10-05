import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is not configured in environment variables.');
    return NextResponse.json({
      success: false,
      error: 'Datenbankverbindung ist nicht konfiguriert.',
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { userId, documentIds } = await request.json();

    if (!userId || !documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId or documentIds' 
      }, { status: 400 });
    }

    console.log(`🔗 Creating signed URLs for user ${userId} with ${documentIds.length} documents`);

    // Get documents from database
    const { data: documents, error } = await supabase
      .from('documents_vault')
      .select('id, file_name, original_name, file_type')
      .eq('user_id', userId)
      .in('id', documentIds);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to load documents from database'
      }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No documents found'
      }, { status: 404 });
    }

    // Create signed URLs for each document
    const links = [];
    for (const doc of documents) {
      try {
        // Create signed URL valid for 1 hour (3600 seconds)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(`${userId}/${doc.file_name}`, 3600);

        if (signedUrlError) {
          console.error(`❌ Error creating signed URL for document ${doc.id}:`, signedUrlError);
          continue;
        }

        if (signedUrlData?.signedUrl) {
          links.push({
            documentId: doc.id,
            fileName: doc.original_name || doc.file_name,
            url: signedUrlData.signedUrl,
            expiresIn: '1 hour'
          });
        }
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error);
        continue;
      }
    }

    console.log(`✅ Created ${links.length} signed URLs`);

    return NextResponse.json({
      success: true,
      links: links,
      totalDocuments: documents.length,
      createdLinks: links.length
    });

  } catch (error) {
    console.error('Create links error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error creating document links'
    }, { status: 500 });
  }
}
