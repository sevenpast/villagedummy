import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { 
  generateCacheKey, 
  validateAndCleanUrl, 
  validateLocationData, 
  getCachedResult, 
  setCachedResult,
  getOfficialLanguage 
} from '@/lib/gemini-cache-utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { userId, municipality, canton } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('municipality, canton, postal_code')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
    }

    const userMunicipality = municipality || userProfile?.municipality;
    const userCanton = canton || userProfile?.canton;

    // Validate location data
    const validation = validateLocationData(userMunicipality, userCanton);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error,
        code: 'INVALID_LOCATION_DATA'
      }, { status: 400 });
    }

    const cleanMunicipality = validation.municipality!;
    const cleanCanton = validation.canton!;

    // Check cache first
    const cacheKey = generateCacheKey('school_website', cleanMunicipality, cleanCanton);
    const cachedResult = await getCachedResult(cacheKey, userId);
    
    if (cachedResult.success && cachedResult.fromCache) {
      return NextResponse.json({
        success: true,
        school_website_url: cachedResult.data.school_website_url,
        school_authority_name: cachedResult.data.school_authority_name,
        school_authority_email: cachedResult.data.school_authority_email,
        official_language: cachedResult.data.official_language,
        contact_phone: cachedResult.data.contact_phone,
        address: cachedResult.data.address,
        from_cache: true,
        cached_at: cachedResult.data.cached_at
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      const officialLanguage = getOfficialLanguage(cleanCanton);
      const demoData = {
        school_website_url: `https://www.schule-${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        school_authority_name: `Schulamt ${cleanMunicipality}`,
        school_authority_email: `schulamt@${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        official_language: officialLanguage,
        contact_phone: '+41 XX XXX XX XX',
        address: `${cleanMunicipality}, ${cleanCanton}`,
        cached_at: new Date().toISOString()
      };
      
      // Cache the demo result
      await setCachedResult(cacheKey, 'school_website', cleanMunicipality, cleanCanton, demoData, userId);
      
      return NextResponse.json({ 
        success: true,
        ...demoData,
        demo_response: true,
        message: 'This is a demo response. Please configure your Gemini API key for real results.'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const officialLanguage = getOfficialLanguage(cleanCanton);
      
      // Find school registration website
      const websitePrompt = `Finde die offizielle Webseite für die Schulanmeldung der Gemeinde ${cleanMunicipality} im Kanton ${cleanCanton} in der Schweiz. 

Gib nur die URL zurück, keine zusätzlichen Erklärungen. Falls keine spezifische Webseite gefunden wird, gib die URL der kantonalen Schulbehörde zurück.

Beispiel-Format: https://www.gemeinde.ch/schulanmeldung`;

      const websiteResult = await model.generateContent(websitePrompt);
      const websiteResponse = await websiteResult.response;
      const schoolWebsiteUrl = websiteResponse.text().trim();

      // Validate and clean the website URL
      const validatedWebsiteUrl = validateAndCleanUrl(schoolWebsiteUrl);

      // Find school authority details
      const authorityPrompt = `Was ist der Name, die E-Mail-Adresse und die offizielle Amtssprache (Deutsch, Französisch oder Italienisch) der Schulverwaltung (Schulbehörde) für die Gemeinde ${cleanMunicipality} im Kanton ${cleanCanton} in der Schweiz?

Antworte im JSON-Format:
{
  "school_authority_name": "Name der Schulbehörde",
  "school_authority_email": "email@behoerde.ch",
  "official_language": "Deutsch/Französisch/Italienisch",
  "contact_phone": "+41 XX XXX XX XX",
  "address": "Adresse der Schulbehörde"
}`;

      const authorityResult = await model.generateContent(authorityPrompt);
      const authorityResponse = await authorityResult.response;
      const authorityText = authorityResponse.text();

      let authorityData;
      try {
        authorityData = JSON.parse(authorityText.replace(/```json\n|```/g, ''));
      } catch (parseError) {
        console.warn('Failed to parse authority data, using fallback');
        authorityData = {
          school_authority_name: `Schulamt ${cleanMunicipality}`,
          school_authority_email: `schulamt@${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
          official_language: officialLanguage,
          contact_phone: '+41 XX XXX XX XX',
          address: `${cleanMunicipality}, ${cleanCanton}`
        };
      }

      const resultData = {
        school_website_url: validatedWebsiteUrl || `https://www.schule-${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        school_authority_name: authorityData.school_authority_name,
        school_authority_email: authorityData.school_authority_email,
        official_language: authorityData.official_language || officialLanguage,
        contact_phone: authorityData.contact_phone || '+41 XX XXX XX XX',
        address: authorityData.address || `${cleanMunicipality}, ${cleanCanton}`,
        cached_at: new Date().toISOString()
      };

      // Cache the result
      await setCachedResult(cacheKey, 'school_website', cleanMunicipality, cleanCanton, resultData, userId);

      return NextResponse.json({
        success: true,
        ...resultData,
        from_cache: false
      });

    } catch (aiError) {
      console.error('AI Processing Error:', aiError);
      
      // Fallback data
      const officialLanguage = getOfficialLanguage(cleanCanton);
      const fallbackData = {
        school_website_url: `https://www.schule-${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        school_authority_name: `Schulamt ${cleanMunicipality}`,
        school_authority_email: `schulamt@${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        official_language: officialLanguage,
        contact_phone: '+41 XX XXX XX XX',
        address: `${cleanMunicipality}, ${cleanCanton}`,
        cached_at: new Date().toISOString(),
        fallback: true
      };
      
      // Cache the fallback result
      await setCachedResult(cacheKey, 'school_website', cleanMunicipality, cleanCanton, fallbackData, userId);
      
      return NextResponse.json({
        success: true,
        ...fallbackData,
        message: 'Using fallback data. Please verify the information is correct.'
      });
    }

  } catch (error) {
    console.error('School website search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to find school website',
        code: 'SEARCH_FAILED'
      },
      { status: 500 }
    );
  }
}