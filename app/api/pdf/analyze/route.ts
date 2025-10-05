import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Finds the JSON block in the AI response, extracts it, and parses it.
 * This version is more robust and tries to recover a valid JSON object
 * even if the response is incomplete.
 */
function cleanAndParseJson(aiResponseText: string): any | null {
  try {
    // First, remove markdown fences if they exist
    const cleanedText = aiResponseText.replace(/^```json\s*/, '').replace(/```$/, '');
    const startIndex = cleanedText.indexOf('{');
    if (startIndex === -1) {
      console.log("No JSON object start found in the response.");
      return null;
    }

    let jsonString = cleanedText.substring(startIndex);

    // Attempt to parse directly
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.log("Direct JSON parsing failed, attempting to recover incomplete JSON.");
      
      // Attempt to find the last valid closing brace or bracket
      let lastValidIndex = -1;
      let openBraces = 0;
      let openBrackets = 0;

      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;

        // Consider a point valid if braces and brackets are balanced
        if (openBraces === 0 && openBrackets === 0 && (char === '}' || char === ']')) {
             // Heuristic: look for a comma or end of object/array after the closing character
             const nextChar = jsonString.substring(i + 1).trim().charAt(0);
             if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === '') {
                lastValidIndex = i;
             }
        }
      }
      
      // If we found a potentially valid end point, try to parse up to there
      if (lastValidIndex !== -1) {
          try {
              let recoveredString = jsonString.substring(0, lastValidIndex + 1);
              // It's likely the incompleteness is in an array, let's close it.
              // This is a heuristic and might not always be correct.
              const openBracketCount = (recoveredString.match(/\[/g) || []).length;
              const closeBracketCount = (recoveredString.match(/\]/g) || []).length;
              if(openBracketCount > closeBracketCount){
                  recoveredString += ']';
              }
                // Also check for object braces
              const openBraceCount = (recoveredString.match(/\{/g) || []).length;
              const closeBraceCount = (recoveredString.match(/\}/g) || []).length;
              if(openBraceCount > closeBraceCount){
                  recoveredString += '}';
              }


              console.log("Attempting to parse recovered JSON string.");
              return JSON.parse(recoveredString);
          } catch (recoveryError) {
              console.error("Could not recover JSON even after truncation:", recoveryError);
              return null;
          }
      }

      console.error("Could not find any valid JSON structure to recover.");
      return null;
    }
  } catch (error) {
    console.error("An unexpected error occurred during JSON cleaning and parsing:", error);
    return null;
  }
}

async function analyzePdfPage(pdfBase64: string): Promise<any | null> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analysiere DIESE EINE PDF-SEITE. Gib deine Antwort ausschliesslich als ein einziges, valides JSON-Objekt zurück. Beginne deine Antwort direkt mit der öffnenden geschweiften Klammer \`{\` und beende sie mit der schliessenden geschweiften Klammer \`}\`. Füge keinerlei Erklärungen, Kommentare, Einleitungen oder Formatierungen wie Markdown \`\`\`json\`\`\` hinzu.
    Das Objekt soll zwei Schlüssel haben: 'translatedTexts' und 'formFields'.

    1. 'translatedTexts': Ein Array. Jedes Objekt enthält:
       - 'originalText': Der exakte deutsche Text.
       - 'translatedText': Die exakte englische Übersetzung.
       - 'coordinates': Ein Objekt mit 'x', 'y', 'width', 'height' relativ zu DIESER EINEN SEITE.

    2. 'formFields': Ein Array. Jedes Objekt repräsentiert ein ausfüllbares Feld und enthält:
       - 'label': Die exakte, sichtbare deutsche Beschriftung des Feldes.
       - 'translatedLabel': Die englische Übersetzung der Beschriftung.
       - 'key': Ein computerlesbarer Schlüssel in camelCase basierend auf der ENGLISCHEN Übersetzung (z.B. "firstName").
       - 'type': Der Feldtyp ('text', 'checkbox', 'radio', 'select', 'textarea').
       - 'coordinates': Ein Objekt mit 'x', 'y', 'width', 'height' für das Eingabefeld, relativ zu DIESER EINEN SEITE.
       - 'options': (Optional) Ein Array von Strings für 'radio' und 'select' Typen.`;

    try {
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: pdfBase64, mimeType: 'application/pdf' } }
        ]);
        const response = await result.response;
        const text = response.text();
        const parsedData = cleanAndParseJson(text);

        if (!parsedData) {
            console.error("Failed to parse Gemini response for a page:", text.substring(0, 500));
            await fs.writeFile(path.join(process.cwd(), `gemini_error_page_${Date.now()}.txt`), text);
        }
        return parsedData;
    } catch (error) {
        console.error("Error during Gemini page analysis:", error);
        return null;
    }
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No PDF file uploaded.' }, { status: 400 });
    }

    const pdfBytes = await file.arrayBuffer();
    const originalPdfDoc = await PDFDocument.load(pdfBytes);
    const numPages = originalPdfDoc.getPageCount();

    const combinedResults = {
      translatedTexts: [],
      formFields: [],
    };

    let totalHeightOffset = 0;

    for (let i = 0; i < numPages; i++) {
        console.log(`Analyzing page ${i + 1} of ${numPages}...`);
        
        // Create a new PDF with just the current page
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(originalPdfDoc, [i]);
        singlePagePdf.addPage(copiedPage);
        const singlePageBytes = await singlePagePdf.save();
        const singlePageBase64 = Buffer.from(singlePageBytes).toString('base64');
        
        const pageHeight = copiedPage.getHeight();

        // Analyze the single page
        const pageResult = await analyzePdfPage(singlePageBase64);

        if (pageResult) {
            // Adjust coordinates and combine results
            if(pageResult.translatedTexts) {
                pageResult.translatedTexts.forEach(item => {
                    item.coordinates.y += totalHeightOffset;
                    combinedResults.translatedTexts.push(item);
                });
            }
            if(pageResult.formFields) {
                pageResult.formFields.forEach(item => {
                    item.coordinates.y += totalHeightOffset;
                    combinedResults.formFields.push(item);
                });
            }
        } else {
             console.warn(`Could not analyze page ${i + 1}. Skipping.`);
        }
        
        totalHeightOffset += pageHeight;
    }
    
    if (combinedResults.formFields.length === 0 && combinedResults.translatedTexts.length === 0) {
        return NextResponse.json({ success: false, error: "Das Dokument konnte nicht automatisch analysiert werden. Es wurden keine Felder oder Texte erkannt." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: combinedResults });

  } catch (error) {
    console.error('Error in multi-page PDF analysis:', error);
    return NextResponse.json({ success: false, error: 'Internal server error during PDF analysis.' }, { status: 500 });
  }
}
