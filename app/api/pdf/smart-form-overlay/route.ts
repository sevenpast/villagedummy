import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 PDF Smart Form Overlay API called');
    
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

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Step 1: Analyze PDF with Gemini to detect language and extract form fields
    const analysisPrompt = `
You are a Swiss form analysis expert. Analyze this PDF form and provide detailed information about it.

Please analyze:
1. Detect the language of the form (DE/German, FR/French, IT/Italian, RM/Romansh)
2. Extract ALL form fields (text inputs, checkboxes, dropdowns, radio buttons)
3. For each field, provide:
   - Original field name/label in the detected language
   - Field type (text, checkbox, dropdown, radio)
   - English translation of the field label
   - Tooltip text showing original label
   - Whether it's required or optional
   - Any validation rules or format hints

Format your response as JSON:
{
  "language": "DE",
  "languageName": "German",
  "formTitle": "School Registration Form",
  "fields": [
    {
      "originalName": "Familienname des Kindes",
      "englishLabel": "Child's Family Name",
      "tooltip": "Original: Familienname des Kindes",
      "type": "text",
      "required": true,
      "validation": "text",
      "fieldId": "field_1"
    }
  ]
}

Focus on Swiss school registration forms and common Swiss form patterns.
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
    } catch (geminiError) {
      console.error('❌ Gemini AI error:', geminiError);
      return NextResponse.json({
        success: false,
        error: `Gemini AI analysis failed: ${geminiError.message}`,
        details: geminiError.message
      }, { status: 500 });
    }

    // Parse analysis response
    let formAnalysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        formAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in analysis response');
      }
    } catch (parseError) {
      console.error('Failed to parse analysis response:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to analyze PDF form',
        rawResponse: analysisText
      }, { status: 500 });
    }

    // Step 2: Load PDF with pdf-lib to get actual form fields
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`📋 Found ${fields.length} form fields in PDF`);

    // Step 3: Match Gemini analysis with actual PDF fields
    const processedFields = fields.map((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      // Try to match with Gemini analysis
      const analysisField = formAnalysis.fields?.find((f: any) => 
        f.originalName?.toLowerCase().includes(fieldName.toLowerCase()) ||
        fieldName.toLowerCase().includes(f.originalName?.toLowerCase())
      );

      return {
        id: fieldName,
        originalName: fieldName,
        englishLabel: analysisField?.englishLabel || `Field ${index + 1}`,
        tooltip: analysisField?.tooltip || `Original: ${fieldName}`,
        type: getFieldType(fieldType),
        required: analysisField?.required || false,
        validation: analysisField?.validation || 'text',
        geminiMatched: !!analysisField
      };
    });

    // Step 4: Save form analysis to database for later use (optional)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('form_analyses')
          .insert({
            user_id: userId,
            original_filename: file.name,
            language: formAnalysis.language,
            language_name: formAnalysis.languageName,
            form_title: formAnalysis.formTitle,
            fields: processedFields,
            pdf_data: base64,
            created_at: new Date().toISOString()
          });
        
        console.log('✅ Form analysis saved to database');
      } catch (dbError) {
        console.warn('⚠️ Could not save to database (table may not exist):', dbError);
        // Continue without database save - not critical for functionality
      }
    } else {
      console.warn('⚠️ Supabase not configured - skipping database save');
    }

    console.log(`✅ Processed form with ${processedFields.length} fields in ${formAnalysis.languageName}`);

    return NextResponse.json({
      success: true,
      data: {
        id: `temp_${Date.now()}`, // Temporary ID for forms without database
        language: formAnalysis.language,
        languageName: formAnalysis.languageName,
        formTitle: formAnalysis.formTitle,
        fields: processedFields,
        totalFields: processedFields.length,
        geminiMatchedFields: processedFields.filter(f => f.geminiMatched).length,
        pdfData: base64 // Include PDF data for immediate use
      }
    });

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

function getFieldType(pdfLibType: string): string {
  switch (pdfLibType) {
    case 'PDFTextField':
      return 'text';
    case 'PDFCheckBox':
      return 'checkbox';
    case 'PDFDropdown':
      return 'dropdown';
    case 'PDFRadioGroup':
      return 'radio';
    default:
      return 'text';
  }
}
