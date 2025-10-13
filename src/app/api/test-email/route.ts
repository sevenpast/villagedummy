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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get a sample task for testing
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'No active tasks found' }, { status: 404 })
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
      return NextResponse.json({ error: 'Failed to create test reminder' }, { status: 500 })
    }

    // Call the Edge Function to send the email immediately
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-reminder-emails', {
      body: { 
        trigger: 'test',
        test_reminder_id: reminder.id,
        test_user_id: user.id
      }
    })

    if (emailError) {
      // Clean up the test reminder
      await supabase
        .from('reminders')
        .delete()
        .eq('id', reminder.id)

      return NextResponse.json({ 
        error: 'Failed to send test email',
        details: emailError 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      data: {
        reminder_id: reminder.id,
        user_email: profile.email,
        task_title: task.title,
        email_result: emailResult
      }
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
