import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // First, let's check if we can import the Supabase client
    let supabase: any = null
    let importError: string | null = null
    
    try {
      const { createClient } = await import('@/lib/supabase/server')
      supabase = createClient()
    } catch (error) {
      importError = error instanceof Error ? error.message : 'Unknown import error'
    }

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      importError,
      supabaseClient: supabase ? 'Created successfully' : 'Failed to create',
    }

    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create Supabase client',
        debug: debugInfo
      }, { status: 500 })
    }
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    debugInfo.user = user ? { id: user.id, email: user.email } : null
    debugInfo.authError = authError?.message || null

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not authenticated',
        debug: debugInfo
      }, { status: 401 })
    }

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    debugInfo.profile = profile ? { id: profile.id, email: profile.email, first_name: profile.first_name } : null
    debugInfo.profileError = profileError?.message || null

    // Check tasks table
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, is_active')
      .limit(5)

    debugInfo.tasks = tasks || []
    debugInfo.tasksError = tasksError?.message || null

    // Check reminders table
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('id, user_id, task_id, reminder_type')
      .limit(5)

    debugInfo.reminders = reminders || []
    debugInfo.remindersError = remindersError?.message || null

    // Check email_logs table
    const { data: emailLogs, error: emailLogsError } = await supabase
      .from('email_logs')
      .select('id, user_id, email_type, status')
      .limit(5)

    debugInfo.emailLogs = emailLogs || []
    debugInfo.emailLogsError = emailLogsError?.message || null

    return NextResponse.json({
      success: true,
      message: 'Database debug information',
      debug: debugInfo
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
