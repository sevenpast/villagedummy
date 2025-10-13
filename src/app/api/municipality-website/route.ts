import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  generateCacheKey, 
  validateAndCleanUrl, 
  validateLocationData, 
  getCachedResult, 
  setCachedResult 
} from '@/lib/gemini-cache-utils'

export async function POST(request: NextRequest) {
  try {
    const { municipality, canton, userId } = await request.json()

    // Validate input data
    const validation = validateLocationData(municipality, canton)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error,
        code: 'INVALID_LOCATION_DATA'
      }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required for caching',
        code: 'MISSING_USER_ID'
      }, { status: 400 })
    }

    const cleanMunicipality = validation.municipality!
    const cleanCanton = validation.canton!

    // Check cache first
    const cacheKey = generateCacheKey('municipality_website', cleanMunicipality, cleanCanton)
    const cachedResult = await getCachedResult(cacheKey, userId)
    
    if (cachedResult.success && cachedResult.fromCache) {
      return NextResponse.json({
        success: true,
        website_url: cachedResult.data.website_url,
        from_cache: true,
        cached_at: cachedResult.data.cached_at
      })
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      // Return demo data for development
      const demoUrl = `https://www.${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`
      const demoData = {
        website_url: demoUrl,
        municipality: cleanMunicipality,
        canton: cleanCanton,
        cached_at: new Date().toISOString()
      }
      
      // Cache the demo result
      await setCachedResult(cacheKey, 'municipality_website', cleanMunicipality, cleanCanton, demoData, userId)
      
      return NextResponse.json({
        success: true,
        website_url: demoUrl,
        demo_response: true,
        message: 'This is a demo response. Please configure your Gemini API key for real results.'
      })
    }

    try {
      // Call Gemini API to find the municipality website
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Finde die offizielle Webseite für die Einwohneranmeldung der Gemeinde ${cleanMunicipality} im Kanton ${cleanCanton} in der Schweiz. 

Gib nur die URL zurück, keine weiteren Erklärungen. Die URL sollte direkt zur Anmeldeseite oder zur Hauptseite der Gemeinde führen.

Beispiel-Format: https://www.gemeinde.ch

Gemeinde: ${cleanMunicipality}
Kanton: ${cleanCanton}`
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

      // Validate and clean the URL
      const validatedUrl = validateAndCleanUrl(websiteUrl)
      if (!validatedUrl) {
        throw new Error('Invalid URL format returned by Gemini')
      }

      const resultData = {
        website_url: validatedUrl,
        municipality: cleanMunicipality,
        canton: cleanCanton,
        cached_at: new Date().toISOString()
      }

      // Cache the result
      await setCachedResult(cacheKey, 'municipality_website', cleanMunicipality, cleanCanton, resultData, userId)

      return NextResponse.json({
        success: true,
        website_url: validatedUrl,
        from_cache: false
      })

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      
      // Fallback: try to construct a plausible URL
      const fallbackUrl = `https://www.${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`
      const fallbackData = {
        website_url: fallbackUrl,
        municipality: cleanMunicipality,
        canton: cleanCanton,
        cached_at: new Date().toISOString(),
        fallback: true
      }
      
      // Cache the fallback result
      await setCachedResult(cacheKey, 'municipality_website', cleanMunicipality, cleanCanton, fallbackData, userId)
      
      return NextResponse.json({
        success: true,
        website_url: fallbackUrl,
        fallback: true,
        message: 'Using fallback URL. Please verify the website is correct.'
      })
    }

  } catch (error) {
    console.error('Municipality website search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to find municipality website',
        code: 'SEARCH_FAILED'
      },
      { status: 500 }
    )
  }
}