import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test if notification functions exist
    const { data: testResult, error: testError } = await supabase
      .rpc('run_immediate_email_test')

    if (testError) {
      return NextResponse.json({ 
        error: 'Notification functions not found',
        details: testError.message,
        suggestion: 'Please run the SQL scripts first: 32_immediate_test_email.sql'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '🚀 Sofortige Test-E-Mail erfolgreich versendet!',
      data: testResult
    })

  } catch (error) {
    console.error('Simple test email error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
