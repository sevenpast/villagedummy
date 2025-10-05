// features/pdf-upload/services/pdf-autofill-service.ts
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';

interface UserProfile {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  country_of_origin?: string;
  current_address?: string;
  municipality?: string;
  canton?: string;
  postal_code?: string;
  employer?: string;
  has_kids?: boolean;
  num_children?: number;
}

interface AutoFillResult {
  success: boolean;
  filled_fields: number;
  total_fields: number;
  accuracy: number;
  filled_pdf_bytes?: Uint8Array;
  errors: string[];
}

export class PDFAutoFillService {
  async fillPDF(pdfBytes: Uint8Array, userProfile: UserProfile): Promise<AutoFillResult> {
    const errors: string[] = [];
    let filledFields = 0;
    let totalFields = 0;

    try {
      // Load PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      totalFields = fields.length;

      // Fill each field
      for (const field of fields) {
        try {
          const fieldName = field.getName();
          const fieldType = field.constructor.name;
          
          const value = this.mapFieldToValue(fieldName, userProfile);
          
          if (value !== null && value !== undefined) {
            const success = this.fillField(field, fieldType, value);
            if (success) {
              filledFields++;
            }
          }
        } catch (error) {
          errors.push(`Error filling field ${field.getName()}: ${error}`);
        }
      }

      // CRITICAL: Update field appearances
      try {
        form.updateFieldAppearances();
      } catch (error) {
        console.error('Failed to update appearances:', error);
        errors.push('Failed to update field appearances');
      }

      // Flatten form (optional - makes it non-editable)
      // form.flatten();

      // Save PDF
      const filledPdfBytes = await pdfDoc.save();

      const accuracy = totalFields > 0 ? (filledFields / totalFields) : 0;

      return {
        success: true,
        filled_fields: filledFields,
        total_fields: totalFields,
        accuracy: Math.round(accuracy * 100) / 100,
        filled_pdf_bytes: filledPdfBytes,
        errors
      };

    } catch (error) {
      return {
        success: false,
        filled_fields: filledFields,
        total_fields: totalFields,
        accuracy: 0,
        errors: [...errors, `Fatal error: ${error}`]
      };
    }
  }

  private fillField(field: any, fieldType: string, value: any): boolean {
    try {
      switch (fieldType) {
        case 'PDFTextField':
          (field as PDFTextField).setText(String(value));
          return true;

        case 'PDFCheckBox':
          if (value === true || value === 'true' || value === 'yes' || value === 'ja') {
            (field as PDFCheckBox).check();
          } else {
            (field as PDFCheckBox).uncheck();
          }
          return true;

        case 'PDFRadioGroup':
          try {
            (field as PDFRadioGroup).select(String(value));
            return true;
          } catch {
            // If exact value doesn't match, try first option
            const options = (field as PDFRadioGroup).getOptions();
            if (options.length > 0) {
              (field as PDFRadioGroup).select(options[0]);
              return true;
            }
          }
          return false;

        case 'PDFDropdown':
          try {
            (field as PDFDropdown).select(String(value));
            return true;
          } catch {
            // If exact value doesn't match, try first option
            const options = (field as PDFDropdown).getOptions();
            if (options.length > 0) {
              (field as PDFDropdown).select(options[0]);
              return true;
            }
          }
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error filling field type ${fieldType}:`, error);
      return false;
    }
  }

  private mapFieldToValue(fieldName: string, userProfile: UserProfile): any {
    const normalized = fieldName.toLowerCase().trim();

    // German → User Profile mapping
    const mappings: Array<{ patterns: string[], value: any }> = [
      { patterns: ['vorname', 'first', 'prenom'], value: userProfile.first_name },
      { patterns: ['nachname', 'name', 'last', 'surname', 'nom', 'cognome'], value: userProfile.last_name },
      { patterns: ['email', 'mail', 'e-mail', 'courriel'], value: userProfile.email },
      { patterns: ['telefon', 'phone', 'tel', 'telephone'], value: userProfile.phone },
      { patterns: ['geburtsdatum', 'birth', 'geboren', 'naissance', 'nascita'], value: userProfile.date_of_birth },
      { patterns: ['strasse', 'address', 'adresse', 'rue', 'via'], value: userProfile.current_address },
      { patterns: ['plz', 'zip', 'postal', 'npa', 'cap'], value: userProfile.postal_code },
      { patterns: ['ort', 'city', 'stadt', 'ville', 'citta'], value: userProfile.municipality },
      { patterns: ['kanton', 'canton'], value: userProfile.canton },
      { patterns: ['staatsangehörigkeit', 'nationality', 'nationalité', 'nazionalità'], value: userProfile.country_of_origin },
      { patterns: ['arbeitgeber', 'employer', 'employeur', 'datore'], value: userProfile.employer },
      { patterns: ['kinder', 'children', 'enfants', 'bambini'], value: userProfile.has_kids ? 'Ja' : 'Nein' },
      { patterns: ['anzahl', 'number', 'nombre'], value: userProfile.num_children?.toString() },
    ];

    // Check for pattern matches
    for (const mapping of mappings) {
      for (const pattern of mapping.patterns) {
        if (normalized.includes(pattern) && mapping.value) {
          return mapping.value;
        }
      }
    }

    return null;
  }

  // Helper to format dates for Swiss forms
  private formatDate(date: string | undefined): string | null {
    if (!date) return null;
    
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return date;
    }
  }
}

// ============================================
// API ROUTE: Auto-Fill
// ============================================

// app/api/pdf/auto-fill/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFAutoFillService } from '@/features/pdf-upload/services/pdf-autofill-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const userProfileJson = formData.get('userProfile') as string;

    if (!pdfFile || !userProfileJson) {
      return NextResponse.json(
        { error: 'Missing PDF file or user profile' },
        { status: 400 }
      );
    }

    const userProfile = JSON.parse(userProfileJson);

    // Convert File to Uint8Array
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    // Auto-fill PDF
    const service = new PDFAutoFillService();
    const result = await service.fillPDF(pdfBytes, userProfile);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to fill PDF', details: result.errors },
        { status: 500 }
      );
    }

    // Return filled PDF as blob
    return new NextResponse(result.filled_pdf_bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="filled_${pdfFile.name}"`,
      },
    });

  } catch (error) {
    console.error('Auto-fill error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-fill PDF', details: String(error) },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};