import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is not configured in environment variables.');
    return NextResponse.json({
      success: false,
      error: 'Datenbankverbindung ist nicht konfiguriert. Bitte überprüfen Sie die Server-Einstellungen.',
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const userId = searchParams.get('userId');

    if (!documentId || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing documentId or userId parameter' 
      }, { status: 400 });
    }

    console.log(`📥 Downloading document ${documentId} for user ${userId}`);

    // Get document from database
    const { data, error } = await supabase
      .from('documents_vault')
      .select('file_name, original_name, file_type, file_data')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Document not found or access denied'
      }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Document not found'
      }, { status: 404 });
    }

    // Convert buffer back to Uint8Array
    const fileBuffer = new Uint8Array(data.file_data);

    console.log(`✅ Document downloaded: ${data.original_name}`);

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': data.file_type,
        'Content-Disposition': `attachment; filename="${data.original_name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download document error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error downloading document'
    }, { status: 500 });
  }
}
