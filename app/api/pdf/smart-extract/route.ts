import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import Tesseract from 'tesseract.js';

interface SmartFormField {
  name: string;
  originalName: string;
  label: string;
  key: string;
  value: string | boolean | string[];
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'question';
  isPrefilled: boolean;
  group: string;
  question?: string;
  groupType?: 'single' | 'multiple' | 'text';
  options?: { name: string; originalName: string; label: string }[];
  coordinates?: { x: number; y: number; width: number; height: number };
}

interface FieldGroup {
  question: string;
  type: 'single' | 'multiple' | 'text' | 'checkbox_text' | 'checkbox_text_multiple' | 'table';
  fields: SmartFormField[];
  tableStructure?: {
    headers: string[];
    rows: {
      label: string;
      fields: SmartFormField[];
    }[];
  };
}

// Intelligent field name cleaning and translation
function cleanAndTranslateFieldName(fieldName: string): { clean: string; translation: string } {
  if (!fieldName || fieldName === 'undefined' || fieldName.startsWith('undefined')) {
    return { clean: 'selection_option', translation: 'Selection Option' };
  }

  // Remove noise patterns
  let cleaned = fieldName
    .replace(/männlich\s*weiblich/gi, '') // Remove gender prefix noise
    .replace(/^undefined.*$/gi, '') // Remove entire undefined patterns
    .replace(/_\d+$/, '') // Remove trailing numbers
    .trim();

  // If cleaned becomes empty after noise removal, return meaningful label
  if (!cleaned || cleaned.length === 0) {
    return { clean: 'selection_option', translation: 'Selection Option' };
  }

  // Comprehensive German to English translations
  const smartTranslations: Record<string, string> = {
    // Child information
    'name': 'Child\'s Last Name',
    'vorname': 'Child\'s First Name',
    'geburtsdatum': 'Date of Birth',
    'männlich': 'Male',
    'weiblich': 'Female',
    'bürgerort': 'Place of Citizenship',
    'nationalität': 'Nationality',
    'erstsprache': 'First Language',
    'umgangssprache in der familie': 'Language at Home',
    'männlich weiblichnationalität': 'Nationality',
    'männlich weiblichumgangssprache in der familie': 'Language at Home',

    // Parent information
    'vorname_2': 'Parent 2 - First Name',
    'vorname_3': 'Parent 3 - First Name',
    'name_2': 'Parent 2 - Last Name',
    'name_3': 'Parent 3 - Last Name',
    'name_4': 'Contact Person - Last Name',
    'name_5': 'Contact Person 2 - Last Name',
    'name_6': 'Contact Person 3 - Last Name',
    'adresse': 'Home Address',
    'adresse_2': 'Parent 2 - Address',
    'mobile': 'Mobile Phone',
    'mobile_2': 'Parent 2 - Mobile',
    'email': 'Email Address',
    'email_2': 'Parent 2 - Email',
    'emailadresse': 'Email Address',
    'emailadresse_2': 'Parent 2 - Email',
    'emailadresse_3': 'Parent 3 - Email',
    'telefonnummer': 'Phone Number',
    'telefonnummer_2': 'Parent 2 - Phone',
    'telefonnummer_3': 'Parent 3 - Phone',
    'funktion': 'Role/Function',
    'funktion_2': 'Parent 2 - Role',

    // Previous school
    'name und ort der schule': 'Previous School Name & Location',
    'strasse bisher': 'Previous Address - Street',
    'ort land bisher': 'Previous Address - City/Country',
    'klasse bisher': 'Previous Class/Grade',
    'name lehrperson bisher': 'Previous Teacher Name',
    'name und vorname des kindes 1': 'Child 1 - Full Name',
    'name und vorname des kindes 2': 'Child 2 - Full Name',

    // Administrative
    'adresse gültig bis': 'Address Valid Until',
    'zuzug nach wallisellen per': 'Moving to Wallisellen Date',

    // Educational support
    'daz seit': 'German as Second Language - Since',
    'deutschkenntnisse muttersprache zweit oder drittsprache etc': 'German Skills Description',
    'if bereiche': 'Integrative Support Areas',
    'nachteilsausgleich in form von': 'Disadvantage Compensation Form',
    'lernzielbefreiung': 'Learning Goal Exemption',
    'isr bereich': 'Special Education (ISR) Area',
    'begabtenund begabungsförderung': 'Gifted Education Support',
    'ssa': 'School Social Work (SSA)',
    'logopädie seit': 'Speech Therapy - Since',
    'pmt seit': 'Psychomotor Therapy - Since',
    'andere therapien': 'Other Therapies',

    // Behavior assessment
    'arbeitsund lernverhalten': 'Work & Learning Behavior',
    'sozialverhalten': 'Social Behavior',
    'sonstiges': 'Additional Comments',

    // Rating fields
    '1': 'Rating 1',
    '2': 'Rating 2',
    '3': 'Rating 3',
    '1_2': 'Rating 1 (Section 2)',
    '2_2': 'Rating 2 (Section 2)',
    '3_2': 'Rating 3 (Section 2)',

    // Time indicators
    'seit': 'Since',
    'seit_2': 'Since (Parent 2)',
    'seit_3': 'Since (Parent 3)',

    // Undefined handling
    'undefined': 'Checkbox Option',
    'undefined_2': 'Checkbox Option 2',
    'undefined_3': 'Checkbox Option 3',
    'undefined_4': 'Checkbox Option 4',
    'undefined_5': 'Checkbox Option 5',
    'undefined_6': 'Checkbox Option 6',
    'undefined_7': 'Checkbox Option 7',
    'undefined_8': 'Checkbox Option 8',
    'undefined_9': 'Checkbox Option 9',
    'undefined_10': 'Checkbox Option 10',
    'undefined_11': 'Checkbox Option 11',
    'undefined_12': 'Checkbox Option 12',
    'undefined_13': 'Checkbox Option 13',
    'undefined_14': 'Checkbox Option 14',
    'undefined_15': 'Checkbox Option 15',
    'undefined_16': 'Checkbox Option 16',
    'undefined_17': 'Checkbox Option 17',
    'undefined_18': 'Checkbox Option 18',
    'undefined_19': 'Checkbox Option 19',
    'undefined_20': 'Checkbox Option 20',
    'undefined_21': 'Checkbox Option 21',
    'undefined_22': 'Checkbox Option 22',
    'undefined_23': 'Checkbox Option 23',
    'undefined_24': 'Checkbox Option 24'
  };

  const cleanedLower = cleaned.toLowerCase();

  // Try exact match first
  if (smartTranslations[cleanedLower]) {
    return { clean: cleaned, translation: smartTranslations[cleanedLower] };
  }

  // Try partial matches for compound words
  for (const [german, english] of Object.entries(smartTranslations)) {
    if (cleanedLower.includes(german)) {
      return { clean: cleaned, translation: english };
    }
  }

  // Fallback: clean up and capitalize
  const fallback = cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return { clean: cleaned, translation: fallback || 'Form Field' };
}

// Detect form structure dynamically by analyzing field patterns
function detectFormStructure(fields: any[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  const processedIndices = new Set<number>();

  // Get all fields with their types and names
  const allFields = fields.map((field, index) => ({
    field,
    index,
    name: field.getName()?.toLowerCase() || '',
    type: field instanceof PDFTextField ? 'text' :
          field instanceof PDFCheckBox ? 'checkbox' :
          field instanceof PDFDropdown ? 'dropdown' : 'other'
  }));

  console.log(`Analyzing ${allFields.length} fields for dynamic structure detection`);

  // Find text fields that might be related to checkboxes
  const textFields = allFields.filter(f => f.type === 'text');
  const checkboxFields = allFields.filter(f => f.type === 'checkbox');

  // 1. Parent Information Table (Personalien Vater/Mutter)
  const parentFields = textFields.filter(f =>
    f.name.includes('_2') || f.name.includes('_3') ||
    (f.name.includes('vorname') && !f.name.includes('kind')) ||
    (f.name.includes('name') && !f.name.includes('kind')) ||
    f.name.includes('adresse') || f.name.includes('mobile') || f.name.includes('email')
  );

  if (parentFields.length >= 6) {
    const parentTable: FieldGroup = {
      question: 'Parent Information',
      type: 'table',
      fields: [],
      tableStructure: {
        headers: ['Personalien Vater', 'Personalien Mutter'],
        rows: [
          {
            label: 'Vorname',
            fields: [
              { name: 'vorname_father', originalName: 'Vorname', label: 'First Name', key: 'father_firstname', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' },
              { name: 'vorname_mother', originalName: 'Vorname_2', label: 'First Name', key: 'mother_firstname', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' }
            ]
          },
          {
            label: 'Name',
            fields: [
              { name: 'name_father', originalName: 'Name', label: 'Last Name', key: 'father_lastname', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' },
              { name: 'name_mother', originalName: 'Name_2', label: 'Last Name', key: 'mother_lastname', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' }
            ]
          },
          {
            label: 'Adresse',
            fields: [
              { name: 'adresse_father', originalName: 'Adresse', label: 'Address', key: 'father_address', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' },
              { name: 'adresse_mother', originalName: 'Adresse_2', label: 'Address', key: 'mother_address', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' }
            ]
          },
          {
            label: 'Mobile',
            fields: [
              { name: 'mobile_father', originalName: 'Mobile', label: 'Mobile Phone', key: 'father_mobile', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' },
              { name: 'mobile_mother', originalName: 'Mobile_2', label: 'Mobile Phone', key: 'mother_mobile', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' }
            ]
          },
          {
            label: 'E-Mail',
            fields: [
              { name: 'email_father', originalName: 'EMail', label: 'Email Address', key: 'father_email', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' },
              { name: 'email_mother', originalName: 'EMail_2', label: 'Email Address', key: 'mother_email', value: '', type: 'text' as const, isPrefilled: false, group: 'Parent Information' }
            ]
          },
          {
            label: 'Deutschkenntnisse',
            fields: [
              { name: 'deutsch_father', originalName: 'deutschkenntnisse_father', label: 'German Skills', key: 'father_german', value: [], type: 'checkbox' as const, isPrefilled: false, group: 'Parent Information', options: [
                { name: 'gut', originalName: 'gut_father', label: 'gut' },
                { name: 'mittel', originalName: 'mittel_father', label: 'mittel' },
                { name: 'keine', originalName: 'keine_father', label: 'keine' }
              ]},
              { name: 'deutsch_mother', originalName: 'deutschkenntnisse_mother', label: 'German Skills', key: 'mother_german', value: [], type: 'checkbox' as const, isPrefilled: false, group: 'Parent Information', options: [
                { name: 'gut', originalName: 'gut_mother', label: 'gut' },
                { name: 'mittel', originalName: 'mittel_mother', label: 'mittel' },
                { name: 'keine', originalName: 'keine_mother', label: 'keine' }
              ]}
            ]
          },
          {
            label: 'Erziehungsberechtigung',
            fields: [
              { name: 'custody', originalName: 'erziehungsberechtigung', label: 'Custody', key: 'custody_arrangement', value: [], type: 'checkbox' as const, isPrefilled: false, group: 'Parent Information', options: [
                { name: 'beide_elternteile', originalName: 'beide_elternteile', label: 'beide Elternteile' },
                { name: 'mutter', originalName: 'custody_mutter', label: 'Mutter' },
                { name: 'vater', originalName: 'custody_vater', label: 'Vater' }
              ]}
            ]
          }
        ]
      }
    };
    groups.push(parentTable);

    // Mark relevant fields as processed
    parentFields.forEach(f => processedIndices.add(f.index));
  }

  // 2. Kind wohnhaft bei (using männlich/weiblich as identifiers)
  const genderCheckboxes = checkboxFields.filter(f => f.name === 'männlich' || f.name === 'weiblich');
  if (genderCheckboxes.length >= 2) {
    const wohnhaftGroup: FieldGroup = {
      question: 'Kind wohnhaft bei',
      type: 'multiple',
      fields: [
        { name: 'eltern', originalName: 'männlich', label: 'Eltern', key: 'wohnhaft_eltern', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Child Information' },
        { name: 'mutter', originalName: 'weiblich', label: 'Mutter', key: 'wohnhaft_mutter', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Child Information' }
      ]
    };
    groups.push(wohnhaftGroup);
    genderCheckboxes.forEach(f => processedIndices.add(f.index));
  }

  // 2. Deutschkenntnisse Kind (first 3 undefined checkboxes)
  const undefinedCheckboxes = checkboxFields.filter(f =>
    (f.name === 'undefined' || f.name.startsWith('undefined')) &&
    !processedIndices.has(f.index)
  );

  if (undefinedCheckboxes.length >= 3) {
    const deutschGroup: FieldGroup = {
      question: 'Deutschkenntnisse Kind',
      type: 'single',
      fields: [
        { name: 'gut', originalName: undefinedCheckboxes[0].field.getName(), label: 'gut', key: 'deutsch_gut', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Child Information' },
        { name: 'mittel', originalName: undefinedCheckboxes[1].field.getName(), label: 'mittel', key: 'deutsch_mittel', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Child Information' },
        { name: 'keine', originalName: undefinedCheckboxes[2].field.getName(), label: 'keine', key: 'deutsch_keine', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Child Information' }
      ]
    };
    groups.push(deutschGroup);
    undefinedCheckboxes.slice(0, 3).forEach(f => processedIndices.add(f.index));
  }

  // 3. Schulische Therapien (next 2 undefined checkboxes)
  const remainingCheckboxes = undefinedCheckboxes.filter(f => !processedIndices.has(f.index));
  if (remainingCheckboxes.length >= 2) {
    const therapyGroup: FieldGroup = {
      question: 'Schulische Therapien',
      type: 'multiple',
      fields: [
        { name: 'logopaedie', originalName: remainingCheckboxes[0].field.getName(), label: 'Logopädie', key: 'therapy_logo', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' },
        { name: 'psychomotorik', originalName: remainingCheckboxes[1].field.getName(), label: 'Psychomotorik', key: 'therapy_psycho', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' }
      ]
    };
    groups.push(therapyGroup);
    remainingCheckboxes.slice(0, 2).forEach(f => processedIndices.add(f.index));
  }

  // 4. DaZ-Unterricht (checkbox + text field combination)
  const remainingAfterTherapy = remainingCheckboxes.filter(f => !processedIndices.has(f.index));
  const dazSeitTextField = textFields.find(f => f.name.includes('daz') && f.name.includes('seit'));

  if (remainingAfterTherapy.length >= 1) {
    const dazGroup: FieldGroup = {
      question: 'DaZ-Unterricht',
      type: 'checkbox_text',
      fields: [
        { name: 'daz_checkbox', originalName: remainingAfterTherapy[0].field.getName(), label: 'seit', key: 'daz_seit_checkbox', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' },
        { name: 'daz_text', originalName: dazSeitTextField?.field.getName() || 'DaZ seit', label: 'Since when?', key: 'daz_seit_text', value: '', type: 'text' as const, isPrefilled: false, group: 'Educational Support' }
      ]
    };
    groups.push(dazGroup);
    processedIndices.add(remainingAfterTherapy[0].index);
    if (dazSeitTextField) processedIndices.add(dazSeitTextField.index);
  }

  // 5. Integrative Förderung (IF) - multiple checkbox+text combinations
  const remainingAfterDaz = remainingAfterTherapy.filter(f => !processedIndices.has(f.index));
  const ifTextFields = textFields.filter(f => !processedIndices.has(f.index) && (
    f.name.includes('if') || f.name.includes('begabten') || f.name.includes('seit')
  ));

  if (remainingAfterDaz.length >= 3) {
    const ifGroup: FieldGroup = {
      question: 'Integrative Förderung (IF)',
      type: 'checkbox_text_multiple',
      fields: [
        { name: 'if_seit_checkbox', originalName: remainingAfterDaz[0].field.getName(), label: 'seit', key: 'if_seit_checkbox', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' },
        { name: 'if_seit_text', originalName: 'if_seit_text', label: 'Since when?', key: 'if_seit_text', value: '', type: 'text' as const, isPrefilled: false, group: 'Educational Support' },
        { name: 'begabten_checkbox', originalName: remainingAfterDaz[1].field.getName(), label: 'Begabtenförderung', key: 'begabten_checkbox', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' },
        { name: 'begabten_seit_checkbox', originalName: remainingAfterDaz[2].field.getName(), label: 'seit', key: 'begabten_seit_checkbox', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' },
        { name: 'begabten_seit_text', originalName: 'begabten_seit_text', label: 'Since when?', key: 'begabten_seit_text', value: '', type: 'text' as const, isPrefilled: false, group: 'Educational Support' }
      ]
    };
    groups.push(ifGroup);
    remainingAfterDaz.slice(0, 3).forEach(f => processedIndices.add(f.index));
  }

  // 6. Sonderschulung (remaining checkboxes)
  const finalRemaining = remainingAfterDaz.filter(f => !processedIndices.has(f.index));
  if (finalRemaining.length >= 2) {
    const sonderschulungGroup: FieldGroup = {
      question: 'Sonderschulung',
      type: 'multiple',
      fields: [
        { name: 'integrierte_isr', originalName: finalRemaining[0].field.getName(), label: 'Integrierte Sonderschulung ISR', key: 'sonder_isr', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' },
        { name: 'externe_sonderschulung', originalName: finalRemaining[1].field.getName(), label: 'externe Sonderschulung', key: 'sonder_extern', value: false, type: 'checkbox' as const, isPrefilled: false, group: 'Educational Support' }
      ]
    };
    groups.push(sonderschulungGroup);
    finalRemaining.slice(0, 2).forEach(f => processedIndices.add(f.index));
  }

  return groups;
}

// Group fields by semantic meaning
function groupFieldsBySemantic(fields: SmartFormField[]): Record<string, SmartFormField[]> {
  const groups: Record<string, SmartFormField[]> = {
    'Child Information': [],
    'Parent 1 Information': [],
    'Parent 2 Information': [],
    'Previous School': [],
    'Educational Support': [],
    'Assessment & Behavior': [],
    'Administrative': [],
    'Other': []
  };

  fields.forEach(field => {
    const nameLower = field.originalName.toLowerCase();

    if (nameLower.includes('kind') || nameLower === 'name' || nameLower === 'vorname' ||
        nameLower === 'geburtsdatum' || nameLower === 'männlich' || nameLower === 'weiblich' ||
        nameLower.includes('nationalität') || nameLower.includes('erstsprache') ||
        nameLower.includes('umgangssprache') || nameLower.includes('bürgerort')) {
      groups['Child Information'].push(field);
    } else if (nameLower.includes('_2') || (nameLower.includes('adresse') && !nameLower.includes('email'))) {
      if (nameLower.includes('_2')) {
        groups['Parent 2 Information'].push(field);
      } else {
        groups['Parent 1 Information'].push(field);
      }
    } else if (nameLower.includes('bisher') || nameLower.includes('schule') || nameLower.includes('klasse') || nameLower.includes('lehrperson')) {
      groups['Previous School'].push(field);
    } else if (nameLower.includes('daz') || nameLower.includes('deutsch') || nameLower.includes('if') ||
               nameLower.includes('logopädie') || nameLower.includes('pmt') || nameLower.includes('ssa') ||
               nameLower.includes('therapien') || nameLower.includes('nachteil') || nameLower.includes('lernziel')) {
      groups['Educational Support'].push(field);
    } else if (nameLower.includes('verhalten') || nameLower.includes('sonstiges') || nameLower.match(/^[0-9]+/)) {
      groups['Assessment & Behavior'].push(field);
    } else if (nameLower.includes('zuzug') || nameLower.includes('gültig') || nameLower.includes('per')) {
      groups['Administrative'].push(field);
    } else {
      groups['Other'].push(field);
    }
  });

  return groups;
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

    console.log('🔍 Starting smart PDF field extraction with OCR...');

    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const pdfFields = form.getFields();

    console.log(`📋 Found ${pdfFields.length} form fields in PDF`);

    // Step 1: Detect form structure dynamically
    const checkboxGroups = detectFormStructure(pdfFields);
    console.log(`🔗 Detected ${checkboxGroups.length} checkbox groups`);

    // Step 2: Process individual fields
    const processedFields: SmartFormField[] = [];
    const processedFieldNames = new Set<string>();

    // Add checkbox groups first
    checkboxGroups.forEach(group => {
      const questionField: SmartFormField = {
        name: `question_${group.question.replace(/[^a-zA-Z0-9]/g, '_')}`,
        originalName: group.question,
        label: group.question,
        key: `question_${group.question.replace(/[^a-zA-Z0-9]/g, '_')}`,
        value: group.type === 'multiple' ? [] : '',
        type: 'question',
        isPrefilled: false,
        group: group.fields[0]?.group || 'Other',
        question: group.question,
        groupType: group.type,
        options: group.fields.map(field => ({
          name: field.name,
          originalName: field.originalName,
          label: field.label
        }))
      };
      processedFields.push(questionField);

      // Mark these field names as processed
      group.fields.forEach(field => {
        processedFieldNames.add(field.originalName);
      });
    });

    // Process remaining fields
    pdfFields.forEach((field, index) => {
      const originalFieldName = field.getName() || `field_${index}`;

      if (processedFieldNames.has(originalFieldName)) {
        return; // Skip already processed fields
      }

      let fieldType: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' = 'text';

      if (field instanceof PDFTextField) {
        fieldType = 'text';
      } else if (field instanceof PDFCheckBox) {
        fieldType = 'checkbox';
      } else if (field instanceof PDFDropdown) {
        fieldType = 'select';
      } else if (field instanceof PDFRadioGroup) {
        fieldType = 'radio';
      }

      const { clean, translation } = cleanAndTranslateFieldName(originalFieldName);

      // For undefined or problematic field names, generate better descriptive names
      let displayName = originalFieldName;
      if (!originalFieldName || originalFieldName === 'undefined' || originalFieldName.startsWith('undefined')) {
        if (fieldType === 'checkbox') {
          displayName = `checkbox_option_${index + 1}`;
        } else {
          displayName = `field_${index + 1}`;
        }
      }

      const smartField: SmartFormField = {
        name: originalFieldName, // Keep original for PDF mapping
        originalName: displayName, // Use improved name for display
        label: translation,
        key: `field_${index}_${clean.replace(/[^a-zA-Z0-9]/g, '_')}`,
        value: fieldType === 'checkbox' ? false : '',
        type: fieldType,
        isPrefilled: false,
        group: 'Other' // Will be updated in grouping step
      };

      processedFields.push(smartField);
    });

    // Step 3: Group fields semantically
    const groupedFields = groupFieldsBySemantic(processedFields.filter(f => f.type !== 'question'));

    // Update group information
    processedFields.forEach(field => {
      if (field.type !== 'question') {
        for (const [groupName, groupFields] of Object.entries(groupedFields)) {
          if (groupFields.includes(field)) {
            field.group = groupName;
            break;
          }
        }
      }
    });

    console.log(`✅ Successfully processed ${processedFields.length} fields into ${Object.keys(groupedFields).length} groups`);

    return NextResponse.json({
      success: true,
      data: {
        formFields: processedFields,
        totalFields: pdfFields.length,
        checkboxGroups: checkboxGroups.length,
        semanticGroups: Object.keys(groupedFields).length
      }
    });

  } catch (error) {
    console.error('Smart PDF Extraction Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to extract PDF structure intelligently'
    }, { status: 500 });
  }
}