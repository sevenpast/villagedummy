import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Test E-Mail an deine Adresse
    const emailData = {
      from: 'Village App <noreply@resend.dev>',
      to: ['hublaizel@icloud.com'],
      subject: '🚀 E-Mail-Test von Village App',
      html: `
        <h1>🎉 E-Mail funktioniert wieder!</h1>
        <p>Diese E-Mail wurde über die <strong>direkte Resend API</strong> versendet!</p>
        <p><strong>Empfänger:</strong> hublaizel@icloud.com</p>
        <p><strong>Zeit:</strong> ${new Date().toISOString()}</p>
        <p><strong>System:</strong> Village App + Resend API</p>
        <p><strong>Status:</strong> ✅ E-Mail-Versand funktioniert!</p>
        <hr>
        <p><em>Dies ist eine Test-E-Mail nach dem Fix.</em></p>
      `
    }

    // Direkter Resend API Call
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      return NextResponse.json({ 
        error: 'Resend API error',
        details: errorText,
        status: resendResponse.status,
        note: 'RESEND_API_KEY ist möglicherweise nicht in Vercel konfiguriert'
      }, { status: 500 })
    }

    const result = await resendResponse.json()

    return NextResponse.json({
      success: true,
      message: '🚀 E-Mail erfolgreich versendet!',
      data: result,
      note: 'E-Mail wurde direkt über Resend API versendet'
    })

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { 
        error: 'Server-Fehler', 
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        note: 'Überprüfe RESEND_API_KEY in Vercel Environment Variables'
      },
      { status: 500 }
    )
  }
}
