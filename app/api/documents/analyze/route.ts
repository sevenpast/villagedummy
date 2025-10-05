import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF, JPG, and PNG files are supported.' }, { status: 400 });
    }

    console.log(`🔍 Analyzing document: ${file.name} (${file.type})`);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    // Create the prompt for document classification
    const prompt = `Analyze this document and identify what type of document it is. 

Please respond with a JSON object containing:
1. "documentType": The primary document type (e.g., "passport", "driver_license", "birth_certificate", "contract", "invoice", "receipt", "medical_record", "school_document", "employment_contract", "insurance_document", "bank_statement", "utility_bill", "other")
2. "tags": An array of relevant tags that describe the document (e.g., ["official", "government", "identity", "travel", "personal"])
3. "confidence": A number between 0 and 1 indicating how confident you are in the classification
4. "description": A brief description of what you see in the document

Focus on identifying official documents, personal documents, and business documents. Be specific about the document type.

Respond ONLY with valid JSON, no additional text or explanations.`;

    try {
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

      // Clean and parse the JSON response
      let cleanedText = text.trim();
      
      // Remove markdown formatting if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }

      // Try to parse the JSON
      let analysisResult;
      try {
        analysisResult = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', text);
        
        // Fallback: try to extract JSON from the response
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysisResult = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            throw new Error('Could not parse AI response as JSON');
          }
        } else {
          throw new Error('No JSON found in AI response');
        }
      }

      // Validate the response structure
      if (!analysisResult.documentType) {
        analysisResult.documentType = 'other';
      }
      if (!analysisResult.tags || !Array.isArray(analysisResult.tags)) {
        analysisResult.tags = ['document'];
      }
      if (typeof analysisResult.confidence !== 'number') {
        analysisResult.confidence = 0.5;
      }
      if (!analysisResult.description) {
        analysisResult.description = 'Document uploaded to vault';
      }

      console.log(`✅ Document analyzed: ${file.name} -> ${analysisResult.documentType}`);

      // Return the analysis result with file data for saving
      return NextResponse.json({
        success: true,
        documentType: analysisResult.documentType,
        tags: analysisResult.tags,
        confidence: analysisResult.confidence,
        description: analysisResult.description,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: base64 // Include file data for saving to database
      });

    } catch (aiError) {
      console.error('Gemini API error:', aiError);
      
      // Fallback response for when AI fails
      return NextResponse.json({
        success: true,
        documentType: 'other',
        tags: ['document', 'uploaded'],
        confidence: 0.1,
        description: 'Document uploaded but could not be automatically classified',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: base64 // Include file data for saving to database
      });
    }

  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze document'
    }, { status: 500 });
  }
}
