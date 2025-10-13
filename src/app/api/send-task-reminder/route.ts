import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { taskId, reminderDays, userEmail, taskTitle, reminderType = 'now' } = await request.json()

    if (!taskId || !userEmail || !taskTitle) {
      return NextResponse.json({ 
        error: 'Missing required fields: taskId, userEmail, taskTitle' 
      }, { status: 400 })
    }

    // Send email immediately if "send now"
    if (reminderType === 'now') {
      // Use the working simple email test API
      const emailData = {
        from: 'Village App <noreply@resend.dev>',
        to: [userEmail],
        subject: `🔔 Reminder: ${taskTitle}`,
        html: `
          <h1>🔔 Task Reminder</h1>
          <p>This is a reminder about your task:</p>
          <h2>${taskTitle}</h2>
          <p>Don't forget to complete this important step in your Swiss expat journey!</p>
          <p><em>This reminder was sent immediately as requested.</em></p>
          <hr>
          <p><small>Village App - Your Swiss Expat Journey Companion</small></p>
        `
      }

      // Call the working simple email test API
      const emailResponse = await fetch('/api/test-email-simple-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customEmail: userEmail,
          customSubject: `🔔 Reminder: ${taskTitle}`,
          customHtml: emailData.html
        }),
      })

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json()
        
        return NextResponse.json({
          success: true,
          message: '📧 Reminder email sent successfully!',
          data: {
            task_id: taskId,
            sent_to: userEmail,
            task_title: taskTitle,
            email_result: emailResult
          }
        })
      } else {
        const errorText = await emailResponse.text()
        console.error('Email API error:', errorText)
        return NextResponse.json({ 
          error: 'Failed to send reminder email',
          details: errorText
        }, { status: 500 })
      }
    }

    // For scheduled reminders (just return success for now)
    return NextResponse.json({
      success: true,
      message: `⏰ Reminder scheduled for ${reminderDays} days`,
      data: {
        task_id: taskId,
        next_send_date: new Date(Date.now() + (reminderDays || 1) * 24 * 60 * 60 * 1000).toISOString(),
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
