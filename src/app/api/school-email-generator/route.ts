import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { 
  generateCacheKey, 
  validateLocationData, 
  getCachedResult, 
  setCachedResult,
  getOfficialLanguage,
  generateMultilingualEmail,
  validateEmail
} from '@/lib/gemini-cache-utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { userId, municipality, canton, childrenAges } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('municipality, canton, first_name, last_name, email')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
    }

    const userMunicipality = municipality || userProfile?.municipality;
    const userCanton = canton || userProfile?.canton;
    const userEmail = userProfile?.email;

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
    const cacheKey = generateCacheKey('school_authority', cleanMunicipality, cleanCanton);
    const cachedResult = await getCachedResult(cacheKey, userId);
    
    if (cachedResult.success && cachedResult.fromCache) {
      const officialLanguage = cachedResult.data.official_language || getOfficialLanguage(cleanCanton);
      const emailContent = generateMultilingualEmail(officialLanguage, cleanMunicipality, cleanCanton, 'school_registration');
      
      return NextResponse.json({
        success: true,
        school_authority_name: cachedResult.data.school_authority_name,
        school_authority_email: cachedResult.data.school_authority_email,
        official_language: officialLanguage,
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        user_email: userEmail,
        from_cache: true,
        cached_at: cachedResult.data.cached_at
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      const officialLanguage = getOfficialLanguage(cleanCanton);
      const emailContent = generateMultilingualEmail(officialLanguage, cleanMunicipality, cleanCanton, 'school_registration');
      
      const demoData = {
        school_authority_name: `Schulamt ${cleanMunicipality}`,
        school_authority_email: `schulamt@${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        official_language: officialLanguage,
        cached_at: new Date().toISOString()
      };
      
      // Cache the demo result
      await setCachedResult(cacheKey, 'school_authority', cleanMunicipality, cleanCanton, demoData, userId);
      
      return NextResponse.json({ 
        success: true,
        ...demoData,
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        user_email: userEmail,
        demo_response: true,
        message: 'This is a demo response. Please configure your Gemini API key for real results.'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const officialLanguage = getOfficialLanguage(cleanCanton);
      
      // Find school authority details
      const authorityPrompt = `Was ist der Name, die E-Mail-Adresse und die offizielle Amtssprache (Deutsch, Französisch oder Italienisch) der Schulverwaltung (Schulbehörde) für die Gemeinde ${cleanMunicipality} im Kanton ${cleanCanton} in der Schweiz?

Antworte im JSON-Format:
{
  "school_authority_name": "Name der Schulbehörde",
  "school_authority_email": "email@behoerde.ch",
  "official_language": "Deutsch/Französisch/Italienisch"
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
          official_language: officialLanguage
        };
      }

      // Validate the email address
      if (!validateEmail(authorityData.school_authority_email)) {
        console.warn('Invalid email format, using fallback');
        authorityData.school_authority_email = `schulamt@${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`;
      }

      const resultData = {
        school_authority_name: authorityData.school_authority_name,
        school_authority_email: authorityData.school_authority_email,
        official_language: authorityData.official_language || officialLanguage,
        cached_at: new Date().toISOString()
      };

      // Cache the result
      await setCachedResult(cacheKey, 'school_authority', cleanMunicipality, cleanCanton, resultData, userId);

      // Generate multilingual email content
      const finalOfficialLanguage = resultData.official_language;
      const emailContent = generateMultilingualEmail(finalOfficialLanguage, cleanMunicipality, cleanCanton, 'school_registration');

      return NextResponse.json({
        success: true,
        ...resultData,
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        user_email: userEmail,
        from_cache: false
      });

    } catch (aiError) {
      console.error('AI Processing Error:', aiError);
      
      // Fallback data
      const officialLanguage = getOfficialLanguage(cleanCanton);
      const emailContent = generateMultilingualEmail(officialLanguage, cleanMunicipality, cleanCanton, 'school_registration');
      
      const fallbackData = {
        school_authority_name: `Schulamt ${cleanMunicipality}`,
        school_authority_email: `schulamt@${cleanMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        official_language: officialLanguage,
        cached_at: new Date().toISOString(),
        fallback: true
      };
      
      // Cache the fallback result
      await setCachedResult(cacheKey, 'school_authority', cleanMunicipality, cleanCanton, fallbackData, userId);
      
      return NextResponse.json({
        success: true,
        ...fallbackData,
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        user_email: userEmail,
        message: 'Using fallback data. Please verify the information is correct.'
      });
    }

  } catch (error) {
    console.error('School email generator error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate school email',
        code: 'GENERATION_FAILED'
      },
      { status: 500 }
    );
  }
}