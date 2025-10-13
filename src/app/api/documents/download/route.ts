import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling, createError } from '@/lib/error-handling'
import { DocumentDownloadSchema, validateQueryParams } from '@/lib/validation/schemas'
import { createClient } from '@/lib/supabase/server'

const downloadDocumentHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url)
  
  // SECURITY FIX: Validate input parameters (only documentId needed now)
  const { documentId } = validateQueryParams(DocumentDownloadSchema, searchParams)
  
  // SECURITY FIX: Use authenticated user ID instead of parameter
  const authenticatedUserId = request.user.id
  const supabase = await createClient()

  // Fetch document metadata
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('storage_path, file_name, file_type, user_id')
    .eq('id', documentId)
    .eq('user_id', authenticatedUserId) // SECURITY FIX: Use authenticated user ID
    .single()

  if (docError || !document) {
    throw createError.notFound('Document not found or access denied')
  }

  // Generate a signed URL for the file
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.storage_path, 60) // URL valid for 60 seconds

  if (signedUrlError) {
    throw createError.database('Failed to generate download link', signedUrlError)
  }

  // Return the signed URL
  return NextResponse.json({
    success: true,
    downloadUrl: signedUrlData.signedUrl,
    fileName: document.file_name
  })
}

// GET /api/documents/download - Download a document (SECURED)
export const GET = withAuth(withErrorHandling(downloadDocumentHandler))
