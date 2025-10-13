// ============================================================================
// MUNICIPALITY WEBSITE API
// Find official municipality website using unified Gemini service
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { geminiService } from '@/lib/gemini/unified-service'
import { MunicipalitySearchSchema, validateRequestBody } from '@/lib/validation/schemas'
import { withErrorHandling, createError, formatValidationError } from '@/lib/error-handling'

const municipalityWebsiteHandler = async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const body = await request.json()
  const { municipality, canton } = validateRequestBody(MunicipalitySearchSchema, body)
  
  const user = request.user

  // Use unified Gemini service
  const result = await geminiService.findMunicipalityWebsite(municipality, canton)

  if (!result.success) {
    throw createError.gemini('Failed to find municipality website', result.error)
  }

  // Validate the URL if present
  if (result.data?.website_url && !geminiService.validateUrl(result.data.website_url)) {
    throw createError.validation('Invalid website URL returned', 'The generated URL is not valid')
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    fromCache: result.fromCache || false,
    municipality,
    canton
  })
}

export const POST = withAuth(withErrorHandling(municipalityWebsiteHandler))