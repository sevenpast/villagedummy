import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run immediate email test
    const { data: testResult, error: testError } = await supabase
      .rpc('run_immediate_email_test')

    if (testError) {
      return NextResponse.json({ 
        error: 'Failed to run immediate email test',
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

    // Get all notifications
    const { data: allNotifications, error: notificationsError } = await supabase
      .rpc('show_all_notifications')

    if (notificationsError) {
      return NextResponse.json({ 
        error: 'Failed to get notifications',
        details: notificationsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '🚀 Sofortige Test-E-Mail erfolgreich versendet!',
      data: {
        test_result: testResult,
        queue_status: queueStatus,
        all_notifications: allNotifications
      }
    })

  } catch (error) {
    console.error('Immediate email test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
