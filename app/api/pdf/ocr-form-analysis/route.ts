import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm } from 'pdf-lib';
import { createWorker } from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 OCR PDF Form Analysis API called');
    
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
      return NextResponse.json({
        success: false,
        error: 'Missing file or userId'
      }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({
        success: false,
        error: 'File must be a PDF'
      }, { status: 400 });
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Load PDF with pdf-lib
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
      fields = [];
    }

    // Step 1: Extract technical form fields
    const technicalFields = fields.map((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      return {
        name: fieldName,
        type: fieldType,
        index: index
      };
    });

    console.log('🔍 Technical fields found:', technicalFields);

    // Step 2: Use OCR to extract visible text and labels
    console.log('🔍 Starting OCR analysis...');
    const worker = await createWorker('deu+eng'); // German and English
    
    try {
      // Convert PDF to image for OCR (simplified approach)
      // In a real implementation, you'd convert PDF pages to images first
      const ocrResult = await worker.recognize(arrayBuffer);
      const ocrText = ocrResult.data.text;
      
      console.log('📝 OCR extracted text:', ocrText.substring(0, 200) + '...');
      
      // Step 3: Match technical fields with OCR text
      const enhancedFields = technicalFields.map((techField) => {
        const fieldName = techField.name;
        
        // Look for labels in OCR text that might match this field
        const possibleLabels = findPossibleLabels(ocrText, fieldName);
        
        // Map field types
        let type = 'text';
        if (techField.type === 'PDFCheckBox') {
          type = 'checkbox';
        } else if (techField.type === 'PDFRadioGroup') {
          type = 'radio';
        } else if (techField.type === 'PDFDropdown') {
          type = 'dropdown';
        }
        
        // Create enhanced field info
        const enhancedField = {
          id: fieldName,
          originalName: possibleLabels.original || fieldName,
          englishLabel: possibleLabels.english || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          tooltip: `Original: ${possibleLabels.original || fieldName}`,
          type: type,
          required: false,
          validation: 'text',
          options: [],
          geminiMatched: false,
          coordinateMatched: false,
          ocrMatched: possibleLabels.found
        };
        
        console.log(`🔍 Enhanced field ${fieldName}:`, {
          original: possibleLabels.original,
          english: possibleLabels.english,
          found: possibleLabels.found
        });
        
        return enhancedField;
      });
      
      await worker.terminate();
      
      console.log(`✅ Enhanced ${enhancedFields.length} fields with OCR data`);

      return NextResponse.json({
        success: true,
        data: {
          id: `temp_${Date.now()}`,
          language: 'DE',
          languageName: 'German',
          formTitle: 'PDF Form (OCR Enhanced)',
          fields: enhancedFields,
          totalFields: enhancedFields.length,
          geminiMatchedFields: 0,
          coordinateMatchedFields: 0,
          ocrMatchedFields: enhancedFields.filter(f => f.ocrMatched).length,
          pdfData: base64,
          ocrText: ocrText.substring(0, 500) // Include OCR text for debugging
        }
      });
      
    } catch (ocrError) {
      console.error('❌ OCR failed:', ocrError);
      await worker.terminate();
      
      // Fallback to basic field extraction
      const basicFields = technicalFields.map((techField) => {
        const fieldName = techField.name;
        let type = 'text';
        if (techField.type === 'PDFCheckBox') type = 'checkbox';
        else if (techField.type === 'PDFRadioGroup') type = 'radio';
        else if (techField.type === 'PDFDropdown') type = 'dropdown';
        
        return {
          id: fieldName,
          originalName: fieldName,
          englishLabel: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          tooltip: `Original: ${fieldName}`,
          type: type,
          required: false,
          validation: 'text',
          options: [],
          geminiMatched: false,
          coordinateMatched: false,
          ocrMatched: false
        };
      });
      
      return NextResponse.json({
        success: true,
        data: {
          id: `temp_${Date.now()}`,
          language: 'DE',
          languageName: 'German',
          formTitle: 'PDF Form (Basic)',
          fields: basicFields,
          totalFields: basicFields.length,
          geminiMatchedFields: 0,
          coordinateMatchedFields: 0,
          ocrMatchedFields: 0,
          pdfData: base64
        }
      });
    }

  } catch (error) {
    console.error('Error processing PDF form:', error);
    return NextResponse.json({
      success: false,
      error: `Error processing PDF form: ${error.message}`,
      details: error.message
    }, { status: 500 });
  }
}

function findPossibleLabels(ocrText: string, fieldName: string): { original: string; english: string; found: boolean } {
  // Common German form labels
  const labelMappings: Record<string, { original: string; english: string }> = {
    'firstName': { original: 'Vorname', english: 'First Name' },
    'familyName': { original: 'Familienname', english: 'Family Name' },
    'lastName': { original: 'Nachname', english: 'Last Name' },
    'birthDate': { original: 'Geburtsdatum', english: 'Birth Date' },
    'gender': { original: 'Geschlecht', english: 'Gender' },
    'address': { original: 'Adresse', english: 'Address' },
    'phone': { original: 'Telefon', english: 'Phone' },
    'email': { original: 'E-Mail', english: 'Email' },
    'hasChildren': { original: 'Hat Kinder', english: 'Has Children' }
  };
  
  // Check if we have a direct mapping
  if (labelMappings[fieldName]) {
    const mapping = labelMappings[fieldName];
    const found = ocrText.toLowerCase().includes(mapping.original.toLowerCase());
    return {
      original: mapping.original,
      english: mapping.english,
      found: found
    };
  }
  
  // Try to find the field name in OCR text
  const found = ocrText.toLowerCase().includes(fieldName.toLowerCase());
  
  return {
    original: fieldName,
    english: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    found: found
  };
}
