import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument, PDFForm } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Simple PDF Form Analysis API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log('📋 Request data:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId
    });

    if (!file || !userId) {
      console.error('❌ Missing required data:', { file: !!file, userId: !!userId });
      return NextResponse.json({
        success: false,
        error: 'Missing file or userId'
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json({
        success: false,
        error: 'File must be a PDF'
      }, { status: 400 });
    }

    // Initialize Gemini AI
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyC8CHSLaNtftBtpLqk2HDuFX5Jiq98Pifo';
    
    if (!apiKey) {
      console.error('❌ Gemini API key not found');
      return NextResponse.json({
        success: false,
        error: 'Gemini API key not configured'
      }, { status: 500 });
    }

    console.log('🤖 Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    console.log(`🔍 Processing PDF form: ${file.name}`);

    // Convert file to array buffer and base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Load PDF with pdf-lib to extract form fields
    console.log('📄 Loading PDF with pdf-lib...');
    let pdfDoc;
    let form;
    let fields = [];
    
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer);
      form = pdfDoc.getForm();
      fields = form.getFields();
      console.log(`📋 Successfully loaded PDF with ${fields.length} form fields`);
    } catch (pdfError) {
      console.warn('⚠️ PDF has no form fields or is not a fillable form:', pdfError.message);
      // Continue with empty fields array - we'll let Gemini analyze the content
      fields = [];
    }

    console.log(`📋 Found ${fields.length} form fields in PDF`);

    // Extract field information
    const fieldInfo = fields.map((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      return {
        name: fieldName,
        type: fieldType,
        index: index
      };
    });

    // Create enhanced Gemini prompt for form analysis
    const analysisPrompt = `
Du bist ein Experte für die Analyse von Formulardokumenten, speziell für Schweizer Behördenformulare.

Analysiere das folgende PDF-Formular. ${fields.length > 0 ? 
  `Ich habe bereits die technischen Formularfelder extrahiert: ${fieldInfo.map(f => `- ${f.name} (${f.type})`).join('\n')}` : 
  'Dieses PDF hat keine technischen Formularfelder, aber es könnte ein Formular zum Ausfüllen sein.'}

Deine Aufgabe:
1. Identifiziere die Sprache des Formulars (de, fr, it, rm)
2. Bestimme den Titel des Formulars
3. ${fields.length > 0 ? 
  'Analysiere jedes technische Feld und erstelle eine benutzerfreundliche Beschreibung' : 
  'Identifiziere alle Bereiche, die ausgefüllt werden müssen (Textfelder, Checkboxen, etc.)'}
4. Übersetze alle Labels ins Englische
5. Kategorisiere die Feldtypen (text, checkbox, radio, dropdown)

Deine Antwort MUSS ausschliesslich ein JSON-Objekt sein, ohne Markdown-Formatierung.

Schema:
{
  "formLanguage": "de|fr|it|rm",
  "formTitle": "string (Titel des Formulars)",
  "fields": [
    {
      "fieldName": "string (technischer Name aus der PDF)",
      "originalLabel": "string (was das Feld wahrscheinlich bedeutet)",
      "translatedLabel": "string (englische Übersetzung)",
      "fieldType": "text|checkbox|radio|dropdown",
      "required": boolean,
      "options": [
        { "original": "string", "translated": "string" }
      ],
      "validation": "string (z.B. 'email', 'date', 'number')"
    }
  ]
}

Wichtige Regeln:
- Verwende die exakten technischen Feldnamen aus der PDF
- Erkenne Schweizer Formularmuster (Anmeldung, Personalien, Adresse, etc.)
- Für Checkboxen: identifiziere boolean-Felder
- Für Radio-Buttons: identifiziere Auswahlmöglichkeiten
- Übersetze alle Labels ins Englische
- Verwende camelCase für fieldName wenn möglich
`;

    console.log('🤖 Sending PDF to Gemini AI for analysis...');
    
    try {
      const analysisResult = await model.generateContent([
        analysisPrompt,
        {
          inlineData: {
            data: base64,
            mimeType: 'application/pdf'
          }
        }
      ]);

      const analysisResponse = await analysisResult.response;
      const analysisText = analysisResponse.text();

      console.log('✅ Gemini analysis completed');
      console.log('📝 Analysis response length:', analysisText.length);
      console.log('📝 Analysis response preview:', analysisText.substring(0, 200) + '...');

      // Parse Gemini response
      let formAnalysis;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          formAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response:', parseError);
        console.log('Raw response:', analysisText);
        throw new Error('Failed to parse AI analysis response');
      }

      // Process fields and create form structure
      const processedFields = (formAnalysis.fields || []).map((field: any) => {
        return {
          id: field.fieldName || `field_${Math.random().toString(36).substr(2, 9)}`,
          originalName: field.originalLabel || field.fieldName || 'Unknown Field',
          englishLabel: field.translatedLabel || field.originalLabel || 'Unknown Field',
          tooltip: `Original: ${field.originalLabel || field.fieldName || 'Unknown'}`,
          type: getFieldType(field.fieldType),
          required: field.required || false,
          validation: field.validation || 'text',
          options: field.options || [],
          geminiMatched: true,
          coordinateMatched: false // Simple version doesn't use coordinates
        };
      });

      console.log(`✅ Processed ${processedFields.length} fields`);

      return NextResponse.json({
        success: true,
        data: {
          id: `temp_${Date.now()}`,
          language: formAnalysis.formLanguage,
          languageName: getLanguageName(formAnalysis.formLanguage),
          formTitle: formAnalysis.formTitle,
          fields: processedFields,
          totalFields: processedFields.length,
          geminiMatchedFields: processedFields.filter(f => f.geminiMatched).length,
          coordinateMatchedFields: 0, // Simple version
          pdfData: base64
        }
      });

    } catch (geminiError) {
      console.error('❌ Gemini AI error:', geminiError);
      return NextResponse.json({
        success: false,
        error: `Gemini AI analysis failed: ${geminiError.message}`,
        details: geminiError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing PDF form:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({
      success: false,
      error: `Error processing PDF form: ${error.message}`,
      details: error.message
    }, { status: 500 });
  }
}

function getFieldType(geminiType: string): string {
  switch (geminiType.toLowerCase()) {
    case 'checkbox':
      return 'checkbox';
    case 'radio':
      return 'radio';
    case 'dropdown':
    case 'select':
      return 'dropdown';
    default:
      return 'text';
  }
}

function getLanguageName(langCode: string): string {
  const languages: Record<string, string> = {
    'de': 'German',
    'fr': 'French', 
    'it': 'Italian',
    'rm': 'Romansh'
  };
  return languages[langCode] || 'Unknown';
}
