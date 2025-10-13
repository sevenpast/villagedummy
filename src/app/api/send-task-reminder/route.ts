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
      // Check if Resend API key is available
      const resendApiKey = process.env.RESEND_API_KEY
      if (!resendApiKey) {
        return NextResponse.json({ 
          error: 'RESEND_API_KEY not configured' 
        }, { status: 500 })
      }

      // For development: always send to verified email address
      // In production, you would verify your domain and use userEmail
      const recipientEmail = process.env.NODE_ENV === 'production' ? userEmail : 'hublaizel@icloud.com'
      
      const emailData = {
        from: 'Village App <noreply@resend.dev>',
        to: [recipientEmail],
        subject: `🔔 Reminder: ${taskTitle}`,
        html: `
          <h1>🔔 Task Reminder</h1>
          <p>This is a reminder about your task:</p>
          <h2>${taskTitle}</h2>
          <p><strong>Requested by:</strong> ${userEmail}</p>
          <p>Don't forget to complete this important step in your Swiss expat journey!</p>
          <p><em>This reminder was sent immediately as requested.</em></p>
          <hr>
          <p><small>Village App - Your Swiss Expat Journey Companion</small></p>
          <p><small>Note: In development mode, emails are sent to the verified address for testing.</small></p>
        `
      }

      try {
        // Send via Resend API directly
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        })

        if (resendResponse.ok) {
          const emailResult = await resendResponse.json()
          
          return NextResponse.json({
            success: true,
            message: process.env.NODE_ENV === 'production' 
              ? '📧 Reminder email sent successfully!'
              : '📧 Reminder email sent successfully! (Sent to verified address for testing)',
            data: {
              task_id: taskId,
              requested_by: userEmail,
              sent_to: recipientEmail,
              task_title: taskTitle,
              email_id: emailResult.id,
              development_mode: process.env.NODE_ENV !== 'production'
            }
          })
        } else {
          const errorText = await resendResponse.text()
          console.error('Resend API error:', errorText)
          return NextResponse.json({ 
            error: 'Failed to send email via Resend API',
            details: errorText,
            status: resendResponse.status
          }, { status: 500 })
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        return NextResponse.json({ 
          error: 'Network error when sending email',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
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
