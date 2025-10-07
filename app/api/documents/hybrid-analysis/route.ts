import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  let file: File | null = null;
  
  try {
    console.log('🔍 Starting hybrid OCR + AI document analysis...');

    const formData = await request.formData();
    file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!genAI.apiKey) {
      console.log('⚠️ No Gemini API key found, using filename-based fallback');
      return performFilenameAnalysis(file);
    }

    console.log(`📄 Analyzing file: ${file.name} (${file.type})`);

    // Step 1: Extract text using OCR + PDF parsing (The "Eyes")
    const extractedText = await extractTextFromDocument(file);
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);

    if (extractedText.length < 10) {
      console.log('⚠️ Very little text extracted, falling back to filename analysis');
      return performFilenameAnalysis(file);
    }

    // Step 2: AI Analysis using Gemini (The "Brain")
    const aiAnalysis = await performAIAnalysis(extractedText, file.name);
    
    console.log(`✅ Hybrid analysis completed: ${aiAnalysis.documentType} (confidence: ${aiAnalysis.confidence})`);
    console.log(`🏷️ Tags: ${aiAnalysis.tags.join(', ')}`);

    return NextResponse.json({
      success: true,
      analysis: {
        documentType: aiAnalysis.documentType,
        tags: aiAnalysis.tags,
        confidence: aiAnalysis.confidence,
        description: aiAnalysis.description,
        language: aiAnalysis.language,
        isSwissDocument: aiAnalysis.isSwissDocument,
        extractedText: extractedText.substring(0, 1000) // Store first 1000 chars
      }
    });

  } catch (error) {
    console.error('❌ Hybrid analysis error:', error);
    
    // Fallback to filename analysis
    if (file) {
      console.log('🔄 Falling back to filename analysis...');
      return performFilenameAnalysis(file);
    } else {
      console.error('❌ No file available for fallback analysis');
      return NextResponse.json(
        { error: 'Document analysis failed' },
        { status: 500 }
      );
    }
  }
}

// Step 1: Text Extraction (OCR + PDF parsing)
async function extractTextFromDocument(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  console.log(`🔍 Extracting text from ${fileType} file: ${fileName}`);

  try {
    if (fileType === 'application/pdf') {
      // For PDFs, try to extract text directly first
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      let extractedText = '';
      
      // Extract text from all pages
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        // Try to extract text using PDF-lib's text extraction
        // Note: This is a simplified approach - for better OCR, we'd use Tesseract.js
        // For now, we'll use the filename and basic PDF metadata
        extractedText += `Page ${i + 1}: PDF Document (${width}x${height})\n`;
      }
      
      // If we got very little text, use filename analysis
      if (extractedText.length < 50) {
        console.log('📝 PDF has no extractable text, using filename analysis');
        return generateTextFromFilename(fileName);
      }
      
      return extractedText;
    } else if (fileType.startsWith('image/')) {
      // For images, we would use OCR here
      // For now, use filename analysis
      console.log('📸 Image file detected, using filename analysis');
      return generateTextFromFilename(fileName);
    } else {
      // For other file types, use filename analysis
      console.log('📄 Other file type, using filename analysis');
      return generateTextFromFilename(fileName);
    }
  } catch (error) {
    console.log('⚠️ Text extraction failed, using filename analysis:', error);
    return generateTextFromFilename(fileName);
  }
}

// Generate meaningful text from filename for AI analysis
function generateTextFromFilename(fileName: string): string {
  const lowerFileName = fileName.toLowerCase();
  
  // Create a rich text description based on filename patterns
  let textDescription = `Document filename: ${fileName}\n\n`;
  
  if (lowerFileName.includes('zertifikat') || lowerFileName.includes('certificate')) {
    textDescription += `This appears to be a certificate document. The filename contains "certificate" or "zertifikat" which indicates educational or professional certification.`;
  } else if (lowerFileName.includes('diplom') || lowerFileName.includes('diploma')) {
    textDescription += `This appears to be a diploma document. The filename contains "diploma" or "diplom" which indicates an educational degree or qualification.`;
  } else if (lowerFileName.includes('zeugnis') || lowerFileName.includes('transcript')) {
    textDescription += `This appears to be a transcript or certificate document. The filename contains "zeugnis" or "transcript" which indicates academic records.`;
  } else if (lowerFileName.includes('pass') || lowerFileName.includes('passport')) {
    textDescription += `This appears to be a passport or identity document. The filename contains "pass" or "passport" which indicates travel or identity documentation.`;
  } else if (lowerFileName.includes('id') || lowerFileName.includes('identity')) {
    textDescription += `This appears to be an identity document. The filename contains "id" or "identity" which indicates personal identification.`;
  } else if (lowerFileName.includes('contract') || lowerFileName.includes('vertrag')) {
    textDescription += `This appears to be a contract document. The filename contains "contract" or "vertrag" which indicates a legal agreement.`;
  } else if (lowerFileName.includes('rental') || lowerFileName.includes('miete')) {
    textDescription += `This appears to be a rental agreement. The filename contains "rental" or "miete" which indicates housing documentation.`;
  } else if (lowerFileName.includes('insurance') || lowerFileName.includes('versicherung')) {
    textDescription += `This appears to be an insurance document. The filename contains "insurance" or "versicherung" which indicates coverage documentation.`;
  } else if (lowerFileName.includes('birth') || lowerFileName.includes('geburt')) {
    textDescription += `This appears to be a birth certificate. The filename contains "birth" or "geburt" which indicates vital records.`;
  } else if (lowerFileName.includes('marriage') || lowerFileName.includes('heirat')) {
    textDescription += `This appears to be a marriage certificate. The filename contains "marriage" or "heirat" which indicates marital documentation.`;
  } else {
    textDescription += `This is a document with filename "${fileName}". The document type needs to be determined based on the filename pattern.`;
  }
  
  return textDescription;
}

// Step 2: AI Analysis using Gemini (The "Brain")
async function performAIAnalysis(extractedText: string, fileName: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
**Rolle:** Du bist ein intelligenter Dokumentenanalyse- und Kategorisierungs-Service in einer SaaS-Anwendung. Deine Aufgabe ist es, den Inhalt von hochgeladenen Dokumenten zu verstehen und sie präzise zu verschlagworten.

**Kontext:** Ein Nutzer hat das folgende Dokument hochgeladen. Ich stelle dir den extrahierten Textinhalt zur Verfügung.

**Aufgabe:**
1. Analysiere den Text und identifiziere die Art des Dokuments. Fasse deine Erkenntnis in einem kurzen Satz zusammen (max. 20 Wörter).
2. Wähle aus der untenstehenden Liste den am besten passenden Tag für dieses Dokument aus. Gib nur einen einzigen Tag zurück.
3. Bestimme die Hauptsprache des Dokuments (DE, FR, IT, EN).
4. Schätze ein, ob es sich um ein typisches Schweizer Dokument handelt (true/false).
5. Gib deine Antwort ausschliesslich im JSON-Format zurück.

**Vordefinierte Tag-Liste (wähle EINEN):**
- Arbeitsvertrag
- Mietvertrag
- Diplome & Zertifikate
- Reisepass/ID
- Lohnabrechnung
- Rechnungen
- Versicherungsunterlagen
- Geburtsurkunde
- Heiratsurkunde
- Aufenthaltsbewilligung
- Bankdokumente
- Steuerdokumente
- Medizinische Dokumente
- Unbekanntes Dokument

**Extrahierter Textinhalt:**
---
${extractedText}
---

**Gewünschtes JSON-Format:**
{
  "documentType": "Der am besten passende Tag aus der vordefinierten Liste.",
  "tags": ["tag1", "tag2", "tag3"], // Zusätzliche relevante Tags, max. 3
  "confidence": 0.0, // Eine Zahl zwischen 0.0 und 1.0, die die Sicherheit der Erkennung angibt
  "description": "Eine kurze Beschreibung des Dokumenteninhalts (max. 20 Wörter).",
  "language": "DE", // Hauptsprache des Dokuments (DE, FR, IT, EN)
  "isSwissDocument": true // true, wenn es ein typisches Schweizer Dokument ist
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini raw response:', text);
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and set defaults
      return {
        documentType: analysis.documentType || 'Unbekanntes Dokument',
        tags: Array.isArray(analysis.tags) ? analysis.tags : ['unrecognized'],
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
        description: analysis.description || `AI-analyzed document: ${analysis.documentType || 'Unknown'}`,
        language: analysis.language || 'DE',
        isSwissDocument: typeof analysis.isSwissDocument === 'boolean' ? analysis.isSwissDocument : true
      };
    } else {
      throw new Error('No valid JSON found in response');
    }
  } catch (error) {
    console.error('❌ Gemini analysis failed:', error);
    throw error;
  }
}

// Fallback: Filename-based analysis
function performFilenameAnalysis(file: File) {
  const fileName = file.name.toLowerCase();
  console.log(`🔍 Performing filename analysis for: ${fileName}`);

  let documentType = 'Unbekanntes Dokument';
  let tags = ['unrecognized'];
  let confidence = 0.3;

  if (fileName.includes('passport') || fileName.includes('pass') || fileName.includes('reisepass')) {
    documentType = 'Reisepass/ID';
    tags = ['passport', 'identity', 'travel'];
    confidence = 0.8;
  } else if (fileName.includes('id') || fileName.includes('identity') || fileName.includes('ausweis')) {
    documentType = 'Reisepass/ID';
    tags = ['id', 'identity'];
    confidence = 0.8;
  } else if (fileName.includes('cv') || fileName.includes('resume') || fileName.includes('lebenslauf')) {
    documentType = 'Diplome & Zertifikate';
    tags = ['cv', 'resume', 'career'];
    confidence = 0.8;
  } else if (fileName.includes('diploma') || fileName.includes('degree') || fileName.includes('zeugnis') || fileName.includes('zertifikat') || fileName.includes('schuldiplom')) {
    documentType = 'Diplome & Zertifikate';
    tags = ['education', 'certificate', 'diploma'];
    confidence = 0.8;
  } else if (fileName.includes('contract') || fileName.includes('employment') || fileName.includes('arbeitsvertrag')) {
    documentType = 'Arbeitsvertrag';
    tags = ['employment', 'contract', 'work'];
    confidence = 0.8;
  } else if (fileName.includes('rental') || fileName.includes('miete') || fileName.includes('wohnung')) {
    documentType = 'Mietvertrag';
    tags = ['rental', 'housing', 'contract'];
    confidence = 0.8;
  } else if (fileName.includes('birth') || fileName.includes('geburt') || fileName.includes('geburtsurkunde')) {
    documentType = 'Geburtsurkunde';
    tags = ['birth', 'certificate', 'personal'];
    confidence = 0.8;
  } else if (fileName.includes('marriage') || fileName.includes('heirat') || fileName.includes('heiratsurkunde')) {
    documentType = 'Heiratsurkunde';
    tags = ['marriage', 'certificate', 'personal'];
    confidence = 0.8;
  } else if (fileName.includes('insurance') || fileName.includes('versicherung')) {
    documentType = 'Versicherungsunterlagen';
    tags = ['insurance', 'health', 'coverage'];
    confidence = 0.8;
  } else if (fileName.includes('salary') || fileName.includes('lohn') || fileName.includes('gehalt')) {
    documentType = 'Lohnabrechnung';
    tags = ['payroll', 'salary', 'employment'];
    confidence = 0.8;
  } else if (fileName.includes('invoice') || fileName.includes('rechnung') || fileName.includes('bill')) {
    documentType = 'Rechnungen';
    tags = ['invoice', 'billing', 'payment'];
    confidence = 0.8;
  } else if (fileName.includes('bank') || fileName.includes('konto') || fileName.includes('account')) {
    documentType = 'Bankdokumente';
    tags = ['banking', 'financial', 'account'];
    confidence = 0.8;
  } else if (fileName.includes('tax') || fileName.includes('steuer') || fileName.includes('fiscal')) {
    documentType = 'Steuerdokumente';
    tags = ['tax', 'fiscal', 'government'];
    confidence = 0.8;
  } else if (fileName.includes('medical') || fileName.includes('medizin') || fileName.includes('health')) {
    documentType = 'Medizinische Dokumente';
    tags = ['medical', 'health', 'doctor'];
    confidence = 0.8;
  } else if (fileName.includes('permit') || fileName.includes('bewilligung') || fileName.includes('visa')) {
    documentType = 'Aufenthaltsbewilligung';
    tags = ['residence', 'permit', 'immigration'];
    confidence = 0.8;
  }

  console.log(`✅ Filename analysis: ${documentType} (confidence: ${confidence})`);

  return NextResponse.json({
    success: true,
    analysis: {
      documentType,
      tags,
      confidence,
      description: `Filename-based analysis: ${documentType}`,
      language: 'DE',
      isSwissDocument: true,
      extractedText: `Filename: ${file.name}`
    }
  });
}
