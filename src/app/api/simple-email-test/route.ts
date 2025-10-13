import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Einfacher Supabase Client ohne User-Check
    const supabase = await createClient()

    // Teste die E-Mail-Funktionen direkt
    const { data: testResult, error: testError } = await supabase
      .rpc('run_real_email_test')

    if (testError) {
      return NextResponse.json({ 
        error: 'E-Mail-Funktionen nicht gefunden',
        details: testError.message,
        suggestion: 'SQL-Scripts installieren: 35_fix_json_error.sql'
      }, { status: 500 })
    }

    // Hole alle E-Mail-Adressen
    const { data: userEmails, error: emailsError } = await supabase
      .rpc('show_all_user_emails')

    if (emailsError) {
      return NextResponse.json({ 
        error: 'E-Mail-Adressen nicht abrufbar',
        details: emailsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '🚀 E-Mail-Test erfolgreich!',
      data: {
        test_result: testResult,
        user_emails: userEmails,
        note: 'E-Mail wurde versendet - keine User-Authentifizierung nötig!'
      }
    })

  } catch (error) {
    console.error('Simple email test error:', error)
    return NextResponse.json(
      { 
        error: 'Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}
