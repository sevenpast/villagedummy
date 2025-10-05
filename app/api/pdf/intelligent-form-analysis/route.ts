import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Intelligent form analysis prompt
    const prompt = `
Du bist ein Experte für die Analyse von Formulardokumenten. 

Analysiere das folgende Dokument (PDF oder Bild) und identifiziere ALLE ausfüllbaren Felder.

Für jedes Feld, das du findest, gib mir folgende Informationen zurück:

1. **Feldname** (eindeutiger technischer Name in camelCase)
2. **Original Label** (der exakte Text aus dem Dokument)
3. **Übersetztes Label** (englische Übersetzung)
4. **Feldtyp** (text, email, phone, date, number, checkbox, radio, select, textarea, signature)
5. **Position** (x, y Koordinaten relativ zur Seite)
6. **Größe** (width, height)
7. **Erforderlich** (true/false basierend auf * oder "erforderlich")
8. **Optionen** (für radio/select Felder)
9. **Validierung** (email, phone, date format, etc.)
10. **Platzhalter** (falls vorhanden)

**WICHTIG:** 
- Erkenne auch nicht-traditionelle Felder (wie Unterschriftsfelder, Datumsfelder, etc.)
- Berücksichtige das Layout und die räumliche Anordnung
- Übersetze alle deutschen/französischen/italienischen Labels ins Englische
- Erkenne Pflichtfelder anhand von * oder "erforderlich"

Antworte NUR mit einem sauberen JSON-Objekt in folgendem Format:

{
  "formLanguage": "de|fr|it|rm",
  "formTitle": "Titel des Formulars",
  "totalFields": 0,
  "fields": [
    {
      "fieldName": "firstName",
      "originalLabel": "Vorname",
      "translatedLabel": "First Name",
      "fieldType": "text",
      "position": { "x": 100, "y": 200 },
      "size": { "width": 150, "height": 25 },
      "required": true,
      "options": [],
      "validation": "text",
      "placeholder": "Ihr Vorname"
    }
  ]
}

Analysiere das Dokument jetzt:
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: file.type || 'application/pdf'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let analysisResult;
    try {
      // Clean the response text (remove markdown formatting if present)
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse AI analysis response',
        rawResponse: text 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      processingTime: Date.now()
    });

  } catch (error) {
    console.error('Intelligent form analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
