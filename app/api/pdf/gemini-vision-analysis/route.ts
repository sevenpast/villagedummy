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
Du bist ein Experte für die Analyse von PDF-Formularen. Ich sende dir eine PDF-Datei und zusätzliche technische Informationen über die Formularfelder.

TECHNISCHE FELDINFORMATIONEN:
${fieldDescriptions}

PDF-DIMENSIONEN: ${width} x ${height} Punkte

WICHTIGE ANWEISUNGEN:
1. Analysiere die PDF visuell und identifiziere ALLE ausfüllbaren Felder
2. Verwende die technischen Feldinformationen als Referenz, aber interpretiere sie intelligent
3. Extrahiere die deutsche Beschriftung (Label) für jedes Feld
4. Übersetze jede deutsche Beschriftung ins Englische
5. Bestimme den Feldtyp (text, checkbox, radio, select, date, email, tel)
6. Schätze die X/Y-Koordinaten für jedes Eingabefeld (relativ zur PDF-Seite)
7. Bestimme, ob das Feld erforderlich ist (required: true/false)
8. Für Radio-Buttons und Dropdowns: liste alle verfügbaren Optionen auf

BESONDERE HINWEISE:
- Felder mit Namen wie "undefined", "undefined_2" etc. sind wahrscheinlich Checkboxen ohne Label
- Felder mit Namen wie "Vorname", "Name", "Geburtsdatum" sind Textfelder
- Felder mit Namen wie "männlich", "weiblich" sind wahrscheinlich Radio-Button-Optionen
- Koordinaten: X geht von links (0) nach rechts (${width}), Y geht von oben (0) nach unten (${height})

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

Analysiere jetzt die PDF und gib mir das JSON-Array zurück.`;

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
