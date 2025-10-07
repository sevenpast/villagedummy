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
    let query = supabase
      .from('documents')
      .select('storage_path, file_name')
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

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.error('❌ Storage delete error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    let deleteQuery = supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    // Only filter by user_id if it's a valid UUID, otherwise delete documents with null user_id
    if (userId && userId !== 'default' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      deleteQuery = deleteQuery.eq('user_id', userId);
    } else {
      // For non-UUID user IDs, delete documents with null user_id
      deleteQuery = deleteQuery.is('user_id', null);
    }
    
    const { error: dbError } = await deleteQuery;

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
