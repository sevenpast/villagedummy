import { NextRequest, NextResponse } from 'next/server';
import { enhancedOCRService } from '../../../../services/enhanced-ocr-service';
import { enhancedGeminiAnalysisService } from '../../../../services/enhanced-gemini-analysis-service';
import { directAnalysisService } from '../../../../services/direct-analysis-service';

export async function POST(request: NextRequest) {
  console.error('DEPRECATED ROUTE HIT: The /api/documents/enhanced-hybrid-analysis route is deprecated and should not be used. Please update the frontend to use /api/v2/analyze-document.');
  let file: File | null = null;
  
  try {
    console.log('🚀 Starting ENHANCED hybrid OCR + AI document analysis...');

    const formData = await request.formData();
    file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const analysisMethod = formData.get('method') as string || 'auto'; // auto, simple, confidence, structured, direct

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
      case 'direct':
        console.log('🚀 Using Method 0: Direct single-call analysis');
        analysisResult = await performDirectAnalysis(file, imageBuffer);
        break;
      case 'simple':
        console.log('📝 Using Method 1: Simple text analysis (now fixed)');
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
 * Method 0: Direct single-call analysis (NEW & RECOMMENDED)
 */
async function performDirectAnalysis(file: File, imageBuffer: Buffer) {
  return await directAnalysisService.analyzeDocument(imageBuffer, file.name);
}

/**
 * Method 1: Simple text analysis (FIXED - now uses direct analysis)
 */
async function performSimpleAnalysis(file: File, imageBuffer: Buffer) {
  console.log('-> Simple method now redirects to direct analysis for robustness.');
  return await performDirectAnalysis(file, imageBuffer);
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
  console.log('🤖 Auto method: Trying all analysis methods, starting with the most efficient...');
  
  const results = [];

  // 1. Try the new, efficient direct method first
  try {
    console.log('🚀 Trying Method 0: Direct...');
    const directResult = await performDirectAnalysis(file, imageBuffer);
    // If confidence is high, we can even return immediately
    if (directResult.confidence > 0.85) {
      console.log('🏆 High confidence result from Direct method. Returning immediately.');
      return directResult;
    }
    results.push({ method: 'direct', result: directResult, score: directResult.confidence });
  } catch (error) {
    console.log('⚠️ Method 0 (Direct) failed:', error);
  }
  
  // 2. Fallback to confidence-aware if direct method fails or has low confidence
  try {
    console.log('🎯 Trying Method 2: Confidence-aware...');
    const confidenceResult = await performConfidenceAnalysis(file, imageBuffer);
    results.push({ method: 'confidence', result: confidenceResult, score: confidenceResult.confidence });
  } catch (error) {
    console.log('⚠️ Method 2 failed:', error);
  }
  
  // 3. Fallback to structured analysis for very complex cases
  try {
    console.log('🏗️ Trying Method 3: Structured...');
    const structuredResult = await performStructuredAnalysis(file, imageBuffer);
    results.push({ method: 'structured', result: structuredResult, score: structuredResult.confidence });
  } catch (error) {
    console.log('⚠️ Method 3 failed:', error);
  }
  
  if (results.length === 0) {
    throw new Error('All analysis methods failed');
  }
  
  // Pick the result with highest confidence from all attempts
  const bestResult = results.reduce((best, current) => 
    (current.score > best.score) ? current : best
  );
  
  console.log(`🏆 Best result after all attempts: Method ${bestResult.method} with confidence ${bestResult.score}`);
  
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