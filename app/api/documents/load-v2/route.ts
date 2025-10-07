import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`📁 Loading documents for user: ${userId}`);

    // Load documents from existing schema
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, file_name, file_size, file_type, storage_path, document_type, status, confidence, signals, uploaded_at')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    // Transform to match frontend expectations
    const transformedDocuments = documents?.map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      documentType: doc.document_type || 'Unknown',
      uploadedAt: doc.uploaded_at,
      storagePath: doc.storage_path,
      status: doc.status,
      confidence: doc.confidence,
      signals: doc.signals
    })) || [];

    console.log(`✅ Loaded ${transformedDocuments.length} documents for user ${userId}`);

    return NextResponse.json(transformedDocuments);

  } catch (error) {
    console.error('❌ Load error:', error);
    return NextResponse.json({ 
      error: 'Failed to load documents', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
