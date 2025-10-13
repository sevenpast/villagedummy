import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      // Don't expose actual values for security
      NEXT_PUBLIC_SUPABASE_URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY_VALUE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      RESEND_API_KEY_VALUE: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
    }

    return NextResponse.json({
      success: true,
      message: 'Environment Variables Check',
      data: envCheck,
      note: 'All variables should be SET for email functionality'
    })

  } catch (error) {
    console.error('Environment check error:', error)
    return NextResponse.json(
      { 
        error: 'Environment check failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
