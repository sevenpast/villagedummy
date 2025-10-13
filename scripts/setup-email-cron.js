#!/usr/bin/env node

/**
 * Setup Email Cron Job
 * 
 * This script sets up a cron job to send reminder emails daily.
 * It can be run manually or scheduled via Vercel Cron Jobs.
 */

const { createClient } = require('@supabase/supabase-js')

async function sendReminderEmails() {
  console.log('🔄 Starting daily reminder email process...')
  
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('send-reminder-emails', {
      body: { trigger: 'cron' }
    })

    if (error) {
      throw error
    }

    console.log('✅ Reminder emails processed successfully:', data)
    return data

  } catch (error) {
    console.error('❌ Error processing reminder emails:', error)
    throw error
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  sendReminderEmails()
    .then((result) => {
      console.log('🎉 Cron job completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Cron job failed:', error)
      process.exit(1)
    })
}

module.exports = { sendReminderEmails }
