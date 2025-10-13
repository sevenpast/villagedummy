import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { DocumentDownloadSchema, validateQueryParams } from '@/lib/validation/schemas'

// Service Role Key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/documents/download - Download a document (SECURED)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // SECURITY FIX: Validate input parameters
    const { documentId, userId } = validateQueryParams(DocumentDownloadSchema, searchParams)
    
    // SECURITY FIX: Use authenticated user ID instead of parameter
    const authenticatedUserId = request.user.id

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('storage_path, file_name, file_type, user_id')
      .eq('id', documentId)
      .eq('user_id', authenticatedUserId) // SECURITY FIX: Use authenticated user ID
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
    // SECURITY FIX: Don't log sensitive errors in production
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error)
    }
    
    // SECURITY FIX: Generic error message to prevent information leakage
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
