import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';

// Use the v1 API endpoint by default
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '', {
  apiVersion: 'v1'
});

// Finaler, hochpräziser Prompt für Gemini 1.5 Pro
const FINAL_GEMINI_PROMPT = `
Analysiere das Bild dieses Formulars. Deine Aufgabe ist es, ALLE ausfüllbaren Felder für einen Benutzer zu extrahieren und als valides JSON-Array auszugeben.

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
    console.log('🚀 Gemini Vision A-Z Analysis API called');
    
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    // Load PDF and get basic information
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log(`📏 PDF dimensions: ${width} x ${height}`);
    console.log(`📄 Total pages: ${pages.length}`);

    // For now, we'll use the direct PDF approach since pdf2pic has server environment issues
    // In a production environment, you would convert each page to high-resolution images
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'application/pdf';

    console.log('🔍 Sending PDF to Gemini for advanced analysis...');
    
    const result = await model.generateContent([
      FINAL_GEMINI_PROMPT,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      }
    ]);

    console.log('Gemini raw result:', JSON.stringify(result, null, 2));

    const response = result.response;
    const text = response.text();
    
    console.log('✅ Gemini analysis successful');
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

    // Separate input fields and text blocks
    const inputFields = analysisResult.filter((element: any) => element.elementType === 'input_field');
    const textBlocks = analysisResult.filter((element: any) => element.elementType === 'text_block');

    console.log(`✅ Successfully analyzed ${analysisResult.length} elements:`);
    console.log(`   - ${inputFields.length} input fields`);
    console.log(`   - ${textBlocks.length} text blocks`);

    return NextResponse.json({
      success: true,
      elements: analysisResult,
      inputFields: inputFields,
      textBlocks: textBlocks,
      totalElements: analysisResult.length,
      totalInputFields: inputFields.length,
      totalTextBlocks: textBlocks.length,
      pdfDimensions: { width, height },
      totalPages: pages.length,
      analysisType: 'advanced_pdf_analysis'
    });
    
  } catch (error) {
    console.error('❌ Advanced PDF analysis failed:', error);
    
    // Log the full error object for more details
    console.error('Full error object:', JSON.stringify(error, null, 2));

    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // Check for specific API key error
    if (errorMessage.includes('API key not valid')) {
        return NextResponse.json({ 
            error: 'Gemini API key is not valid. Please check your environment variables.',
            details: errorMessage
        }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Advanced PDF analysis failed',
      details: errorMessage
    }, { status: 500 });
  }
}
