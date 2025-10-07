import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Intelligent document analysis API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`📄 Analyzing document: ${file.name}`);

    // Step 1: Extract text content based on file type
    let extractedText = '';
    
    if (file.type === 'application/pdf') {
      // For PDFs, use Gemini Vision API to extract text
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const pdfPrompt = `
**Rolle:** Du bist ein intelligenter OCR-Service für PDF-Dokumente. Extrahiere den gesamten Text aus diesem PDF-Dokument.

**Aufgabe:** Lies den gesamten Text aus dem PDF und gib ihn als reinen Text zurück. Behalte die Struktur bei, aber entferne alle Formatierungen.

**Wichtig:** Gib nur den extrahierten Text zurück, keine Erklärungen oder Kommentare.
      `;

      const pdfResult = await model.generateContent([
        pdfPrompt,
        {
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        }
      ]);

      extractedText = pdfResult.response.text();
      console.log(`📝 Extracted ${extractedText.length} characters from PDF via Gemini Vision`);
    } else if (file.type.startsWith('image/')) {
      // For images, we'll use Gemini Vision API
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const visionPrompt = `
**Rolle:** Du bist ein intelligenter OCR-Service. Extrahiere den gesamten Text aus diesem Bild/Dokument.

**Aufgabe:** Lies den gesamten Text aus dem Bild und gib ihn als reinen Text zurück. Behalte die Struktur bei, aber entferne alle Formatierungen.

**Wichtig:** Gib nur den extrahierten Text zurück, keine Erklärungen oder Kommentare.
      `;

      const visionResult = await model.generateContent([
        visionPrompt,
        {
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        }
      ]);

      extractedText = visionResult.response.text();
      console.log(`📝 Extracted ${extractedText.length} characters from image via OCR`);
    } else {
      // For other file types, try to read as text
      extractedText = await file.text();
      console.log(`📝 Extracted ${extractedText.length} characters from text file`);
    }

    if (!extractedText || extractedText.trim().length < 10) {
      console.log('⚠️ No meaningful text extracted, using filename-based detection');
      return await fallbackAnalysis(file.name);
    }

    // Step 2: Analyze with Gemini using comprehensive prompt
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const analysisPrompt = `
**Rolle:** Du bist ein intelligenter Dokumentenanalyse- und Kategorisierungs-Service in einer SaaS-Anwendung für Schweizer Expats. Deine Aufgabe ist es, den Inhalt von hochgeladenen Dokumenten zu verstehen und sie präzise zu verschlagworten.

**Kontext:** Ein Nutzer hat das folgende Dokument hochgeladen. Ich stelle dir den extrahierten Textinhalt zur Verfügung.

**Aufgabe:**
1. Analysiere den Text und identifiziere die Art des Dokuments. Fasse deine Erkenntnis in einem kurzen, präzisen Satz zusammen.
2. Wähle aus der untenstehenden Liste den am besten passenden Tag für dieses Dokument aus. Gib nur einen einzigen Tag zurück.
3. Bestimme die Wahrscheinlichkeit (Confidence) der Erkennung (0.0 bis 1.0).
4. Gib deine Antwort ausschliesslich im JSON-Format zurück.

**Vordefinierte Tag-Liste:**
- Arbeitsvertrag (Employment Contract)
- Mietvertrag (Rental Contract)
- Diplome & Zertifikate (Education Certificates)
- Reisepass/ID (Passport/ID)
- Lohnabrechnung (Payroll)
- Rechnungen (Invoices)
- Versicherungsunterlagen (Insurance Documents)
- Geburtsurkunde (Birth Certificate)
- Heiratsurkunde (Marriage Certificate)
- Aufenthaltsbewilligung (Residence Permit)
- Bankdokumente (Bank Documents)
- Steuerdokumente (Tax Documents)
- Medizinische Dokumente (Medical Documents)
- Unbekanntes Dokument (Unknown Document)

**Extrahierter Textinhalt:**
---
${extractedText.substring(0, 4000)}${extractedText.length > 4000 ? '...' : ''}
---

**Gewünschtes JSON-Format:**
{
  "document_type_description": "Eine kurze, präzise Beschreibung des Dokumenteninhalts.",
  "suggested_tag": "Der am besten passende Tag aus der vordefinierten Liste.",
  "confidence": 0.95,
  "extracted_keywords": ["keyword1", "keyword2", "keyword3"],
  "language_detected": "DE/FR/IT/EN",
  "is_swiss_document": true/false
}
`;

    const result = await model.generateContent(analysisPrompt);
    const responseText = result.response.text();
    
    console.log('🤖 Gemini raw response:', responseText);

    // Step 3: Parse the JSON response
    let analysisResult;
    try {
      // Clean the response to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      return await fallbackAnalysis(file.name);
    }

    // Step 4: Validate and enhance the result
    const finalResult = {
      documentType: analysisResult.suggested_tag || 'Unbekanntes Dokument',
      description: analysisResult.document_type_description || 'Dokument konnte nicht analysiert werden',
      confidence: Math.min(Math.max(analysisResult.confidence || 0.5, 0.0), 1.0),
      tags: analysisResult.extracted_keywords || [],
      language: analysisResult.language_detected || 'DE',
      isSwissDocument: analysisResult.is_swiss_document || false,
      extractedText: extractedText.substring(0, 1000) // Store first 1000 chars for reference
    };

    console.log(`✅ Document analysis completed: ${finalResult.documentType} (confidence: ${finalResult.confidence})`);

    return NextResponse.json({
      success: true,
      analysis: finalResult
    });

  } catch (error) {
    console.error('❌ Intelligent document analysis failed:', error);
    
    // Fallback to filename-based analysis
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (file) {
        return await fallbackAnalysis(file.name);
      }
    } catch (formError) {
      console.error('❌ Could not read form data for fallback:', formError);
    }
    
    return NextResponse.json({
      error: 'Document analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function fallbackAnalysis(fileName: string) {
  console.log('🔄 Using fallback filename-based analysis');
  
  const fileNameLower = fileName.toLowerCase();
  
  let documentType = 'Unbekanntes Dokument';
  let confidence = 0.3;
  let tags: string[] = [];
  
  // Enhanced filename-based detection
  if (fileNameLower.includes('passport') || fileNameLower.includes('pass') || fileNameLower.includes('reisepass')) {
    documentType = 'Reisepass/ID';
    confidence = 0.8;
    tags = ['passport', 'identity', 'travel'];
  } else if (fileNameLower.includes('id') || fileNameLower.includes('identity') || fileNameLower.includes('ausweis')) {
    documentType = 'Reisepass/ID';
    confidence = 0.8;
    tags = ['id', 'identity'];
  } else if (fileNameLower.includes('diploma') || fileNameLower.includes('degree') || fileNameLower.includes('zeugnis') || fileNameLower.includes('zertifikat')) {
    documentType = 'Diplome & Zertifikate';
    confidence = 0.8;
    tags = ['education', 'certificate', 'diploma'];
  } else if (fileNameLower.includes('contract') || fileNameLower.includes('employment') || fileNameLower.includes('arbeitsvertrag')) {
    documentType = 'Arbeitsvertrag';
    confidence = 0.8;
    tags = ['employment', 'contract', 'work'];
  } else if (fileNameLower.includes('rental') || fileNameLower.includes('miete') || fileNameLower.includes('wohnung')) {
    documentType = 'Mietvertrag';
    confidence = 0.8;
    tags = ['rental', 'housing', 'contract'];
  } else if (fileNameLower.includes('birth') || fileNameLower.includes('geburt') || fileNameLower.includes('geburtsurkunde')) {
    documentType = 'Geburtsurkunde';
    confidence = 0.8;
    tags = ['birth', 'certificate', 'personal'];
  } else if (fileNameLower.includes('marriage') || fileNameLower.includes('heirat') || fileNameLower.includes('heiratsurkunde')) {
    documentType = 'Heiratsurkunde';
    confidence = 0.8;
    tags = ['marriage', 'certificate', 'personal'];
  } else if (fileNameLower.includes('insurance') || fileNameLower.includes('versicherung')) {
    documentType = 'Versicherungsunterlagen';
    confidence = 0.8;
    tags = ['insurance', 'health', 'coverage'];
  } else if (fileNameLower.includes('salary') || fileNameLower.includes('lohn') || fileNameLower.includes('gehalt')) {
    documentType = 'Lohnabrechnung';
    confidence = 0.8;
    tags = ['payroll', 'salary', 'employment'];
  } else if (fileNameLower.includes('invoice') || fileNameLower.includes('rechnung') || fileNameLower.includes('bill')) {
    documentType = 'Rechnungen';
    confidence = 0.8;
    tags = ['invoice', 'billing', 'payment'];
  } else if (fileNameLower.includes('bank') || fileNameLower.includes('konto') || fileNameLower.includes('account')) {
    documentType = 'Bankdokumente';
    confidence = 0.8;
    tags = ['banking', 'financial', 'account'];
  } else if (fileNameLower.includes('tax') || fileNameLower.includes('steuer') || fileNameLower.includes('fiscal')) {
    documentType = 'Steuerdokumente';
    confidence = 0.8;
    tags = ['tax', 'fiscal', 'government'];
  } else if (fileNameLower.includes('medical') || fileNameLower.includes('medizin') || fileNameLower.includes('health')) {
    documentType = 'Medizinische Dokumente';
    confidence = 0.8;
    tags = ['medical', 'health', 'doctor'];
  } else if (fileNameLower.includes('permit') || fileNameLower.includes('bewilligung') || fileNameLower.includes('visa')) {
    documentType = 'Aufenthaltsbewilligung';
    confidence = 0.8;
    tags = ['residence', 'permit', 'immigration'];
  }

  return NextResponse.json({
    success: true,
    analysis: {
      documentType,
      description: `Dokument basierend auf Dateiname erkannt: ${fileName}`,
      confidence,
      tags,
      language: 'DE',
      isSwissDocument: true,
      extractedText: '',
      fallbackUsed: true
    }
  });
}
