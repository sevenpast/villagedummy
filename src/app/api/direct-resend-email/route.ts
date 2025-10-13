import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY not found' 
      }, { status: 500 })
    }

    // Test E-Mail an deine Adresse
    const emailData = {
      from: 'Village App <noreply@resend.dev>',
      to: ['hublaizel@icloud.com'],
      subject: '🚀 Direkte Test E-Mail von Village App',
      html: `
        <h1>🎉 Direkte E-Mail erfolgreich!</h1>
        <p>Diese E-Mail wurde <strong>direkt über Resend API</strong> versendet!</p>
        <p><strong>Empfänger:</strong> hublaizel@icloud.com</p>
        <p><strong>Zeit:</strong> ${new Date().toISOString()}</p>
        <p><strong>System:</strong> Village App + Direkte Resend API</p>
        <p><strong>Status:</strong> ✅ Funktioniert perfekt!</p>
        <hr>
        <p><em>Dies ist eine direkte Test-E-Mail ohne Edge Function.</em></p>
      `
    }

    // Direkter Resend API Call
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      return NextResponse.json({ 
        error: 'Resend API error',
        details: errorText,
        status: resendResponse.status
      }, { status: 500 })
    }

    const result = await resendResponse.json()

    return NextResponse.json({
      success: true,
      message: '🚀 Direkte E-Mail erfolgreich versendet!',
      data: result,
      note: 'E-Mail wurde direkt über Resend API versendet'
    })

  } catch (error) {
    console.error('Direct Resend email error:', error)
    return NextResponse.json(
      { 
        error: 'Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}
