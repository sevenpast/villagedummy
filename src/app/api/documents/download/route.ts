import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service Role Key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/documents/download - Download a document
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const userId = searchParams.get('userId')

    if (!documentId || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      )
    }

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('storage_path, file_name, file_type, user_id')
      .eq('id', documentId)
      .eq('user_id', userId) // Ensure user owns the document
      .single()

    if (docError || !document) {
      console.error('Error fetching document for download:', docError)
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Generate a signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.storage_path, 60) // URL valid for 60 seconds

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      )
    }

    // Return the signed URL
    return NextResponse.json({
      success: true,
      downloadUrl: signedUrlData.signedUrl,
      fileName: document.file_name
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
