import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'not found'
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug env error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
