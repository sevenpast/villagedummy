import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '', {
  apiVersion: 'v1'
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`🔍 Analyzing document: ${fileName || file.name}`);

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'application/pdf';

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    // Create comprehensive prompt for document analysis
    const prompt = `
You are an expert document classifier for Swiss administrative and personal documents. 

Analyze this document and provide a detailed classification in the following JSON format:

{
  "documentType": "Primary document type (e.g., Passport, ID Card, Birth Certificate, etc.)",
  "documentCategory": "Category (Personal ID, Education, Employment, Health, Legal, Financial, Other)",
  "country": "Country of origin (CH for Switzerland, or other country codes)",
  "language": "Primary language (DE, FR, IT, EN, etc.)",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95,
  "description": "Brief description of what this document is",
  "isOfficial": true/false,
  "expiryDate": "YYYY-MM-DD or null if not applicable",
  "issuingAuthority": "Authority that issued this document"
}

IMPORTANT RULES:
1. Be very precise with document types - use exact Swiss document names when applicable
2. For Swiss documents, use German terms (e.g., "Reisepass", "Identitätskarte", "Geburtsurkunde")
3. For international documents, use English terms
4. Tags should be specific and useful for categorization
5. Confidence should be high (0.8+) for clear documents, lower for unclear/blurry ones
6. If you cannot determine the document type, use "Unknown Document" with low confidence
7. Consider the filename as additional context if the image is unclear

COMMON SWISS DOCUMENT TYPES:
- Reisepass (Passport)
- Identitätskarte (ID Card) 
- Geburtsurkunde (Birth Certificate)
- Heiratsurkunde (Marriage Certificate)
- Scheidungsurkunde (Divorce Certificate)
- Arbeitsvertrag (Employment Contract)
- Lohnabrechnung (Pay Slip)
- Steuererklärung (Tax Return)
- Krankenkassenkarte (Health Insurance Card)
- Führerschein (Driver's License)
- Diplome/Zeugnisse (Diplomas/Certificates)
- Mietvertrag (Rental Contract)
- Versicherungspolice (Insurance Policy)

COMMON INTERNATIONAL DOCUMENT TYPES:
- Passport
- National ID Card
- Birth Certificate
- Marriage Certificate
- Divorce Certificate
- Employment Contract
- Pay Slip
- Tax Return
- Health Insurance Card
- Driver's License
- Diploma/Certificate
- Rental Contract
- Insurance Policy

Analyze the document now and provide the JSON response.
`;

    // Generate content with the document
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

    console.log('🔍 Gemini analysis result:', text);

    // Try to parse JSON from response
    let analysisResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw response:', text);
      
      // Fallback analysis based on filename
      analysisResult = {
        documentType: "Unknown Document",
        documentCategory: "Other",
        country: "Unknown",
        language: "Unknown",
        tags: ["unrecognized"],
        confidence: 0.3,
        description: "Document could not be automatically analyzed",
        isOfficial: false,
        expiryDate: null,
        issuingAuthority: "Unknown"
      };
    }

    // Validate and clean the result
    const validatedResult = {
      documentType: analysisResult.documentType || "Unknown Document",
      documentCategory: analysisResult.documentCategory || "Other",
      country: analysisResult.country || "Unknown",
      language: analysisResult.language || "Unknown",
      tags: Array.isArray(analysisResult.tags) ? analysisResult.tags : ["unrecognized"],
      confidence: typeof analysisResult.confidence === 'number' ? analysisResult.confidence : 0.5,
      description: analysisResult.description || "Document analysis completed",
      isOfficial: Boolean(analysisResult.isOfficial),
      expiryDate: analysisResult.expiryDate || null,
      issuingAuthority: analysisResult.issuingAuthority || "Unknown"
    };

    console.log('✅ Document analysis completed:', validatedResult);

    return NextResponse.json({
      success: true,
      analysis: validatedResult
    });

  } catch (error) {
    console.error('❌ Document analysis failed:', error);
    
    // Fallback analysis based on filename
    const formData = await request.formData();
    const fileName = formData.get('fileName') as string || 'unknown';
    
    const fallbackAnalysis = {
      documentType: "Unknown Document",
      documentCategory: "Other", 
      country: "Unknown",
      language: "Unknown",
      tags: ["unrecognized", "analysis-failed"],
      confidence: 0.2,
      description: `Document analysis failed for ${fileName}`,
      isOfficial: false,
      expiryDate: null,
      issuingAuthority: "Unknown"
    };

    return NextResponse.json({
      success: false,
      error: 'Document analysis failed',
      analysis: fallbackAnalysis
    }, { status: 500 });
  }
}
