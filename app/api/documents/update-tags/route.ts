import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, tags, userId } = body;

    if (!documentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing documentId parameter' 
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId parameter' 
      }, { status: 400 });
    }

    console.log(`🏷️ Updating tags for document: ${documentId}`);

    // Update the document tags
    const { data, error } = await supabase
      .from('documents')
      .update({ 
        tags: tags || []
      })
      .eq('id', documentId);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update document tags'
      }, { status: 500 });
    }

    console.log(`✅ Updated tags for document ${documentId}`);

    return NextResponse.json({
      success: true,
      message: 'Tags updated successfully'
    });

  } catch (error) {
    console.error('Update tags error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error updating tags'
    }, { status: 500 });
  }
}
