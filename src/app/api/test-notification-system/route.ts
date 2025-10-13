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

    // Test 1: Create a test notification using our new system
    const { data: notificationId, error: notificationError } = await supabase
      .rpc('create_test_notification')

    if (notificationError) {
      return NextResponse.json({ 
        error: 'Failed to create test notification',
        details: notificationError.message 
      }, { status: 500 })
    }

    // Test 2: Get queue status
    const { data: queueStatus, error: queueError } = await supabase
      .rpc('get_queue_status')

    if (queueError) {
      return NextResponse.json({ 
        error: 'Failed to get queue status',
        details: queueError.message 
      }, { status: 500 })
    }

    // Test 3: Show all notifications
    const { data: allNotifications, error: notificationsError } = await supabase
      .rpc('show_all_notifications')

    if (notificationsError) {
      return NextResponse.json({ 
        error: 'Failed to get notifications',
        details: notificationsError.message 
      }, { status: 500 })
    }

    // Test 4: Process queue manually
    const { data: processResult, error: processError } = await supabase
      .rpc('test_process_queue')

    if (processError) {
      return NextResponse.json({ 
        error: 'Failed to process queue',
        details: processError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification system test completed successfully!',
      data: {
        test_notification_id: notificationId,
        queue_status: queueStatus,
        all_notifications: allNotifications,
        process_result: processResult
      }
    })

  } catch (error) {
    console.error('Notification system test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get queue status
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
      message: 'Notification system status',
      data: {
        queue_status: queueStatus,
        all_notifications: allNotifications
      }
    })

  } catch (error) {
    console.error('Notification system status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
