import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';

interface FormField {
  name: string;
  translatedLabel: string;
  key: string;
  value: string | boolean;
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea';
  isPrefilled: boolean;
  group?: string;
}

// Comprehensive translation mapping for German form field names
const fieldTranslations: Record<string, string> = {
  // Personal information
  'name': 'Name',
  'vorname': 'First Name',
  'nachname': 'Last Name',
  'familienname': 'Family Name',
  'geburtsdatum': 'Date of Birth',
  'geburtstag': 'Birthday',
  'geschlecht': 'Gender',
  'nationalität': 'Nationality',
  'staatsangehörigkeit': 'Citizenship',
  'bürgerort': 'Place of Origin',
  'erstsprache': 'First Language',
  'muttersprache': 'Mother Tongue',
  'umgangssprache': 'Language at Home',

  // Address
  'adresse': 'Address',
  'strasse': 'Street',
  'hausnummer': 'House Number',
  'plz': 'Postal Code',
  'postleitzahl': 'Postal Code',
  'ort': 'City',
  'stadt': 'City',
  'wohnort': 'Place of Residence',
  'land': 'Country',
  'gültig': 'Valid Until',
  'bis': 'Until',
  'zuzug': 'Moving In',
  'nach': 'To',
  'per': 'On',

  // Contact
  'telefon': 'Phone',
  'telefonnummer': 'Phone Number',
  'mobile': 'Mobile',
  'handy': 'Mobile Phone',
  'email': 'Email',
  'e-mail': 'Email',
  'emailadresse': 'Email Address',
  'mailadresse': 'Email Address',
  'e-mailadresse': 'Email Address',
  'emaipadresse': 'Email Address',

  // Child/School specific
  'kind': 'Child',
  'kinder': 'Children',
  'schule': 'School',
  'klasse': 'Class',
  'lehrperson': 'Teacher',
  'kindergarten': 'Kindergarten',
  'eintrittsdatum': 'Entry Date',
  'eintritt': 'Entry',
  'bisher': 'Previous',
  'seit': 'Since',
  'des': 'Of',
  'und': 'And',
  'der': 'The',

  // Parents
  'mutter': 'Mother',
  'vater': 'Father',
  'eltern': 'Parents',
  'erziehungsberechtigte': 'Guardian',
  'funktion': 'Function/Role',

  // Medical/Special/Educational
  'allergien': 'Allergies',
  'medikamente': 'Medications',
  'krankheiten': 'Illnesses',
  'besonderheiten': 'Special Notes',
  'bemerkungen': 'Comments',
  'deutschkenntnisse': 'German Skills',
  'zweit': 'Second',
  'drittsprache': 'Third Language',
  'daz': 'German as Second Language',
  'if': 'Integrative Support',
  'bereiche': 'Areas',
  'nachteilsausgleich': 'Disadvantage Compensation',
  'form': 'Form',
  'von': 'Of',
  'lernzielbefreiung': 'Learning Goal Exemption',
  'isr': 'Integrated Special Education',
  'bereich': 'Area',
  'begabten': 'Gifted',
  'begabungsförderung': 'Talent Development',
  'ssa': 'School Social Work',
  'logopädie': 'Speech Therapy',
  'pmt': 'Psychomotor Therapy',
  'andere': 'Other',
  'therapien': 'Therapies',
  'arbeits': 'Work',
  'lernverhalten': 'Learning Behavior',
  'sozialverhalten': 'Social Behavior',
  'sonstiges': 'Other/Miscellaneous',

  // Administrative
  'datum': 'Date',
  'unterschrift': 'Signature',
  'ort_datum': 'Place and Date',

  // Boolean fields
  'ja': 'Yes',
  'nein': 'No',
  'männlich': 'Male',
  'weiblich': 'Female',

  // Numbers and ordinals
  '1': 'Person 1',
  '2': 'Person 2',
  '3': 'Person 3',
  '4': 'Person 4',
  '5': 'Person 5',
  '6': 'Person 6',

  // Common undefined field patterns
  'undefined': 'Checkbox Field',
  'checkbox': 'Selection Option',
  'option': 'Choice',
  'auswahl': 'Selection'
};

function translateFieldName(germanName: string): string {
  // Handle undefined fields specifically
  if (!germanName || germanName === 'undefined' || germanName.trim() === '') {
    return 'Checkbox Option';
  }

  const nameLower = germanName.toLowerCase();

  // Try exact matches first
  for (const [german, english] of Object.entries(fieldTranslations)) {
    if (nameLower === german) {
      return english;
    }
  }

  // Split compound field names and translate parts
  const words = germanName
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capitals
    .replace(/[_\-]/g, ' ') // Replace underscores and hyphens with spaces
    .split(/\s+/)
    .filter(word => word.length > 0);

  const translatedWords: string[] = [];

  for (const word of words) {
    const wordLower = word.toLowerCase();
    let translated = false;

    // Try to find translation for this word
    for (const [german, english] of Object.entries(fieldTranslations)) {
      if (wordLower === german || wordLower.includes(german) || german.includes(wordLower)) {
        translatedWords.push(english);
        translated = true;
        break;
      }
    }

    // If no translation found, keep original but capitalize
    if (!translated) {
      // Handle special cases
      if (wordLower === 'emailadresse') {
        translatedWords.push('Email Address');
      } else if (wordLower === 'telefonnummer') {
        translatedWords.push('Phone Number');
      } else if (wordLower.match(/^[0-9]+$/)) {
        translatedWords.push(`(${word})`);
      } else if (word.length === 1) {
        translatedWords.push(word.toUpperCase());
      } else {
        translatedWords.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
      }
    }
  }

  let result = translatedWords.join(' ');

  // Clean up the result
  result = result
    .replace(/\s+/g, ' ') // Remove multiple spaces
    .replace(/\(\s*\)/g, '') // Remove empty parentheses
    .replace(/\s*\(\s*/g, ' (') // Fix spacing around parentheses
    .replace(/\s*\)\s*/g, ') ')
    .trim();

  // If result is too generic or empty, provide better description
  if (!result || result === 'Undefined' || result.length < 2) {
    return 'Form Field';
  }

  return result;
}

function createFieldKey(fieldName: string, index: number): string {
  // Handle undefined fields
  if (!fieldName || fieldName === 'undefined' || fieldName.trim() === '') {
    return `checkbox_${index}`;
  }

  const cleaned = fieldName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const camelCase = cleaned
    .split(' ')
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return camelCase || `field_${index}`;
}

function getFieldGroupAndDescription(fieldName: string, fieldType: string): { group: string; description: string } {
  const nameLower = fieldName.toLowerCase();

  // Child information
  if (nameLower.includes('kind') || nameLower.includes('child') ||
      nameLower === 'name' || nameLower === 'vorname' || nameLower === 'geburtsdatum') {
    if (nameLower === 'name') return { group: 'Child Information', description: 'Child Last Name' };
    if (nameLower === 'vorname') return { group: 'Child Information', description: 'Child First Name' };
    if (nameLower === 'geburtsdatum') return { group: 'Child Information', description: 'Child Date of Birth' };
    if (nameLower === 'männlich') return { group: 'Child Information', description: 'Male' };
    if (nameLower === 'weiblich') return { group: 'Child Information', description: 'Female' };
    if (nameLower === 'bürgerort') return { group: 'Child Information', description: 'Place of Origin' };
    if (nameLower.includes('nationalität')) return { group: 'Child Information', description: 'Nationality' };
    if (nameLower.includes('erstsprache')) return { group: 'Child Information', description: 'First Language' };
    if (nameLower.includes('umgangssprache')) return { group: 'Child Information', description: 'Language at Home' };
  }

  // Parent information
  if (nameLower.includes('_2') || nameLower.includes('_3') ||
      (nameLower.includes('vorname') && !nameLower.includes('kind')) ||
      (nameLower.includes('name') && !nameLower.includes('kind'))) {
    if (nameLower.includes('_2')) return { group: 'Parent 2 Information', description: fieldName.replace('_2', ' (Parent 2)') };
    if (nameLower.includes('_3')) return { group: 'Parent 3 Information', description: fieldName.replace('_3', ' (Parent 3)') };
    if (nameLower.includes('adresse')) return { group: 'Parent Information', description: 'Address' };
    if (nameLower.includes('mobile')) return { group: 'Parent Information', description: 'Mobile Phone' };
    if (nameLower.includes('email')) return { group: 'Parent Information', description: 'Email Address' };
    if (nameLower.includes('telefon')) return { group: 'Parent Information', description: 'Phone Number' };
    if (nameLower.includes('funktion')) return { group: 'Parent Information', description: 'Function/Role' };
  }

  // School/Previous information
  if (nameLower.includes('bisher') || nameLower.includes('schule') || nameLower.includes('klasse')) {
    if (nameLower.includes('strasse')) return { group: 'Previous School', description: 'Previous Street' };
    if (nameLower.includes('ort') && nameLower.includes('land')) return { group: 'Previous School', description: 'Previous City/Country' };
    if (nameLower.includes('klasse')) return { group: 'Previous School', description: 'Previous Class' };
    if (nameLower.includes('lehrperson')) return { group: 'Previous School', description: 'Previous Teacher Name' };
    if (nameLower.includes('schule')) return { group: 'Previous School', description: 'School Name and Location' };
  }

  // Educational support
  if (nameLower.includes('daz') || nameLower.includes('deutsch') || nameLower.includes('if') ||
      nameLower.includes('logopädie') || nameLower.includes('pmt') || nameLower.includes('ssa')) {
    if (nameLower.includes('daz')) return { group: 'Educational Support', description: 'German as Second Language Since' };
    if (nameLower.includes('deutsch')) return { group: 'Educational Support', description: 'German Language Skills' };
    if (nameLower.includes('if')) return { group: 'Educational Support', description: 'Integrative Support Areas' };
    if (nameLower.includes('nachteil')) return { group: 'Educational Support', description: 'Disadvantage Compensation' };
    if (nameLower.includes('lernziel')) return { group: 'Educational Support', description: 'Learning Goal Exemption' };
    if (nameLower.includes('isr')) return { group: 'Educational Support', description: 'Special Education Area' };
    if (nameLower.includes('begabten')) return { group: 'Educational Support', description: 'Gifted Education' };
    if (nameLower.includes('ssa')) return { group: 'Educational Support', description: 'School Social Work' };
    if (nameLower.includes('logopädie')) return { group: 'Educational Support', description: 'Speech Therapy Since' };
    if (nameLower.includes('pmt')) return { group: 'Educational Support', description: 'Psychomotor Therapy Since' };
    if (nameLower.includes('therapien')) return { group: 'Educational Support', description: 'Other Therapies' };
  }

  // Behavior and other
  if (nameLower.includes('verhalten') || nameLower.includes('sonstiges')) {
    if (nameLower.includes('arbeits') || nameLower.includes('lern')) return { group: 'Behavior Assessment', description: 'Work and Learning Behavior' };
    if (nameLower.includes('sozial')) return { group: 'Behavior Assessment', description: 'Social Behavior' };
    if (nameLower.includes('sonstiges')) return { group: 'Additional Information', description: 'Other Notes' };
  }

  // Numbers and simple fields
  if (nameLower.match(/^[0-9]+(_[0-9]+)?$/)) {
    return { group: 'Assessment Ratings', description: `Rating ${fieldName}` };
  }

  // Moving/Administrative
  if (nameLower.includes('zuzug') || nameLower.includes('gültig')) {
    if (nameLower.includes('zuzug')) return { group: 'Administrative', description: 'Moving to Wallisellen Date' };
    if (nameLower.includes('gültig')) return { group: 'Administrative', description: 'Address Valid Until' };
  }

  // Default for undefined checkboxes
  if (fieldType === 'checkbox' && (nameLower === 'undefined' || nameLower.includes('undefined'))) {
    return { group: 'Selection Options', description: 'Checkbox Option' };
  }

  // Default fallback
  return { group: 'Other Fields', description: translateFieldName(fieldName) };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No PDF file uploaded.'
      }, { status: 400 });
    }

    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pdfFields = form.getFields();

    console.log(`🔍 Extracting ${pdfFields.length} form fields from PDF`);

    const extractedFields: FormField[] = [];

    pdfFields.forEach((field, index) => {
      let fieldName = field.getName();

      // Handle undefined or empty field names
      if (!fieldName || fieldName === 'undefined' || fieldName.trim() === '') {
        fieldName = `checkbox_field_${index + 1}`;
      }

      let fieldType: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' = 'text';

      // Determine field type
      if (field instanceof PDFTextField) {
        fieldType = 'text';
      } else if (field instanceof PDFCheckBox) {
        fieldType = 'checkbox';
      } else if (field instanceof PDFDropdown) {
        fieldType = 'select';
      } else if (field instanceof PDFRadioGroup) {
        fieldType = 'radio';
      }

      const { group, description } = getFieldGroupAndDescription(fieldName, fieldType);
      const key = createFieldKey(fieldName, index);

      extractedFields.push({
        name: field.getName() || fieldName, // Keep original name for mapping
        translatedLabel: description,
        key,
        value: fieldType === 'checkbox' ? false : '',
        type: fieldType,
        isPrefilled: false,
        group: group // Add group information
      });

      console.log(`📋 Field ${index + 1}: "${field.getName() || fieldName}" -> "${description}" (${fieldType}) [${group}]`);
    });

    // Group similar fields and add numbers for duplicates
    const fieldCounts = new Map<string, number>();
    const finalFields = extractedFields.map(field => {
      const baseKey = field.key;
      const count = fieldCounts.get(baseKey) || 0;
      fieldCounts.set(baseKey, count + 1);

      if (count > 0) {
        return {
          ...field,
          key: `${baseKey}_${count + 1}`,
          translatedLabel: `${field.translatedLabel} (${count + 1})`
        };
      }

      return field;
    });

    console.log(`✅ Successfully extracted ${finalFields.length} form fields`);

    return NextResponse.json({
      success: true,
      data: {
        formFields: finalFields,
        totalFields: pdfFields.length
      }
    });

  } catch (error) {
    console.error('PDF Field Extraction Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to extract form fields from PDF'
    }, { status: 500 });
  }
}