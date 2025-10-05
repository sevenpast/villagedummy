import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';

interface FormField {
  name?: string;
  label: string;
  translatedLabel?: string;
  key: string;
  value: string | boolean | string[];
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'question';
  isPrefilled: boolean;
  options?: { name: string; originalName: string; label: string }[];
  groupType?: 'single' | 'multiple' | 'text';
}

export async function POST(request: NextRequest) {
  try {
    const { originalPdfBase64, formFields } = await request.json();

    if (!originalPdfBase64 || !formFields) {
      return NextResponse.json({
        success: false,
        error: 'Missing original PDF or form fields data.'
      }, { status: 400 });
    }

    console.log(`📄 Filling original PDF with ${formFields.length} field values`);

    // Load the original PDF
    const pdfDoc = await PDFDocument.load(Buffer.from(originalPdfBase64, 'base64'));
    const form = pdfDoc.getForm();

    // Get all available form fields from the PDF
    const pdfFields = form.getFields();
    console.log(`🔍 Found ${pdfFields.length} form fields in PDF`);

    // Create a mapping of user input values by the original field name
    const fieldValueMap = new Map<string, string | boolean>();

    formFields.forEach((field: FormField) => {
      if (field.type === 'question' && field.options) {
        // Handle question-type fields with options
        if (field.groupType === 'single' && field.value) {
          // For single selection (radio), map the selected value to its original name
          const selectedOption = field.options.find(opt => opt.name === field.value);
          if (selectedOption) {
            fieldValueMap.set(selectedOption.originalName, true);
            console.log(`📝 Mapping question field "${selectedOption.originalName}" -> true`);
          }
        } else if (field.groupType === 'multiple' && Array.isArray(field.value)) {
          // For multiple selection (checkboxes), map each selected value
          field.value.forEach(selectedValue => {
            const selectedOption = field.options!.find(opt => opt.name === selectedValue);
            if (selectedOption) {
              fieldValueMap.set(selectedOption.originalName, true);
              console.log(`📝 Mapping question field "${selectedOption.originalName}" -> true`);
            }
          });
        }
      } else if (field.value !== '' && field.value !== false && !Array.isArray(field.value)) {
        // Handle regular fields
        const originalName = field.name || field.key;
        fieldValueMap.set(originalName, field.value);

        console.log(`📝 Mapping field "${originalName}" -> "${field.value}"`);
      }
    });

    console.log(`📝 Processing ${fieldValueMap.size} field values`);

    // Fill the PDF form fields
    let filledFieldsCount = 0;

    for (const pdfField of pdfFields) {
      const fieldName = pdfField.getName();

      // Try exact match with original field name first
      let matchedValue = fieldValueMap.get(fieldName);

      if (matchedValue === undefined) {
        // Try case-insensitive matching as fallback
        const fieldNameLower = fieldName.toLowerCase();
        for (const [mappedName, mappedValue] of fieldValueMap.entries()) {
          if (mappedName.toLowerCase() === fieldNameLower) {
            matchedValue = mappedValue;
            break;
          }
        }
      }

      if (matchedValue !== undefined && matchedValue !== '' && matchedValue !== false) {
        try {
          if (pdfField instanceof PDFTextField) {
            pdfField.setText(String(matchedValue));
            console.log(`✅ Filled text field "${fieldName}" with: "${matchedValue}"`);
            filledFieldsCount++;
          }
          else if (pdfField instanceof PDFCheckBox) {
            if (matchedValue === true || String(matchedValue).toLowerCase() === 'true' ||
                String(matchedValue).toLowerCase() === 'yes' || String(matchedValue).toLowerCase() === 'ja') {
              pdfField.check();
              console.log(`✅ Checked checkbox "${fieldName}"`);
              filledFieldsCount++;
            }
          }
          else if (pdfField instanceof PDFDropdown) {
            const options = pdfField.getOptions();
            const matchingOption = options.find(option =>
              option.toLowerCase().includes(String(matchedValue).toLowerCase()) ||
              String(matchedValue).toLowerCase().includes(option.toLowerCase())
            );
            if (matchingOption) {
              pdfField.select(matchingOption);
              console.log(`✅ Selected dropdown "${fieldName}" option: "${matchingOption}"`);
              filledFieldsCount++;
            }
          }
          else if (pdfField instanceof PDFRadioGroup) {
            const options = pdfField.getOptions();
            const matchingOption = options.find(option =>
              option.toLowerCase().includes(String(matchedValue).toLowerCase()) ||
              String(matchedValue).toLowerCase().includes(option.toLowerCase())
            );
            if (matchingOption) {
              pdfField.select(matchingOption);
              console.log(`✅ Selected radio "${fieldName}" option: "${matchingOption}"`);
              filledFieldsCount++;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not fill field "${fieldName}":`, error);
        }
      }
    }

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();

    console.log(`✅ Successfully filled ${filledFieldsCount} out of ${pdfFields.length} PDF fields`);

    return new NextResponse(filledPdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="filled-form.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF Filling Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fill PDF form'
    }, { status: 500 });
  }
}