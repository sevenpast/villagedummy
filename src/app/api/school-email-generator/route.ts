import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

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
      .select('first_name, last_name, email, municipality, canton, children_ages')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
    }

    const userMunicipality = municipality || userProfile?.municipality;
    const userCanton = canton || userProfile?.canton;
    const userChildrenAges = childrenAges || userProfile?.children_ages || [6]; // Default age if not specified

    if (!userMunicipality || !userCanton) {
      return NextResponse.json({ 
        error: 'Municipality and canton information required',
        message: 'Please complete your profile with location information to generate school registration email.'
      }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      const demoEmailText = `Betreff: Anfrage zur Schulanmeldung für neu zugezogene Familie

Sehr geehrte Damen und Herren,

ich schreibe Ihnen als neu zugezogene Familie in ${userMunicipality}. Wir sind kürzlich in die Schweiz gezogen und möchten unser Kind (${userChildrenAges[0]} Jahre alt) für die Schule anmelden.

Könnten Sie uns bitte folgende Informationen zukommen lassen:

1. Welche Dokumente benötigen wir für die Schulanmeldung?
2. Welche Termine und Fristen sind zu beachten?
3. Gibt es spezielle Anforderungen für neu zugezogene Familien?
4. Wie läuft der Anmeldeprozess ab?

Wir sind gerne bereit, alle erforderlichen Unterlagen zu besorgen und Termine wahrzunehmen.

Vielen Dank für Ihre Unterstützung.

Mit freundlichen Grüßen
${userProfile?.first_name || 'Familie'} ${userProfile?.last_name || 'Mustermann'}

---
Subject: Inquiry about school registration for newly arrived family

Dear Sir/Madam,

I am writing to you as a newly arrived family in ${userMunicipality}. We recently moved to Switzerland and would like to register our child (${userChildrenAges[0]} years old) for school.

Could you please provide us with the following information:

1. What documents do we need for school registration?
2. What dates and deadlines should we be aware of?
3. Are there special requirements for newly arrived families?
4. How does the registration process work?

We are happy to provide all required documents and attend any necessary appointments.

Thank you for your support.

Kind regards
${userProfile?.first_name || 'Family'} ${userProfile?.last_name || 'Mustermann'}`;

      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        demo_response: {
          school_authority_email: `schulamt@${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
          user_email: userProfile?.email || 'user@example.com',
          email_subject: 'Anfrage zur Schulanmeldung für neu zugezogene Familie',
          email_text: demoEmailText,
          mailto_url: `mailto:schulamt@${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch?cc=${userProfile?.email || 'user@example.com'}&subject=${encodeURIComponent('Anfrage zur Schulanmeldung für neu zugezogene Familie')}&body=${encodeURIComponent(demoEmailText)}`,
          message: 'This is a demo response. Please configure your Gemini API key for real results.'
        }
      }, { status: 200 });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Find school authority details
      const authorityPrompt = `Was ist der Name, die E-Mail-Adresse und die offizielle Amtssprache (Deutsch, Französisch oder Italienisch) der Schulverwaltung (Schulbehörde) für die Gemeinde ${userMunicipality} im Kanton ${userCanton} in der Schweiz?

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
          school_authority_name: `Schulamt ${userMunicipality}`,
          school_authority_email: `schulamt@${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
          official_language: userCanton === 'ZH' || userCanton === 'BE' || userCanton === 'AG' ? 'Deutsch' : 
                           userCanton === 'VD' || userCanton === 'GE' || userCanton === 'NE' ? 'Französisch' : 'Italienisch'
        };
      }

      // Generate bilingual email text
      const emailPrompt = `Schreibe eine höfliche E-Mail in ${authorityData.official_language} an die Schulbehörde von ${userMunicipality}, Kanton ${userCanton}.

Kontext:
- Familie: ${userProfile?.first_name || 'Familie'} ${userProfile?.last_name || 'Mustermann'}
- Kinder: ${userChildrenAges.length} Kind(er) im Alter von ${userChildrenAges.join(', ')} Jahren
- Situation: Neu zugezogene Familie aus dem Ausland
- Gemeinde: ${userMunicipality}, Kanton ${userCanton}

Die E-Mail soll:
1. Höflich und professionell sein
2. Nach dem Prozess und den Dokumenten für die Schulanmeldung fragen
3. Erwähnen, dass es sich um eine neu zugezogene Familie handelt
4. Nach Terminen und Fristen fragen
5. Bereitschaft zur Zusammenarbeit ausdrücken

Füge unterhalb eine exakte englische Übersetzung hinzu.

Format:
Betreff: [Subject in ${authorityData.official_language}]

[E-Mail-Text in ${authorityData.official_language}]

---
Subject: [Subject in English]

[E-Mail-Text in English]`;

      const emailResult = await model.generateContent(emailPrompt);
      const emailResponse = await emailResult.response;
      const emailText = emailResponse.text();

      // Extract subject from email text
      const subjectMatch = emailText.match(/Betreff:\s*(.+?)(?:\n|$)/);
      const subject = subjectMatch ? subjectMatch[1].trim() : `Anfrage zur Schulanmeldung für neu zugezogene Familie`;

      // Create mailto URL
      const mailtoUrl = `mailto:${authorityData.school_authority_email}?cc=${userProfile?.email || ''}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailText)}`;

      return NextResponse.json({
        success: true,
        school_authority_name: authorityData.school_authority_name,
        school_authority_email: authorityData.school_authority_email,
        official_language: authorityData.official_language,
        user_email: userProfile?.email || '',
        email_subject: subject,
        email_text: emailText,
        mailto_url: mailtoUrl,
        municipality: userMunicipality,
        canton: userCanton,
        children_ages: userChildrenAges,
        processing_method: 'Gemini AI',
        timestamp: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('AI Processing Error:', aiError);
      
      // Fallback response
      const fallbackEmailText = `Betreff: Anfrage zur Schulanmeldung für neu zugezogene Familie

Sehr geehrte Damen und Herren,

ich schreibe Ihnen als neu zugezogene Familie in ${userMunicipality}. Wir sind kürzlich in die Schweiz gezogen und möchten unser${userChildrenAges.length > 1 ? 'e Kinder' : ' Kind'} (${userChildrenAges.join(', ')} Jahre alt) für die Schule anmelden.

Könnten Sie uns bitte folgende Informationen zukommen lassen:

1. Welche Dokumente benötigen wir für die Schulanmeldung?
2. Welche Termine und Fristen sind zu beachten?
3. Gibt es spezielle Anforderungen für neu zugezogene Familien?
4. Wie läuft der Anmeldeprozess ab?

Wir sind gerne bereit, alle erforderlichen Unterlagen zu besorgen und Termine wahrzunehmen.

Vielen Dank für Ihre Unterstützung.

Mit freundlichen Grüßen
${userProfile?.first_name || 'Familie'} ${userProfile?.last_name || 'Mustermann'}

---
Subject: Inquiry about school registration for newly arrived family

Dear Sir/Madam,

I am writing to you as a newly arrived family in ${userMunicipality}. We recently moved to Switzerland and would like to register our child${userChildrenAges.length > 1 ? 'ren' : ''} (${userChildrenAges.join(', ')} years old) for school.

Could you please provide us with the following information:

1. What documents do we need for school registration?
2. What dates and deadlines should we be aware of?
3. Are there special requirements for newly arrived families?
4. How does the registration process work?

We are happy to provide all required documents and attend any necessary appointments.

Thank you for your support.

Kind regards
${userProfile?.first_name || 'Family'} ${userProfile?.last_name || 'Mustermann'}`;

      const fallbackMailtoUrl = `mailto:schulamt@${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch?cc=${userProfile?.email || ''}&subject=${encodeURIComponent('Anfrage zur Schulanmeldung für neu zugezogene Familie')}&body=${encodeURIComponent(fallbackEmailText)}`;

      return NextResponse.json({
        success: true,
        school_authority_name: `Schulamt ${userMunicipality}`,
        school_authority_email: `schulamt@${userMunicipality.toLowerCase().replace(/\s+/g, '')}.ch`,
        official_language: userCanton === 'ZH' || userCanton === 'BE' || userCanton === 'AG' ? 'Deutsch' : 
                         userCanton === 'VD' || userCanton === 'GE' || userCanton === 'NE' ? 'Französisch' : 'Italienisch',
        user_email: userProfile?.email || '',
        email_subject: 'Anfrage zur Schulanmeldung für neu zugezogene Familie',
        email_text: fallbackEmailText,
        mailto_url: fallbackMailtoUrl,
        municipality: userMunicipality,
        canton: userCanton,
        children_ages: userChildrenAges,
        processing_method: 'Fallback',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('School Email Generator API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate school email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
