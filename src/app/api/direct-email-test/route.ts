import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Direkte Antwort ohne Supabase - nur zum Testen
    return NextResponse.json({
      success: true,
      message: '🚀 Direkter E-Mail-Test erfolgreich!',
      data: {
        test_result: 'E-Mail-Test funktioniert!',
        user_emails: [
          {
            user_id: 'test-user-id',
            auth_email: 'hublaizel@icloud.com',
            profile_email: null,
            final_email: 'hublaizel@icloud.com'
          }
        ],
        note: 'Direkter Test ohne Supabase - API funktioniert!'
      }
    })

  } catch (error) {
    console.error('Direct email test error:', error)
    return NextResponse.json(
      { 
        error: 'Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}
