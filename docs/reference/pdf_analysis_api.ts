// app/api/pdf/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// CRITICAL: Configure PDF.js worker
if (typeof window === 'undefined') {
  // Server-side: Use worker from node_modules
  const pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.entry');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const taskId = formData.get('taskId') as string;
    const documentType = formData.get('documentType') as string;

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    // Step 1: Analyze with pdf-lib (for form fields)
    let isF illable = false;
    let detectedFields: any[] = [];
    let fieldCount = 0;

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      isF illable = fields.length > 0;
      fieldCount = fields.length;

      // Extract field information
      detectedFields = fields.map(field => {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;

        return {
          field_name: fieldName,
          field_type: mapFieldType(fieldType),
          default_value: getDefaultValue(field),
          required: false, // PDF doesn't always specify this
          auto_fillable: isAutoFillable(fieldName),
          mapped_to: mapToUserProfile(fieldName),
          confidence: calculateConfidence(fieldName)
        };
      });
    } catch (error) {
      console.error('pdf-lib analysis error:', error);
      // PDF might not be a form, continue with other analysis
    }

    // Step 2: Get page count with PDF.js
    let pageCount = 1;
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      pageCount = pdf.numPages;
    } catch (error) {
      console.error('PDF.js analysis error:', error);
    }

    // Step 3: Build response
    const analysisResult = {
      is_fillable: isF illable,
      form_type: detectFormType(detectedFields),
      detected_fields: detectedFields,
      field_count: fieldCount,
      page_count: pageCount,
      confidence_score: calculateOverallConfidence(detectedFields),
      language: detectLanguage(detectedFields)
    };

    return NextResponse.json({
      success: true,
      file_name: pdfFile.name,
      file_size: pdfFile.size,
      is_fillable: isF illable,
      analysis_result: analysisResult,
      task_id: taskId,
      document_type: documentType
    });

  } catch (error) {
    console.error('PDF analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper Functions

function mapFieldType(pdfLibType: string): string {
  const typeMap: Record<string, string> = {
    'PDFTextField': 'text',
    'PDFCheckBox': 'checkbox',
    'PDFRadioGroup': 'radio',
    'PDFDropdown': 'dropdown',
    'PDFOptionList': 'dropdown',
    'PDFButton': 'signature'
  };
  return typeMap[pdfLibType] || 'text';
}

function getDefaultValue(field: any): string | undefined {
  try {
    const type = field.constructor.name;
    
    if (type === 'PDFTextField') {
      return field.getText() || undefined;
    } else if (type === 'PDFCheckBox') {
      return field.isChecked() ? 'true' : 'false';
    } else if (type === 'PDFRadioGroup') {
      return field.getSelected() || undefined;
    } else if (type === 'PDFDropdown') {
      const selected = field.getSelected();
      return selected ? selected[0] : undefined;
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
}

function isAutoFillable(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  
  const autoFillablePatterns = [
    'name', 'vorname', 'nachname', 'first', 'last',
    'email', 'mail', 'e-mail',
    'phone', 'telefon', 'tel',
    'address', 'adresse', 'strasse', 'street',
    'city', 'stadt', 'ort',
    'zip', 'plz', 'postal',
    'birth', 'geburt', 'geboren',
    'nationality', 'nationalität', 'staatsangehörigkeit'
  ];

  return autoFillablePatterns.some(pattern => normalized.includes(pattern));
}

function mapToUserProfile(fieldName: string): string | undefined {
  const normalized = fieldName.toLowerCase();
  
  const mappings: Record<string, string> = {
    'vorname': 'first_name',
    'first': 'first_name',
    'name': 'last_name',
    'nachname': 'last_name',
    'last': 'last_name',
    'surname': 'last_name',
    'email': 'email',
    'mail': 'email',
    'e-mail': 'email',
    'phone': 'phone',
    'telefon': 'phone',
    'tel': 'phone',
    'address': 'current_address',
    'adresse': 'current_address',
    'strasse': 'current_address',
    'street': 'current_address',
    'city': 'municipality',
    'stadt': 'municipality',
    'ort': 'municipality',
    'zip': 'postal_code',
    'plz': 'postal_code',
    'postal': 'postal_code',
    'birth': 'date_of_birth',
    'geburt': 'date_of_birth',
    'geboren': 'date_of_birth',
    'nationality': 'country_of_origin',
    'nationalität': 'country_of_origin',
    'staatsangehörigkeit': 'country_of_origin'
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return undefined;
}

function calculateConfidence(fieldName: string): number {
  const normalized = fieldName.toLowerCase();
  
  // High confidence for exact matches
  const exactMatches = ['vorname', 'nachname', 'email', 'telefon', 'plz', 'geburtsdatum'];
  if (exactMatches.some(match => normalized === match)) {
    return 0.95;
  }

  // Medium confidence for partial matches
  if (isAutoFillable(fieldName)) {
    return 0.75;
  }

  // Low confidence for unknown fields
  return 0.3;
}

function calculateOverallConfidence(fields: any[]): number {
  if (fields.length === 0) return 0;
  
  const avgConfidence = fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length;
  return Math.round(avgConfidence * 100) / 100;
}

function detectFormType(fields: any[]): string {
  const fieldNames = fields.map(f => f.field_name.toLowerCase()).join(' ');
  
  if (fieldNames.includes('anmeldung') || fieldNames.includes('gemeinde')) {
    return 'municipality_registration';
  }
  if (fieldNames.includes('schule') || fieldNames.includes('kindergarten')) {
    return 'school_registration';
  }
  if (fieldNames.includes('arbeitsvertrag') || fieldNames.includes('employment')) {
    return 'employment_contract';
  }
  if (fieldNames.includes('mietvertrag') || fieldNames.includes('rental')) {
    return 'rental_agreement';
  }
  
  return 'general_form';
}

function detectLanguage(fields: any[]): 'de' | 'fr' | 'it' | 'en' {
  const fieldNames = fields.map(f => f.field_name.toLowerCase()).join(' ');
  
  // German indicators
  const germanWords = ['vorname', 'nachname', 'strasse', 'plz', 'ort', 'geburtsdatum'];
  const germanCount = germanWords.filter(word => fieldNames.includes(word)).length;
  
  // French indicators
  const frenchWords = ['prenom', 'nom', 'rue', 'npa', 'ville', 'naissance'];
  const frenchCount = frenchWords.filter(word => fieldNames.includes(word)).length;
  
  // Italian indicators
  const italianWords = ['nome', 'cognome', 'via', 'cap', 'citta', 'nascita'];
  const italianCount = italianWords.filter(word => fieldNames.includes(word)).length;
  
  if (germanCount > frenchCount && germanCount > italianCount) return 'de';
  if (frenchCount > germanCount && frenchCount > italianCount) return 'fr';
  if (italianCount > germanCount && italianCount > frenchCount) return 'it';
  
  return 'de'; // Default to German
}

// Export config to handle large files
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};