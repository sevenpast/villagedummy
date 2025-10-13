import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Reminder {
  id: string
  user_id: string
  task_id: string
  reminder_type: string
  message: string
  next_send_date: string
  interval_days: number
  max_sends: number
  send_count: number
  is_active: boolean
}

interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  language_preference: string
}

interface Task {
  id: string
  title: string
  description: string
  task_type: string
  priority: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body for test parameters
    const body = await req.json().catch(() => ({}))
    const isTest = body.trigger === 'test'
    const testReminderId = body.test_reminder_id
    const testUserId = body.test_user_id

    let reminders: any[] = []
    let remindersError: any = null

    if (isTest && testReminderId) {
      // Test mode: fetch specific reminder
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          tasks!inner(id, title, description, task_type, priority),
          user_profiles!inner(id, user_id, email, first_name, last_name, language_preference)
        `)
        .eq('id', testReminderId)
        .single()

      reminders = data ? [data] : []
      remindersError = error
    } else {
      // Normal mode: fetch reminders that are due today
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          tasks!inner(id, title, description, task_type, priority),
          user_profiles!inner(id, user_id, email, first_name, last_name, language_preference)
        `)
        .eq('is_active', true)
        .lte('next_send_date', today)
        .lt('send_count', supabase.raw('max_sends'))
      
      reminders = data || []
      remindersError = error
    }

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch reminders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send today', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${reminders.length} reminders`)

    const results = []

    for (const reminder of reminders) {
      try {
        const userProfile = reminder.user_profiles as UserProfile
        const task = reminder.tasks as Task

        // Generate email content based on language preference
        const emailContent = generateEmailContent(
          userProfile,
          task,
          reminder,
          userProfile.language_preference || 'en'
        )

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Village <noreply@village.com>',
            to: [userProfile.email],
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text()
          console.error(`Failed to send email to ${userProfile.email}:`, errorData)
          
          // Log failed email
          await supabase
            .from('email_logs')
            .insert({
              user_id: userProfile.user_id,
              email_type: 'task_reminder',
              recipient_email: userProfile.email,
              subject: emailContent.subject,
              status: 'failed',
              error_message: errorData,
            })

          results.push({
            reminder_id: reminder.id,
            user_email: userProfile.email,
            status: 'failed',
            error: errorData
          })
          continue
        }

        const emailData = await emailResponse.json()
        console.log(`Email sent successfully to ${userProfile.email}:`, emailData.id)

        // Log successful email
        await supabase
          .from('email_logs')
          .insert({
            user_id: userProfile.user_id,
            email_type: 'task_reminder',
            recipient_email: userProfile.email,
            subject: emailContent.subject,
            status: 'sent',
            sent_at: new Date().toISOString(),
          })

        // Update reminder
        const nextSendDate = new Date()
        nextSendDate.setDate(nextSendDate.getDate() + reminder.interval_days)

        await supabase
          .from('reminders')
          .update({
            send_count: reminder.send_count + 1,
            next_send_date: nextSendDate.toISOString().split('T')[0],
            is_active: reminder.send_count + 1 < reminder.max_sends,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reminder.id)

        results.push({
          reminder_id: reminder.id,
          user_email: userProfile.email,
          status: 'sent',
          email_id: emailData.id
        })

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error)
        results.push({
          reminder_id: reminder.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Reminder processing completed',
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-reminder-emails function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailContent(
  userProfile: UserProfile,
  task: Task,
  reminder: Reminder,
  language: string
) {
  const isGerman = language === 'de'
  const isFrench = language === 'fr'
  const isItalian = language === 'it'

  const userName = userProfile.first_name || 'there'
  const taskTitle = task.title
  const taskDescription = task.description || ''
  const reminderMessage = reminder.message

  let subject: string
  let html: string

  if (isGerman) {
    subject = `🔔 Erinnerung: ${taskTitle}`
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Village</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Ihr Schweizer Expat-Begleiter</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #1f2937; margin-top: 0;">Hallo ${userName}! 👋</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Es ist Zeit, an Ihre nächste Aufgabe zu denken:</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <h3 style="color: #f59e0b; margin-top: 0; font-size: 20px;">📋 ${taskTitle}</h3>
            ${taskDescription ? `<p style="color: #6b7280; margin-bottom: 15px;">${taskDescription}</p>` : ''}
            <p style="color: #374151; font-weight: 500;">${reminderMessage}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://village.com/tasks" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Aufgabe anzeigen →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Brauchen Sie Hilfe? Antworten Sie einfach auf diese E-Mail oder besuchen Sie 
            <a href="https://village.com/support" style="color: #f59e0b;">village.com/support</a>
          </p>
        </div>
      </body>
      </html>
    `
  } else if (isFrench) {
    subject = `🔔 Rappel: ${taskTitle}`
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Village</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Votre guide expat suisse</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #1f2937; margin-top: 0;">Bonjour ${userName}! 👋</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Il est temps de penser à votre prochaine tâche :</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <h3 style="color: #f59e0b; margin-top: 0; font-size: 20px;">📋 ${taskTitle}</h3>
            ${taskDescription ? `<p style="color: #6b7280; margin-bottom: 15px;">${taskDescription}</p>` : ''}
            <p style="color: #374151; font-weight: 500;">${reminderMessage}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://village.com/tasks" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Voir la tâche →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Besoin d'aide ? Répondez simplement à cet e-mail ou visitez 
            <a href="https://village.com/support" style="color: #f59e0b;">village.com/support</a>
          </p>
        </div>
      </body>
      </html>
    `
  } else if (isItalian) {
    subject = `🔔 Promemoria: ${taskTitle}`
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Village</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">La tua guida expat svizzera</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #1f2937; margin-top: 0;">Ciao ${userName}! 👋</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">È ora di pensare al tuo prossimo compito:</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <h3 style="color: #f59e0b; margin-top: 0; font-size: 20px;">📋 ${taskTitle}</h3>
            ${taskDescription ? `<p style="color: #6b7280; margin-bottom: 15px;">${taskDescription}</p>` : ''}
            <p style="color: #374151; font-weight: 500;">${reminderMessage}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://village.com/tasks" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Visualizza compito →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Hai bisogno di aiuto? Rispondi semplicemente a questa email o visita 
            <a href="https://village.com/support" style="color: #f59e0b;">village.com/support</a>
          </p>
        </div>
      </body>
      </html>
    `
  } else {
    // English (default)
    subject = `🔔 Reminder: ${taskTitle}`
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Village</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Swiss Expat Guide</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName}! 👋</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">It's time to think about your next task:</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <h3 style="color: #f59e0b; margin-top: 0; font-size: 20px;">📋 ${taskTitle}</h3>
            ${taskDescription ? `<p style="color: #6b7280; margin-bottom: 15px;">${taskDescription}</p>` : ''}
            <p style="color: #374151; font-weight: 500;">${reminderMessage}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://village.com/tasks" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              View Task →
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Need help? Simply reply to this email or visit 
            <a href="https://village.com/support" style="color: #f59e0b;">village.com/support</a>
          </p>
        </div>
      </body>
      </html>
    `
  }

  return { subject, html }
}
