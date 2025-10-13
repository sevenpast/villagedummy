// ============================================================================
// CONSOLIDATED EMAIL TEST API
// Replaces 12+ individual test email routes with a single, secure endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { EmailTestSchema, validateRequestBody } from '@/lib/validation/schemas'

// GET /api/test/email - Test email functionality with parameters
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'simple'
    const target = searchParams.get('target') || 'resend'
    
    const user = request.user
    
    // Different test types
    switch (type) {
      case 'simple':
        return await testSimpleEmail(user.email || 'test@example.com')
      
      case 'resend':
        return await testResendEmail(user.email || 'test@example.com')
      
      case 'supabase':
        return await testSupabaseEmail(user.email || 'test@example.com')
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: simple, resend, or supabase' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { error: 'Email test failed' },
      { status: 500 }
    )
  }
})

// POST /api/test/email - Send custom test email
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { recipient, subject, body: emailBody } = validateRequestBody(EmailTestSchema, body)
    
    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Village <noreply@village.ch>',
        to: [recipient],
        subject,
        html: emailBody,
      }),
    })

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      messageId: result.id,
      message: 'Test email sent successfully'
    })
  } catch (error) {
    console.error('Custom email test error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
})

// Helper functions for different test types
async function testSimpleEmail(recipient: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Village <noreply@village.ch>',
      to: [recipient],
      subject: 'Simple Test Email',
      html: '<p>This is a simple test email from Village.</p>',
    }),
  })

  const result = await response.json()
  return NextResponse.json({
    success: true,
    type: 'simple',
    messageId: result.id
  })
}

async function testResendEmail(recipient: string) {
  // Test Resend API directly
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Village <noreply@village.ch>',
      to: [recipient],
      subject: 'Resend API Test',
      html: '<p>Testing Resend API integration.</p>',
    }),
  })

  const result = await response.json()
  return NextResponse.json({
    success: true,
    type: 'resend',
    messageId: result.id
  })
}

async function testSupabaseEmail(recipient: string) {
  // Test Supabase Edge Function
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: recipient,
      subject: 'Supabase Edge Function Test',
      html: '<p>Testing Supabase Edge Function email.</p>',
    }),
  })

  const result = await response.json()
  return NextResponse.json({
    success: true,
    type: 'supabase',
    result
  })
}
