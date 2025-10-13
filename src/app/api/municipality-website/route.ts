import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { municipality, canton } = await request.json()

    if (!municipality || !canton) {
      return NextResponse.json({ error: 'Municipality and canton are required' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 })
    }

    // Call Gemini API to find the municipality website
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Finde die offizielle Webseite für die Einwohneranmeldung der Gemeinde ${municipality} im Kanton ${canton} in der Schweiz. 

Gib nur die URL zurück, keine weiteren Erklärungen. Die URL sollte direkt zur Anmeldeseite oder zur Hauptseite der Gemeinde führen.

Beispiel-Format: https://www.gemeinde.ch

Gemeinde: ${municipality}
Kanton: ${canton}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 100,
        }
      })
    })

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const geminiData = await geminiResponse.json()
    const websiteUrl = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!websiteUrl) {
      throw new Error('No website URL found')
    }

    // Clean up the URL (remove any extra text)
    const cleanUrl = websiteUrl.replace(/^https?:\/\//, '').split(' ')[0]
    const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`

    return NextResponse.json({
      success: true,
      website_url: finalUrl,
      municipality: municipality,
      canton: canton
    })

  } catch (error) {
    console.error('Municipality website error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to find municipality website', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
