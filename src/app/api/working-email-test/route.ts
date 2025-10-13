import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Einfache Antwort ohne Supabase - nur zum Testen
    return NextResponse.json({
      success: true,
      message: '🚀 E-Mail-Test funktioniert!',
      data: {
        test_result: 'API funktioniert perfekt!',
        user_emails: [
          {
            user_id: 'test-user-id',
            auth_email: 'hublaizel@icloud.com',
            profile_email: null,
            final_email: 'hublaizel@icloud.com'
          }
        ],
        note: 'API funktioniert - jetzt können wir echte E-Mails einrichten!',
        next_steps: [
          '1. Edge Function in Supabase erstellen',
          '2. Resend API Key setzen',
          '3. Echte E-Mails versenden'
        ]
      }
    })

  } catch (error) {
    console.error('Working email test error:', error)
    return NextResponse.json(
      { 
        error: 'Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}
