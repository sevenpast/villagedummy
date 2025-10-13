import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting daily reminder email process...')

    // Initialize Supabase client with service role
    const supabase = await createClient()

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('send-reminder-emails', {
      body: { trigger: 'cron' }
    })

    if (error) {
      console.error('❌ Error calling Edge Function:', error)
      return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 })
    }

    console.log('✅ Reminder emails processed successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Reminder emails processed successfully',
      data
    })

  } catch (error) {
    console.error('💥 Cron job failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
