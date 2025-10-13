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

    // Get all user emails first
    const { data: userEmails, error: emailsError } = await supabase
      .rpc('show_all_user_emails')

    if (emailsError) {
      return NextResponse.json({ 
        error: 'Failed to get user emails',
        details: emailsError.message 
      }, { status: 500 })
    }

    // Run real email test with current user
    const { data: testResult, error: testError } = await supabase
      .rpc('run_real_email_test', { user_id_param: user.id })

    if (testError) {
      return NextResponse.json({ 
        error: 'Failed to run real email test',
        details: testError.message 
      }, { status: 500 })
    }

    // Get updated queue status
    const { data: queueStatus, error: queueError } = await supabase
      .rpc('get_queue_status')

    if (queueError) {
      return NextResponse.json({ 
        error: 'Failed to get queue status',
        details: queueError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '🚀 Echte Test-E-Mail erfolgreich versendet!',
      data: {
        test_result: testResult,
        user_emails: userEmails,
        queue_status: queueStatus,
        note: 'E-Mail wurde an deine echte E-Mail-Adresse versendet!'
      }
    })

  } catch (error) {
    console.error('Real email test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
