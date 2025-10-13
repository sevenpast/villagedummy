// ============================================================================
// MUNICIPALITY EMAIL GENERATOR API
// Generate multilingual email to municipality using unified Gemini service
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

    // First get municipality info
    const municipalityResult = await geminiService.findMunicipalityWebsite(municipality, canton)
    
    if (!municipalityResult.success || !municipalityResult.data) {
      return NextResponse.json({
        error: 'Failed to find municipality information',
        details: municipalityResult.error
      }, { status: 500 })
    }

    const municipalityInfo = municipalityResult.data
    const officialLanguage = municipalityInfo.official_language || 'de'

    // Generate multilingual email
    const emailContext = `Municipality registration inquiry for ${municipality}, ${canton}`
    const userInfo = {
      municipality,
      canton,
      userEmail: user.email
    }

    const emailResult = await geminiService.generateMultilingualEmail(
      emailContext,
      officialLanguage,
      userInfo
    )

    if (!emailResult.success) {
      return NextResponse.json({
        error: 'Failed to generate email content',
        details: emailResult.error
      }, { status: 500 })
    }

    // Create mailto URL (use generic municipality email if not found)
    const emailData = emailResult.data
    const municipalityEmail = municipalityInfo.email || `info@${municipality.toLowerCase().replace(/\s+/g, '')}.ch`
    const mailtoUrl = `mailto:${municipalityEmail}?cc=${userInfo.userEmail}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body_original + '\n\n--- English Version ---\n' + emailData.body_english)}`

    return NextResponse.json({
      success: true,
      data: {
        mailtoUrl,
        municipalityInfo,
        emailContent: emailData,
        officialLanguage
      },
      fromCache: municipalityResult.fromCache || emailResult.fromCache || false
    })

  } catch (error) {
    console.error('Municipality email generator API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
})