import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Gemini Vision PDF Analysis API called');
    
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Check for Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('❌ Gemini API key not found');
      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        fallback: true 
      }, { status: 500 });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Convert PDF to base64 for Gemini Vision
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;

    console.log('🔍 Sending PDF to Gemini Vision for analysis...');

    // Create the comprehensive prompt for form analysis
    const prompt = `
Du bist ein Experte für die Analyse von PDF-Formularen. Analysiere diese PDF-Seite und identifiziere alle ausfüllbaren Formularfelder.

WICHTIGE ANWEISUNGEN:
1. Identifiziere ALLE ausfüllbaren Felder (Textfelder, Checkboxen, Radio-Buttons, Dropdowns)
2. Extrahiere die deutsche Beschriftung (Label) für jedes Feld
3. Übersetze jede deutsche Beschriftung ins Englische
4. Bestimme den Feldtyp (text, checkbox, radio, select, date, email, tel)
5. Schätze die X/Y-Koordinaten für jedes Eingabefeld (relativ zur PDF-Seite)
6. Bestimme, ob das Feld erforderlich ist (required: true/false)
7. Für Radio-Buttons und Dropdowns: liste alle verfügbaren Optionen auf

ANTWORT-FORMAT:
Deine Antwort MUSS ausschließlich ein JSON-Array sein, ohne Markdown-Formatierung. Das JSON muss exakt folgendem Schema entsprechen:

[
  {
    "fieldName": "string (eindeutiger technischer Name in camelCase)",
    "originalLabel": "string (das genaue deutsche Label aus dem PDF)",
    "translatedLabel": "string (die englische Übersetzung)",
    "fieldType": "string (text|checkbox|radio|select|date|email|tel)",
    "position": { "x": number, "y": number },
    "size": { "width": number, "height": number },
    "required": boolean,
    "options": [
      { "original": "string", "translated": "string" }
    ],
    "validation": "string (text|email|tel|date|required)",
    "placeholder": "string (deutsche Beschriftung als Platzhalter)"
  }
]

BEISPIEL für ein Kindergarten-Anmeldeformular:
[
  {
    "fieldName": "childFirstName",
    "originalLabel": "Vorname",
    "translatedLabel": "First Name",
    "fieldType": "text",
    "position": { "x": 120, "y": 250 },
    "size": { "width": 150, "height": 25 },
    "required": true,
    "options": [],
    "validation": "required",
    "placeholder": "Vorname"
  },
  {
    "fieldName": "childGender",
    "originalLabel": "Geschlecht",
    "translatedLabel": "Gender",
    "fieldType": "radio",
    "position": { "x": 120, "y": 300 },
    "size": { "width": 200, "height": 50 },
    "required": true,
    "options": [
      { "original": "männlich", "translated": "Male" },
      { "original": "weiblich", "translated": "Female" }
    ],
    "validation": "required",
    "placeholder": "Geschlecht"
  }
]

Analysiere jetzt die PDF und gib mir das JSON-Array zurück.`;

    // Send to Gemini Vision
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('📋 Raw Gemini response:', text.substring(0, 500) + '...');

    // Parse JSON response
    let analysis;
    try {
      // Clean the response (remove any markdown formatting)
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini JSON response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json({ 
        error: 'Failed to parse Gemini response',
        rawResponse: text.substring(0, 1000)
      }, { status: 500 });
    }

    // Validate the analysis structure
    if (!Array.isArray(analysis)) {
      console.error('❌ Gemini response is not an array:', analysis);
      return NextResponse.json({ 
        error: 'Invalid analysis format from Gemini',
        analysis: analysis
      }, { status: 500 });
    }

    console.log(`✅ Gemini Vision analysis complete: ${analysis.length} fields detected`);

    // Return the analysis
    return NextResponse.json({
      success: true,
      analysis: {
        formLanguage: "de",
        formTitle: "PDF Form Analysis",
        totalFields: analysis.length,
        fields: analysis
      },
      processingTime: Date.now(),
      note: `Gemini Vision analysis with ${analysis.length} fields detected and translated`
    });

  } catch (error) {
    console.error('❌ Gemini Vision analysis failed:', error);
    
    return NextResponse.json({ 
      error: 'Gemini Vision analysis failed',
      details: error instanceof Error ? error.message : String(error),
      fallback: true
    }, { status: 500 });
  }
}
