import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Test E-Mail an deine Adresse
    const testEmail = {
      recipient_email: 'hublaizel@icloud.com',
      subject: '🚀 Test E-Mail von Village App',
      html_content: `
        <h1>🎉 Test E-Mail erfolgreich!</h1>
        <p>Diese E-Mail wurde über die Edge Function versendet!</p>
        <p><strong>Zeit:</strong> ${new Date().toISOString()}</p>
        <p><strong>System:</strong> Village App + Supabase Edge Function + Resend</p>
        <p><strong>Status:</strong> ✅ Funktioniert perfekt!</p>
        <hr>
        <p><em>Dies ist eine Test-E-Mail von der Village App.</em></p>
      `
    }

    // Call Supabase Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '🚀 E-Mail erfolgreich versendet!',
      data: result
    })

  } catch (error) {
    console.error('Test real email error:', error)
    return NextResponse.json(
      { 
        error: 'Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}
