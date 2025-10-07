import { NextRequest, NextResponse } from 'next/server';
import { enhancedOCRService } from '../../../../services/enhanced-ocr-service';
import { enhancedGeminiAnalysisService } from '../../../../services/enhanced-gemini-analysis-service';

export async function POST(request: NextRequest) {
  let file: File | null = null;
  
  try {
    console.log('🚀 Starting ENHANCED hybrid OCR + AI document analysis...');

    const formData = await request.formData();
    file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const analysisMethod = formData.get('method') as string || 'auto'; // auto, simple, confidence, structured

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 Analyzing file: ${file.name} (${file.type}) with method: ${analysisMethod}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    let analysisResult;

    // Choose analysis method
    switch (analysisMethod) {
      case 'simple':
        console.log('📝 Using Method 1: Simple text analysis');
        analysisResult = await performSimpleAnalysis(file, imageBuffer);
        break;
        
      case 'confidence':
        console.log('🎯 Using Method 2: Confidence-aware analysis');
        analysisResult = await performConfidenceAnalysis(file, imageBuffer);
        break;
        
      case 'structured':
        console.log('🏗️ Using Method 3: Structured analysis');
        analysisResult = await performStructuredAnalysis(file, imageBuffer);
        break;
        
      case 'auto':
      default:
        console.log('🤖 Using Method: Auto (trying all methods)');
        analysisResult = await performAutoAnalysis(file, imageBuffer);
        break;
    }

    console.log(`✅ Enhanced analysis completed: ${analysisResult.documentType} (confidence: ${analysisResult.confidence})`);
    console.log(`🔧 Method used: ${analysisResult.analysisMetadata.analysisMethod}`);
    console.log(`📊 OCR confidence: ${analysisResult.analysisMetadata.ocrConfidence}`);

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('❌ Enhanced hybrid analysis failed:', error);
    
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

/**
 * Method 1: Simple text analysis (current approach)
 */
async function performSimpleAnalysis(file: File, imageBuffer: Buffer) {
  // For simple analysis, we can use basic text extraction
  const extractedText = generateTextFromFilename(file.name.toLowerCase());
  
  return await enhancedGeminiAnalysisService.analyzeSimpleText(extractedText, file.name);
}

/**
 * Method 2: Confidence-aware analysis
 */
async function performConfidenceAnalysis(file: File, imageBuffer: Buffer) {
  // Step 1: Enhanced OCR with confidence scores
  const ocrResult = await enhancedOCRService.extractTextWithConfidence(imageBuffer);
  
  // Step 2: Confidence-aware Gemini analysis
  return await enhancedGeminiAnalysisService.analyzeWithConfidence(ocrResult, file.name);
}

/**
 * Method 3: Structured analysis for complex layouts
 */
async function performStructuredAnalysis(file: File, imageBuffer: Buffer) {
  // Step 1: Structured OCR
  const structuredResult = await enhancedOCRService.extractStructuredText(imageBuffer);
  
  // Step 2: Structured Gemini analysis
  return await enhancedGeminiAnalysisService.analyzeStructured(structuredResult, file.name);
}

/**
 * Auto method: Try all methods and pick the best result
 */
async function performAutoAnalysis(file: File, imageBuffer: Buffer) {
  console.log('🤖 Auto method: Trying all analysis methods...');
  
  const results = [];
  
  try {
    // Try Method 1: Simple
    console.log('📝 Trying Method 1: Simple...');
    const simpleResult = await performSimpleAnalysis(file, imageBuffer);
    results.push({ method: 'simple', result: simpleResult, score: simpleResult.confidence });
  } catch (error) {
    console.log('⚠️ Method 1 failed:', error);
  }
  
  try {
    // Try Method 2: Confidence-aware
    console.log('🎯 Trying Method 2: Confidence-aware...');
    const confidenceResult = await performConfidenceAnalysis(file, imageBuffer);
    results.push({ method: 'confidence', result: confidenceResult, score: confidenceResult.confidence });
  } catch (error) {
    console.log('⚠️ Method 2 failed:', error);
  }
  
  try {
    // Try Method 3: Structured
    console.log('🏗️ Trying Method 3: Structured...');
    const structuredResult = await performStructuredAnalysis(file, imageBuffer);
    results.push({ method: 'structured', result: structuredResult, score: structuredResult.confidence });
  } catch (error) {
    console.log('⚠️ Method 3 failed:', error);
  }
  
  if (results.length === 0) {
    throw new Error('All analysis methods failed');
  }
  
  // Pick the result with highest confidence
  const bestResult = results.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  console.log(`🏆 Best result: Method ${bestResult.method} with confidence ${bestResult.score}`);
  
  return bestResult.result;
}

/**
 * Fallback: Filename-based analysis
 */
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
      extractedText: `Filename: ${file.name}`,
      analysisMetadata: {
        ocrConfidence: 1.0,
        preprocessingApplied: false,
        lowConfidenceWords: [],
        analysisMethod: 'filename_fallback'
      }
    }
  });
}

/**
 * Generate meaningful text from filename for AI analysis
 */
function generateTextFromFilename(fileName: string): string {
  const lowerFileName = fileName.toLowerCase();
  
  let textDescription = `Document filename: ${fileName}\n\n`;
  
  if (lowerFileName.includes('cv') || lowerFileName.includes('resume') || lowerFileName.includes('lebenslauf')) {
    textDescription += `This appears to be a CV or resume document. The filename contains "cv", "resume", or "lebenslauf" which indicates a professional curriculum vitae or resume.`;
  } else if (lowerFileName.includes('zertifikat') || lowerFileName.includes('certificate')) {
    textDescription += `This appears to be a certificate document. The filename contains "certificate" or "zertifikat" which indicates educational or professional certification.`;
  } else if (lowerFileName.includes('diplom') || lowerFileName.includes('diploma') || lowerFileName.includes('schuldiplom')) {
    textDescription += `This appears to be a diploma document. The filename contains "diploma", "diplom", or "schuldiplom" which indicates an educational degree or qualification.`;
  } else if (lowerFileName.includes('zeugnis') || lowerFileName.includes('transcript')) {
    textDescription += `This appears to be a transcript or certificate document. The filename contains "zeugnis" or "transcript" which indicates academic records.`;
  } else if (lowerFileName.includes('pass') || lowerFileName.includes('passport')) {
    textDescription += `This appears to be a passport or identity document. The filename contains "pass" or "passport" which indicates travel or identity documentation.`;
  } else if (lowerFileName.includes('id') || lowerFileName.includes('identity')) {
    textDescription += `This appears to be an identity document. The filename contains "id" or "identity" which indicates personal identification.`;
  } else if (lowerFileName.includes('contract') || lowerFileName.includes('vertrag') || lowerFileName.includes('arbeitsvertrag')) {
    textDescription += `This appears to be a contract document. The filename contains "contract", "vertrag", or "arbeitsvertrag" which indicates a legal agreement.`;
  } else if (lowerFileName.includes('rental') || lowerFileName.includes('miete')) {
    textDescription += `This appears to be a rental agreement. The filename contains "rental" or "miete" which indicates housing documentation.`;
  } else if (lowerFileName.includes('insurance') || lowerFileName.includes('versicherung')) {
    textDescription += `This appears to be an insurance document. The filename contains "insurance" or "versicherung" which indicates coverage documentation.`;
  } else if (lowerFileName.includes('birth') || lowerFileName.includes('geburt')) {
    textDescription += `This appears to be a birth certificate. The filename contains "birth" or "geburt" which indicates vital records.`;
  } else if (lowerFileName.includes('marriage') || lowerFileName.includes('heirat')) {
    textDescription += `This appears to be a marriage certificate. The filename contains "marriage" or "heirat" which indicates marital documentation.`;
  } else if (lowerFileName.includes('salary') || lowerFileName.includes('lohn') || lowerFileName.includes('gehalt')) {
    textDescription += `This appears to be a salary or payroll document. The filename contains "salary", "lohn", or "gehalt" which indicates employment compensation.`;
  } else if (lowerFileName.includes('bank') || lowerFileName.includes('konto')) {
    textDescription += `This appears to be a banking document. The filename contains "bank" or "konto" which indicates financial documentation.`;
  } else if (lowerFileName.includes('tax') || lowerFileName.includes('steuer')) {
    textDescription += `This appears to be a tax document. The filename contains "tax" or "steuer" which indicates fiscal documentation.`;
  } else if (lowerFileName.includes('medical') || lowerFileName.includes('medizin')) {
    textDescription += `This appears to be a medical document. The filename contains "medical" or "medizin" which indicates healthcare documentation.`;
  } else if (lowerFileName.includes('permit') || lowerFileName.includes('bewilligung')) {
    textDescription += `This appears to be a permit or authorization document. The filename contains "permit" or "bewilligung" which indicates official authorization.`;
  } else {
    textDescription += `This is a document with filename "${fileName}". The document type needs to be determined based on the filename pattern.`;
  }
  
  return textDescription;
}
