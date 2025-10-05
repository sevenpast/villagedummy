import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { municipality, canton, postalCode } = await request.json();

    if (!municipality || !canton) {
      return NextResponse.json({
        success: false,
        error: 'Missing municipality or canton information'
      }, { status: 400 });
    }

    // Initialize Gemini AI
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyC8CHSLaNtftBtpLqk2HDuFX5Jiq98Pifo';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    console.log(`🔍 Finding school website for ${municipality}, ${canton}`);

    const prompt = `
You are a Swiss education system expert. Find the official school registration website for the following municipality:

Municipality: ${municipality}
Canton: ${canton}
Postal Code: ${postalCode || 'not provided'}

Please find the official website where parents can register their children for school/kindergarten in this municipality. Look for:

1. Schulverwaltung (School Administration)
2. Schulamt (School Office) 
3. Kreisschulbehörde (District School Authority)
4. Gemeinde website with school registration section
5. Education department of the municipality

The website should be the official government website where parents can:
- Register children for school/kindergarten
- Find school registration forms
- Get information about school enrollment
- Contact school administration

Please provide:
1. The exact URL of the school registration website
2. A brief description of what parents can find there
3. The official name of the school administration office

Format your response as JSON:
{
  "website": "https://example.com/school-registration",
  "description": "Official school registration website for [municipality]",
  "officeName": "Schulverwaltung [municipality]"
}

If you cannot find a specific website, return:
{
  "website": null,
  "description": "No specific school registration website found",
  "officeName": "Contact municipality directly"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response:', text);

    // Try to parse JSON response
    let websiteData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        websiteData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response',
        rawResponse: text
      }, { status: 500 });
    }

    if (websiteData.website) {
      console.log(`✅ Found school website: ${websiteData.website}`);
      return NextResponse.json({
        success: true,
        website: websiteData.website,
        description: websiteData.description,
        officeName: websiteData.officeName,
        municipality: municipality,
        canton: canton
      });
    } else {
      console.log('❌ No school website found');
      return NextResponse.json({
        success: false,
        error: 'No school registration website found for this municipality',
        description: websiteData.description,
        municipality: municipality,
        canton: canton
      });
    }

  } catch (error) {
    console.error('Error finding school website:', error);
    return NextResponse.json({
      success: false,
      error: 'Error finding school website'
    }, { status: 500 });
  }
}
