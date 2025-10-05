import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Finaler, hochpräziser Prompt für Gemini 1.5 Pro
const FINAL_GEMINI_PROMPT = `
Analysiere alle Seiten des bereitgestellten, hochauflösenden Bildes eines Dokuments. Deine Aufgabe ist es, alle für den Benutzer relevanten Elemente zu extrahieren und als ein einziges, valides JSON-Array auszugeben.

**STRENGE REGELN FÜR DIE EXTRAKTION:**
1. **Element-Typen:** Identifiziere zwei Arten von Elementen: 'input_field' (für Benutzereingaben) und 'text_block' (für Überschriften, Anweisungen, Absätze).
2. **Vollständiger Kontext:** Extrahiere immer die vollständige Beschriftung eines Feldes.
3. **Kein Rauschen:** Ignoriere rein dekorative Elemente, Seitenzahlen oder Elemente ohne klaren Zweck für das Ausfüllen des Formulars. Erfinde keine Felder.
4. **Unbeschriftete Felder:** Wenn ein Eingabefeld keine klare Beschriftung hat, setze den Wert für "original_text" auf \`null\`.

**EXAKTE JSON-STRUKTUR PRO ELEMENT:**
- \`elementType\`: Entweder 'input_field' oder 'text_block'.
- \`pageNumber\`: Die Seitenzahl (beginnend bei 1), auf der sich das Element befindet.
- \`original_text\`: Der exakte Originaltext (Deutsch).
- \`translated_text\`: Die exakte englische Übersetzung des Originaltextes.
- \`position\`: Ein Objekt mit den Pixel-Koordinaten der oberen linken Ecke des Elements: \`{ "x": number, "y": number }\`.
- \`size\`: Ein Objekt mit der Breite und Höhe des Elements in Pixel: \`{ "width": number, "height": number }\`.
- \`field_type\`: NUR für 'input_field'. Muss 'text', 'date' oder 'checkbox' sein.

**BEISPIEL EINES PERFEKTEN 'input_field'-OBJEKTS:**
{
  "elementType": "input_field",
  "pageNumber": 1,
  "original_text": "Vorname",
  "translated_text": "First Name",
  "position": { "x": 150, "y": 700 },
  "size": { "width": 250, "height": 30 },
  "field_type": "text"
}

**BEISPIEL EINES PERFEKTEN 'text_block'-OBJEKTS:**
{
  "elementType": "text_block",
  "pageNumber": 1,
  "original_text": "Anmeldung für Kindergarten und Schule",
  "translated_text": "Registration for Kindergarten and School",
  "position": { "x": 100, "y": 50 },
  "size": { "width": 400, "height": 20 }
}

**WICHTIGE ÜBERSETZUNGSREGELN:**
- "Vorname" → "First Name"
- "Nachname" / "Name" → "Last Name"
- "Geburtsdatum" → "Date of Birth"
- "Geschlecht" → "Gender"
- "männlich" → "Male"
- "weiblich" → "Female"
- "Staatsangehörigkeit" / "Nationalität" → "Nationality"
- "Geburtsort" / "Bürgerort" → "Place of Birth"
- "Religion" → "Religion"
- "Beruf" → "Profession"
- "Adresse" → "Address"
- "Mobile" → "Mobile Phone"
- "EMail" / "EMailAdresse" → "Email"
- "Telefonnummer" → "Phone Number"
- "Umgangssprache in der Familie" → "Language Spoken in Family"
- "Deutschkenntnisse" → "German Language Skills"
- "Muttersprache" → "Mother Tongue"
- "Erstsprache" → "First Language"
- "Zweitsprache" → "Second Language"
- "Drittsprache" → "Third Language"
- "DaZ seit" → "German as Second Language Since"
- "Logopädie seit" → "Speech Therapy Since"
- "PMT seit" → "PMT Since"
- "andere Therapien" → "Other Therapies"
- "Arbeitsund Lernverhalten" → "Work and Learning Behavior"
- "Sozialverhalten" → "Social Behavior"
- "Sonstiges" → "Other"
- "Funktion" → "Function"
- "Begabtenund Begabungsförderung" → "Gifted and Talent Promotion"
- "Nachteilsausgleich in Form von" → "Disadvantage Compensation in Form of"
- "Lernzielbefreiung" → "Learning Objective Exemption"
- "IF Bereiche" → "IF Areas"
- "ISR Bereich" → "ISR Area"
- "SSA" → "SSA"
- "Klasse bisher" → "Previous Class"
- "Name Lehrperson bisher" → "Previous Teacher Name"
- "Zuzug nach Wallisellen per" → "Move to Wallisellen Date"
- "Name und Vorname des Kindes" → "Child Full Name"
- "Name und Ort der Schule" → "School Name and Location"
- "Strasse bisher" → "Previous Street"
- "Ort Land bisher" → "Previous City/Country"
- "Adresse gültig bis" → "Address Valid Until"

**ANTWORT-FORMAT:**
Deine Antwort MUSS ausschließlich ein JSON-Array sein, ohne Markdown-Formatierung. Das JSON muss exakt dem oben beschriebenen Schema entsprechen.

Analysiere jetzt das Dokument und gib mir das vollständige JSON-Array zurück.`;

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Final Gemini Analysis API called');
    
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error('❌ Gemini API key not configured');
      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        fallback: true 
      }, { status: 500 });
    }

    // Initialize Gemini with the correct model and stable v1 API
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    // Convert PDF to base64 for Gemini analysis
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'application/pdf';

    console.log('🔍 Sending PDF to Gemini for final analysis...');
    
    const result = await model.generateContent([
      FINAL_GEMINI_PROMPT,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini analysis completed');
    console.log('📋 Raw response length:', text.length);

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', parseError);
      console.log('📄 Raw response:', text);
      return NextResponse.json({ 
        error: 'Failed to parse Gemini response',
        details: parseError instanceof Error ? parseError.message : 'Unknown error',
        rawResponse: text
      }, { status: 500 });
    }

    // Validate the response structure
    if (!Array.isArray(analysisResult)) {
      console.error('❌ Gemini response is not an array');
      return NextResponse.json({ 
        error: 'Invalid response format: expected array',
        response: analysisResult
      }, { status: 500 });
    }

    console.log(`✅ Successfully analyzed ${analysisResult.length} elements`);

    return NextResponse.json({
      success: true,
      elements: analysisResult,
      totalElements: analysisResult.length,
      analysisType: 'final_gemini_analysis'
    });
    
  } catch (error) {
    console.error('❌ Final Gemini analysis failed:', error);
    return NextResponse.json({ 
      error: 'Final Gemini analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
