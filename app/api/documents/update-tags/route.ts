import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const { documentId, userId, tags, documentType, description } = await request.json();

    if (!documentId || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      );
    }

    console.log('🏷️ Updating document tags:', { documentId, userId, tags, documentType });

    // Update document with new tags and metadata
    const { data, error } = await supabase
      .from('documents')
      .update({
        tags: tags || [],
        document_type: documentType || null,
        description: description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database update error:', error);
      return NextResponse.json(
        { error: 'Failed to update document tags' },
        { status: 500 }
      );
    }

    console.log('✅ Document tags updated successfully');

    return NextResponse.json({
      success: true,
      document: data,
      message: 'Document tags updated successfully'
    });

  } catch (error) {
    console.error('❌ Update tags API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
