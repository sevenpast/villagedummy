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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found',
        details: profileError?.message 
      }, { status: 404 })
    }

    // Get a sample task for testing
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ 
        error: 'No active tasks found',
        details: taskError?.message 
      }, { status: 404 })
    }

    // Check if reminders table exists
    const { data: remindersCheck, error: remindersCheckError } = await supabase
      .from('reminders')
      .select('id')
      .limit(1)

    if (remindersCheckError) {
      return NextResponse.json({ 
        error: 'Reminders table not found or not accessible',
        details: remindersCheckError.message,
        suggestion: 'Please run the database migration first'
      }, { status: 500 })
    }

    // Create a test reminder
    const testReminder = {
      user_id: user.id,
      task_id: task.id,
      reminder_type: 'email',
      message: `🧪 TEST EMAIL: Don't forget to complete: ${task.title}. This is a test email to verify the notification system is working correctly!`,
      next_send_date: new Date().toISOString().split('T')[0], // Today
      interval_days: 1,
      max_sends: 1
    }

    // Insert test reminder
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .insert(testReminder)
      .select()
      .single()

    if (reminderError) {
      return NextResponse.json({ 
        error: 'Failed to create test reminder',
        details: reminderError.message 
      }, { status: 500 })
    }

    // For now, just return success without calling Edge Function
    // (Edge Function needs to be deployed separately)
    return NextResponse.json({
      success: true,
      message: 'Test reminder created successfully! Edge Function needs to be deployed to send actual emails.',
      data: {
        reminder_id: reminder.id,
        user_email: profile.email,
        task_title: task.title,
        next_step: 'Deploy Edge Function: supabase functions deploy send-reminder-emails'
      }
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
