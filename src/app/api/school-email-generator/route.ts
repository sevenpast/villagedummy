// ============================================================================
// SCHOOL EMAIL GENERATOR API
// Generate multilingual email to school authority using unified Gemini service
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { geminiService } from '@/lib/gemini/unified-service'
import { SchoolEmailSchema, validateRequestBody } from '@/lib/validation/schemas'

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { municipality, canton, userEmail, childrenAges } = validateRequestBody(SchoolEmailSchema, body)
    
    const user = request.user

    // First get school authority info
    const schoolResult = await geminiService.findSchoolAuthority(municipality, canton)
    
    if (!schoolResult.success || !schoolResult.data) {
      return NextResponse.json({
        error: 'Failed to find school authority information',
        details: schoolResult.error
      }, { status: 500 })
    }

    const schoolInfo = schoolResult.data
    const officialLanguage = schoolInfo.official_language || 'de'

    // Generate multilingual email
    const emailContext = `School registration inquiry for ${municipality}, ${canton}`
    const userInfo = {
      municipality,
      canton,
      userEmail: userEmail || user.email,
      childrenAges: childrenAges || []
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

    // Create mailto URL
    const emailData = emailResult.data
    const mailtoUrl = `mailto:${schoolInfo.email || 'info@schule.ch'}?cc=${userInfo.userEmail}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body_original + '\n\n--- English Version ---\n' + emailData.body_english)}`

    return NextResponse.json({
      success: true,
      data: {
        mailtoUrl,
        schoolInfo,
        emailContent: emailData,
        officialLanguage
      },
      fromCache: schoolResult.fromCache || emailResult.fromCache || false
    })

  } catch (error) {
    console.error('School email generator API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
})