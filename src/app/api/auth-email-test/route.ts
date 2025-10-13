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

    // Check if notification functions exist
    const { data: testResult, error: testError } = await supabase
      .rpc('run_real_email_test', { user_id_param: user.id })

    if (testError) {
      return NextResponse.json({ 
        error: 'Notification functions not found',
        details: testError.message,
        suggestion: 'Please run the SQL scripts first: 33_real_email_test.sql'
      }, { status: 500 })
    }

    // Get all user emails to show the priority
    const { data: userEmails, error: emailsError } = await supabase
      .rpc('show_all_user_emails')

    if (emailsError) {
      return NextResponse.json({ 
        error: 'Failed to get user emails',
        details: emailsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `🚀 Test-E-Mail erfolgreich an ${user.email} versendet!`,
      data: {
        test_result: testResult,
        user_emails: userEmails,
        current_user_email: user.email,
        note: 'E-Mail wurde an deine auth.users.email Adresse versendet!'
      }
    })

  } catch (error) {
    console.error('Auth email test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
