import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { municipality, canton, userEmail } = await request.json()

    if (!municipality || !canton) {
      return NextResponse.json({ error: 'Municipality and canton are required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 })
    }

    // Step 1: Find school authority information
    const schoolInfoResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Finde die Schulverwaltung für die Gemeinde ${municipality} im Kanton ${canton} in der Schweiz.

Gib die Informationen im folgenden JSON-Format zurück:
{
  "authority_name": "Name der Schulverwaltung",
  "email": "E-Mail-Adresse der Schulverwaltung",
  "official_language": "Deutsch/Französisch/Italienisch"
}

Gemeinde: ${municipality}
Kanton: ${canton}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 200,
        }
      })
    })

    if (!schoolInfoResponse.ok) {
      const error = await schoolInfoResponse.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const schoolInfoData = await schoolInfoResponse.json()
    const schoolInfoText = schoolInfoData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!schoolInfoText) {
      throw new Error('No school authority information found')
    }

    // Parse the JSON response
    let schoolInfo
    try {
      schoolInfo = JSON.parse(schoolInfoText)
    } catch (parseError) {
      throw new Error('Failed to parse school authority information')
    }

    // Step 2: Generate email content
    const emailResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Schreibe eine höfliche E-Mail in ${schoolInfo.official_language} an die Schulverwaltung ${schoolInfo.authority_name} in ${municipality}, ${canton}.

Die E-Mail soll nach dem Prozess und den benötigten Dokumenten für die Schulanmeldung für eine neu zugezogene Familie fragen.

Füge unterhalb eine exakte englische Übersetzung hinzu.

Format:
[E-Mail in ${schoolInfo.official_language}]

---

[English Translation]`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 500,
        }
      })
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const emailData = await emailResponse.json()
    const emailContent = emailData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!emailContent) {
      throw new Error('No email content generated')
    }

    // Create mailto link
    const subject = encodeURIComponent(`School Registration Inquiry - ${municipality}`)
    const body = encodeURIComponent(emailContent)
    
    let mailtoLink = `mailto:${schoolInfo.email}?subject=${subject}&body=${body}`
    
    // Add CC if user email is provided
    if (userEmail) {
      mailtoLink += `&cc=${encodeURIComponent(userEmail)}`
    }

    return NextResponse.json({
      success: true,
      mailto_link: mailtoLink,
      school_authority: schoolInfo.authority_name,
      school_email: schoolInfo.email,
      official_language: schoolInfo.official_language,
      email_content: emailContent
    })

  } catch (error) {
    console.error('School email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate school email', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
