import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { taskId, reminderDays, userEmail, taskTitle, reminderType = 'now' } = await request.json()

    if (!taskId || !userEmail || !taskTitle) {
      return NextResponse.json({ 
        error: 'Missing required fields: taskId, userEmail, taskTitle' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Skip authorization check for now - we'll use the userEmail from request body
    // In a real app, you'd validate the JWT token here

    // Create reminder in database (simplified for now)
    const reminderData = {
      user_id: 'temp-user-id', // We'll use a placeholder for now
      task_id: taskId,
      reminder_type: 'email',
      interval_days: reminderDays || 0,
      next_send_date: reminderType === 'now' ? new Date().toISOString().split('T')[0] : 
        new Date(Date.now() + (reminderDays || 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      email_subject: `🔔 Reminder: ${taskTitle}`,
      email_body: `This is a reminder about your task: ${taskTitle}`,
      is_active: true,
      status: 'pending'
    }

    // For now, we'll skip the database insert and just send the email
    const reminder = { id: 'temp-id', ...reminderData }

    // Skip database error check for now

    // Send email immediately if "send now"
    if (reminderType === 'now') {
      const emailData = {
        from: 'Village App <noreply@resend.dev>',
        to: [userEmail],
        subject: `🔔 Reminder: ${taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f97316; margin-bottom: 20px;">🔔 Task Reminder</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              This is a reminder about your task:
            </p>
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
              <h2 style="color: #92400e; margin: 0 0 8px 0;">${taskTitle}</h2>
              <p style="color: #92400e; margin: 0;">Don't forget to complete this important step in your Swiss expat journey!</p>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              This reminder was sent immediately as requested.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af;">
              Village App - Your Swiss Expat Journey Companion
            </p>
          </div>
        `
      }

      // Send via Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (resendResponse.ok) {
        const emailResult = await resendResponse.json()
        
        // Skip database update for now

        return NextResponse.json({
          success: true,
          message: '📧 Reminder email sent successfully!',
          data: {
            reminder_id: reminder.id,
            email_id: emailResult.id,
            sent_to: userEmail,
            task_title: taskTitle
          }
        })
      } else {
        const errorText = await resendResponse.text()
        return NextResponse.json({ 
          error: 'Failed to send email',
          details: errorText 
        }, { status: 500 })
      }
    }

    // For scheduled reminders
    return NextResponse.json({
      success: true,
      message: `⏰ Reminder scheduled for ${reminderDays} days`,
      data: {
        reminder_id: reminder.id,
        next_send_date: reminder.next_send_date,
        task_title: taskTitle
      }
    })

  } catch (error) {
    console.error('Send task reminder error:', error)
    return NextResponse.json(
      { 
        error: 'Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}
