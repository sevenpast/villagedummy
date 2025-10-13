import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

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

    if (!userMunicipality || !userCanton) {
      return NextResponse.json({ 
        error: 'Municipality and canton information required',
        message: 'Please complete your profile with location information to find school registration details.'
      }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        demo_response: {
          school_website_url: 'https://www.schule-zuerich.ch',
          school_authority_name: 'Schulamt Zürich',
          school_authority_email: 'schulamt@stadt-zuerich.ch',
          official_language: 'Deutsch',
          message: 'This is a demo response. Please configure your Gemini API key for real results.'
        }
      }, { status: 200 });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Find school registration website
      const websitePrompt = `Finde die offizielle Webseite für die Schulanmeldung der Gemeinde ${userMunicipality} im Kanton ${userCanton} in der Schweiz. 

Gib nur die URL zurück, keine zusätzlichen Erklärungen. Falls keine spezifische Webseite gefunden wird, gib die URL der kantonalen Schulbehörde zurück.

Beispiel-Format: https://www.gemeinde.ch/schulanmeldung`;

      const websiteResult = await model.generateContent(websitePrompt);
      const websiteResponse = await websiteResult.response;
      const schoolWebsiteUrl = websiteResponse.text().trim();

      // Find school authority details
      const authorityPrompt = `Was ist der Name, die E-Mail-Adresse und die offizielle Amtssprache (Deutsch, Französisch oder Italienisch) der Schulverwaltung (Schulbehörde) für die Gemeinde ${userMunicipality} im Kanton ${userCanton} in der Schweiz?

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
          school_authority_name: `Schulamt ${userMunicipality}`,
          school_authority_email: `schulamt@${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
          official_language: userCanton === 'ZH' || userCanton === 'BE' || userCanton === 'AG' ? 'Deutsch' : 
                           userCanton === 'VD' || userCanton === 'GE' || userCanton === 'NE' ? 'Französisch' : 'Italienisch',
          contact_phone: '+41 XX XXX XX XX',
          address: `${userMunicipality}, ${userCanton}`
        };
      }

      return NextResponse.json({
        success: true,
        school_website_url: schoolWebsiteUrl,
        school_authority_name: authorityData.school_authority_name,
        school_authority_email: authorityData.school_authority_email,
        official_language: authorityData.official_language,
        contact_phone: authorityData.contact_phone,
        address: authorityData.address,
        municipality: userMunicipality,
        canton: userCanton,
        processing_method: 'Gemini AI',
        timestamp: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('AI Processing Error:', aiError);
      
      // Fallback response
      return NextResponse.json({
        success: true,
        school_website_url: `https://www.${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch/schule`,
        school_authority_name: `Schulamt ${userMunicipality}`,
        school_authority_email: `schulamt@${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        official_language: userCanton === 'ZH' || userCanton === 'BE' || userCanton === 'AG' ? 'Deutsch' : 
                         userCanton === 'VD' || userCanton === 'GE' || userCanton === 'NE' ? 'Französisch' : 'Italienisch',
        contact_phone: '+41 XX XXX XX XX',
        address: `${userMunicipality}, ${userCanton}`,
        municipality: userMunicipality,
        canton: userCanton,
        processing_method: 'Fallback',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('School Website API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to find school website',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
