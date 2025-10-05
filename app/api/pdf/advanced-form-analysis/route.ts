import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument, PDFForm } from 'pdf-lib';
// Note: Avoid importing pdfjs-dist in a server route (requires DOM APIs like DOMMatrix)

export async function POST(request: NextRequest) {
  try {
    console.log('📄 Advanced PDF Form Analysis API called');
    
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    console.log(`🔍 Processing PDF form: ${file.name}`);

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Step 1: Extract text and coordinates using PDF.js
    console.log('📄 Extracting text and coordinates with PDF.js...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allTextBlocks: Array<{
      page: number;
      coords: [number, number, number, number];
      text: string;
      fontSize?: number;
      fontName?: string;
    }> = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items by lines and extract coordinates
      const textItems = textContent.items as any[];
      for (const item of textItems) {
        if (item.str && item.str.trim()) {
          allTextBlocks.push({
            page: pageNum - 1, // 0-based indexing
            coords: [item.transform[4], item.transform[5], item.transform[4] + item.width, item.transform[5] + item.height],
            text: item.str.trim(),
            fontSize: item.transform[0],
            fontName: item.fontName
          });
        }
      }
    }

    console.log(`📝 Extracted ${allTextBlocks.length} text blocks`);

    // Step 2: Create enhanced Gemini prompt
    const extractedText = allTextBlocks.map(block => block.text).join('\n');
    
    const analysisPrompt = `
Du bist ein Experte für die Analyse von Formulardokumenten, speziell für Schweizer Behördenformulare.

Analysiere den folgenden Text, der aus einem PDF extrahiert wurde. Identifiziere alle Eingabefelder wie Textfelder, Checkboxen und Optionsfelder. Ignoriere reinen Text oder Anweisungen.

Deine Antwort MUSS ausschliesslich ein JSON-Objekt sein, ohne Markdown-Formatierung wie \`\`\`json.

Schema:
{
  "formLanguage": "de|fr|it|rm",
  "formTitle": "string (Titel des Formulars)",
  "fields": [
    {
      "fieldName": "string (einzigartiger technischer Name in camelCase)",
      "originalLabel": "string (das genaue Label aus dem Text)",
      "translatedLabel": "string (die englische Übersetzung des Labels)",
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
- Erkenne Schweizer Formularmuster (Anmeldung, Personalien, Adresse, etc.)
- Für Checkboxen: identifiziere ☐ oder [ ] Symbole
- Für Radio-Buttons: identifiziere ○ oder ( ) Symbole
- Für Dropdowns: identifiziere Listen oder Auswahlmöglichkeiten
- Übersetze alle Labels ins Englische
- Verwende camelCase für fieldName (z.B. "firstName", "birthDate")

Hier ist der extrahierte Text:
---
${extractedText}
---
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

      // Step 3: Parse Gemini response
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

      // Step 4: Map coordinates to fields
      console.log('🗺️ Mapping coordinates to form fields...');
      const processedFields = formAnalysis.fields.map((field: any) => {
        // Find the text block that contains this field's label
        const matchingBlock = allTextBlocks.find(block => 
          block.text.includes(field.originalLabel) || 
          field.originalLabel.includes(block.text)
        );

        if (matchingBlock) {
          // Heuristic: Input field is typically to the right of the label
          const labelCoords = matchingBlock.coords;
          field.page = matchingBlock.page;
          field.inputCoords = {
            x: labelCoords[2] + 10, // 10 pixels right of label end
            y: labelCoords[1] - 2   // Slightly above label baseline
          };
          field.coordinateMatched = true;
        } else {
          field.coordinateMatched = false;
          console.warn(`⚠️ Could not find coordinates for field: ${field.originalLabel}`);
        }

        return {
          id: field.fieldName,
          originalName: field.originalLabel,
          englishLabel: field.translatedLabel,
          tooltip: `Original: ${field.originalLabel}`,
          type: field.fieldType,
          required: field.required || false,
          validation: field.validation || 'text',
          options: field.options || [],
          page: field.page || 0,
          inputCoords: field.inputCoords,
          coordinateMatched: field.coordinateMatched,
          geminiMatched: true
        };
      });

      console.log(`✅ Processed ${processedFields.length} fields with coordinate mapping`);

      return NextResponse.json({
        success: true,
        data: {
          id: `temp_${Date.now()}`,
          language: formAnalysis.formLanguage,
          languageName: getLanguageName(formAnalysis.formLanguage),
          formTitle: formAnalysis.formTitle,
          fields: processedFields,
          totalFields: processedFields.length,
          geminiMatchedFields: processedFields.filter((f: any) => f.geminiMatched).length,
          coordinateMatchedFields: processedFields.filter((f: any) => f.coordinateMatched).length,
          pdfData: base64,
          textBlocks: allTextBlocks // Include for debugging
        }
      });

    } catch (geminiError) {
      console.error('❌ Gemini AI error:', geminiError);
      return NextResponse.json({
        success: false,
        error: `Gemini AI analysis failed: ${geminiError instanceof Error ? geminiError.message : String(geminiError)}`,
        details: geminiError instanceof Error ? geminiError.message : String(geminiError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing PDF form:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({
      success: false,
      error: `Error processing PDF form: ${error instanceof Error ? error.message : String(error)}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
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
