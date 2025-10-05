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

    // Initialize Gemini with the correct model and stable v1 API
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    // Use hybrid approach: Extract text from PDF and use Gemini for intelligent analysis
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('🔍 Using hybrid PDF analysis approach...');
    
    // Extract text and structure from PDF using pdf-lib
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log(`📏 PDF dimensions: ${width} x ${height}`);
    
    // Get form fields if they exist
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log(`📋 Found ${fields.length} technical form fields`);
    
    // Create a comprehensive text description for Gemini
    const fieldDescriptions = fields.map((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      return `Field ${index + 1}: "${fieldName}" (Type: ${fieldType})`;
    }).join('\n');
    
    // Use the PDF as base64 for Gemini (it can handle PDFs in some cases)
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'application/pdf';

    // Create the comprehensive prompt for form analysis
    const prompt = `
Analysiere das Bild dieses Formulars. Deine Aufgabe ist es, ALLE ausfüllbaren Felder für einen Benutzer zu extrahieren und als valides JSON-Array auszugeben.

TECHNISCHE FELDINFORMATIONEN (als Referenz):
${fieldDescriptions}

PDF-DIMENSIONEN: ${width} x ${height} Punkte

**WICHTIGE REGELN:**
1. **Ignoriere Störelemente:** Extrahiere KEINE Felder, die nur aus Zahlen, Aufzählungszeichen oder dekorativen Linien bestehen. Ein Feld ist nur dann ein Feld, wenn es eine klare Beschriftung und einen Platz für eine Benutzereingabe hat. Die Felder "1", "2", "1_2" aus dem Beispiel sind KEINE gültigen Felder.
2. **Extrahiere den VOLLSTÄNDIGEN Kontext:** Die Beschriftung eines Feldes ist der gesamte Text, der logisch dazu gehört. Extrahiere z.B. "Logopädie, seit" und NICHT nur "seit".
3. **Umgang mit unbeschrifteten Feldern:** Wenn du ein Eingabefeld (besonders eine Checkbox) ohne direkt zuordenbaren Text findest, setze den Wert für "original_label" auf \`null\`. Erfinde keine "undefined"-Namen.
4. **Intelligente Gruppierung:** Gruppiere zusammengehörige Felder (z.B. "männlich" und "weiblich" als Gender-Optionen).
5. **Präzise Übersetzungen:** Übersetze jeden deutschen Begriff präzise ins Englische. "Vorname" = "First Name", "Geburtsdatum" = "Date of Birth", "Umgangssprache in der Familie" = "Language Spoken in Family".

**BEISPIEL FÜR EIN PERFEKTES ERGEBNIS:**
{
  "fieldName": "childFirstName",
  "originalLabel": "Vorname",
  "translatedLabel": "First Name",
  "fieldType": "text",
  "position": { "x": 123, "y": 456 },
  "size": { "width": 150, "height": 25 },
  "required": true,
  "options": [],
  "validation": "required",
  "placeholder": "Vorname"
}

**FINALES JSON-FORMAT:**
- Das Ergebnis MUSS ein JSON-Array sein.
- Jedes Objekt im Array MUSS die Schlüssel "fieldName", "originalLabel", "translatedLabel", "fieldType", "position", "size", "required", "options", "validation", und "placeholder" enthalten.
- Der "fieldType" MUSS 'text', 'date', 'checkbox', 'radio', 'email', oder 'tel' sein.
- Koordinaten: X geht von links (0) nach rechts (${width}), Y geht von oben (0) nach unten (${height}).

Finde nun alle Felder im Dokument, die diesen strengen Regeln folgen.`;

    // Send to Gemini Vision with the converted image
    console.log('🔍 Sending image to Gemini Vision for analysis...');
    
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
