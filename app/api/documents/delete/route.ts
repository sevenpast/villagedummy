import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Document delete API called');
    
    const { documentId, userId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, get the document to find the storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path, file_name')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching document:', fetchError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.error('❌ Storage delete error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('❌ Database delete error:', dbError);
      return NextResponse.json({ error: 'Failed to delete document from database' }, { status: 500 });
    }

    console.log(`✅ Document deleted successfully: ${document.file_name}`);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete failed:', error);
    return NextResponse.json({
      error: 'Delete failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
