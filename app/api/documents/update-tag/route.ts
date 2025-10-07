import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, userId, newTag } = body

    if (!documentId || !userId || !newTag) {
      return NextResponse.json(
        { error: 'Document ID, user ID, and new tag are required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      // Demo mode - simulate tag update
      console.log(`🏷️ Demo mode: Updating tag for document ${documentId} to "${newTag}"`)
      return NextResponse.json({
        success: true,
        message: 'Tag updated successfully (DEMO MODE)',
        documentId,
        newTag
      })
    }

    // Update the document tag in the database
    const { data, error } = await supabase
      .from('documents')
      .update({ 
        document_type: newTag,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update document tag' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`✅ Tag updated successfully for document ${documentId}: "${newTag}"`)

    return NextResponse.json({
      success: true,
      message: 'Tag updated successfully',
      document: data[0]
    })

  } catch (error) {
    console.error('❌ Update tag error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
