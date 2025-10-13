// ============================================================================
// SCHOOL WEBSITE API
// Find official school authority website using unified Gemini service
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { geminiService } from '@/lib/gemini/unified-service'
import { MunicipalitySearchSchema, validateRequestBody } from '@/lib/validation/schemas'

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { municipality, canton } = validateRequestBody(MunicipalitySearchSchema, body)
    
    const user = request.user

    // Use unified Gemini service
    const result = await geminiService.findSchoolAuthority(municipality, canton)

    if (!result.success) {
      return NextResponse.json({
        error: 'Failed to find school authority website',
        details: result.error
      }, { status: 500 })
    }

    // Validate the URL if present
    if (result.data?.website_url && !geminiService.validateUrl(result.data.website_url)) {
      return NextResponse.json({
        error: 'Invalid website URL returned',
        details: 'The generated URL is not valid'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      fromCache: result.fromCache || false,
      municipality,
      canton
    })

  } catch (error) {
    console.error('School website API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
})