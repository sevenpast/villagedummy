import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Precise Field Mapper API called');
    
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📄 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Load PDF and extract fields
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log(`📏 PDF dimensions: ${width} x ${height}`);
    
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log(`📋 Found ${fields.length} technical form fields`);

    // PRECISE field mapping for Swiss kindergarten/school forms
    const preciseFieldMappings: { [key: string]: any } = {
      // === CHILD PERSONAL INFORMATION ===
      'Name': { 
        name: 'childLastName', 
        label: 'Last Name', 
        type: 'text', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 100, y: 200 },
        size: { width: 120, height: 20 }
      },
      'Vorname': { 
        name: 'childFirstName', 
        label: 'First Name', 
        type: 'text', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 250, y: 200 },
        size: { width: 120, height: 20 }
      },
      'Geburtsdatum': { 
        name: 'childBirthDate', 
        label: 'Date of Birth', 
        type: 'date', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 400, y: 200 },
        size: { width: 100, height: 20 }
      },
      'Geschlecht': { 
        name: 'childGender', 
        label: 'Gender', 
        type: 'radio', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 100, y: 250 },
        size: { width: 200, height: 20 }
      },
      'männlich': { 
        name: 'childGenderMale', 
        label: 'Male', 
        type: 'radio', 
        context: 'Child Personal Info',
        position: { x: 120, y: 250 },
        size: { width: 15, height: 15 }
      },
      'weiblich': { 
        name: 'childGenderFemale', 
        label: 'Female', 
        type: 'radio', 
        context: 'Child Personal Info',
        position: { x: 200, y: 250 },
        size: { width: 15, height: 15 }
      },
      'Staatsangehörigkeit': { 
        name: 'childNationality', 
        label: 'Nationality', 
        type: 'text', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 100, y: 300 },
        size: { width: 120, height: 20 }
      },
      'Nationalität': { 
        name: 'childNationality', 
        label: 'Nationality', 
        type: 'text', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 100, y: 300 },
        size: { width: 120, height: 20 }
      },
      'Geburtsort': { 
        name: 'childBirthPlace', 
        label: 'Place of Birth', 
        type: 'text', 
        context: 'Child Personal Info',
        position: { x: 250, y: 300 },
        size: { width: 120, height: 20 }
      },
      'Bürgerort': { 
        name: 'childBirthPlace', 
        label: 'Place of Birth', 
        type: 'text', 
        context: 'Child Personal Info',
        position: { x: 250, y: 300 },
        size: { width: 120, height: 20 }
      },
      
      // === LANGUAGE INFORMATION ===
      'Umgangssprache in der Familie': { 
        name: 'familyLanguage', 
        label: 'Language Spoken in Family', 
        type: 'text', 
        required: true, 
        context: 'Language Info',
        position: { x: 100, y: 350 },
        size: { width: 200, height: 20 }
      },
      'Deutschkenntnisse': { 
        name: 'germanSkills', 
        label: 'German Language Skills', 
        type: 'text', 
        context: 'Language Info',
        position: { x: 100, y: 400 },
        size: { width: 200, height: 20 }
      },
      'Muttersprache': { 
        name: 'motherTongue', 
        label: 'Mother Tongue', 
        type: 'text', 
        context: 'Language Info',
        position: { x: 100, y: 450 },
        size: { width: 150, height: 20 }
      },
      'Erstsprache': { 
        name: 'firstLanguage', 
        label: 'First Language', 
        type: 'text', 
        context: 'Language Info',
        position: { x: 100, y: 450 },
        size: { width: 150, height: 20 }
      },
      
      // === FATHER INFORMATION ===
      'Name_2': { 
        name: 'fatherLastName', 
        label: 'Father Last Name', 
        type: 'text', 
        required: true, 
        context: 'Father Info',
        position: { x: 100, y: 500 },
        size: { width: 120, height: 20 }
      },
      'Vorname_2': { 
        name: 'fatherFirstName', 
        label: 'Father First Name', 
        type: 'text', 
        required: true, 
        context: 'Father Info',
        position: { x: 250, y: 500 },
        size: { width: 120, height: 20 }
      },
      'Geburtsdatum_2': { 
        name: 'fatherBirthDate', 
        label: 'Father Date of Birth', 
        type: 'date', 
        context: 'Father Info',
        position: { x: 400, y: 500 },
        size: { width: 100, height: 20 }
      },
      'Staatsangehörigkeit_2': { 
        name: 'fatherNationality', 
        label: 'Father Nationality', 
        type: 'text', 
        context: 'Father Info',
        position: { x: 100, y: 550 },
        size: { width: 120, height: 20 }
      },
      'Nationalität_2': { 
        name: 'fatherNationality', 
        label: 'Father Nationality', 
        type: 'text', 
        context: 'Father Info',
        position: { x: 100, y: 550 },
        size: { width: 120, height: 20 }
      },
      'Beruf': { 
        name: 'fatherProfession', 
        label: 'Father Profession', 
        type: 'text', 
        context: 'Father Info',
        position: { x: 250, y: 550 },
        size: { width: 150, height: 20 }
      },
      
      // === MOTHER INFORMATION ===
      'Name_3': { 
        name: 'motherLastName', 
        label: 'Mother Last Name', 
        type: 'text', 
        required: true, 
        context: 'Mother Info',
        position: { x: 100, y: 600 },
        size: { width: 120, height: 20 }
      },
      'Vorname_3': { 
        name: 'motherFirstName', 
        label: 'Mother First Name', 
        type: 'text', 
        required: true, 
        context: 'Mother Info',
        position: { x: 250, y: 600 },
        size: { width: 120, height: 20 }
      },
      'Geburtsdatum_3': { 
        name: 'motherBirthDate', 
        label: 'Mother Date of Birth', 
        type: 'date', 
        context: 'Mother Info',
        position: { x: 400, y: 600 },
        size: { width: 100, height: 20 }
      },
      'Staatsangehörigkeit_3': { 
        name: 'motherNationality', 
        label: 'Mother Nationality', 
        type: 'text', 
        context: 'Mother Info',
        position: { x: 100, y: 650 },
        size: { width: 120, height: 20 }
      },
      'Nationalität_3': { 
        name: 'motherNationality', 
        label: 'Mother Nationality', 
        type: 'text', 
        context: 'Mother Info',
        position: { x: 100, y: 650 },
        size: { width: 120, height: 20 }
      },
      'Beruf_2': { 
        name: 'motherProfession', 
        label: 'Mother Profession', 
        type: 'text', 
        context: 'Mother Info',
        position: { x: 250, y: 650 },
        size: { width: 150, height: 20 }
      },
      
      // === ADDRESS INFORMATION ===
      'Adresse': { 
        name: 'address', 
        label: 'Address', 
        type: 'text', 
        required: true, 
        context: 'Address Info',
        position: { x: 100, y: 700 },
        size: { width: 200, height: 20 }
      },
      'Adresse_2': { 
        name: 'addressLine2', 
        label: 'Address Line 2', 
        type: 'text', 
        context: 'Address Info',
        position: { x: 100, y: 730 },
        size: { width: 200, height: 20 }
      },
      'Strasse bisher': { 
        name: 'previousStreet', 
        label: 'Previous Street', 
        type: 'text', 
        context: 'Address Info',
        position: { x: 100, y: 760 },
        size: { width: 200, height: 20 }
      },
      'Ort  Land bisher': { 
        name: 'previousCityCountry', 
        label: 'Previous City/Country', 
        type: 'text', 
        context: 'Address Info',
        position: { x: 100, y: 790 },
        size: { width: 200, height: 20 }
      },
      
      // === CONTACT INFORMATION ===
      'Mobile': { 
        name: 'mobilePhone', 
        label: 'Mobile Phone', 
        type: 'tel', 
        validation: 'tel', 
        context: 'Contact Info',
        position: { x: 100, y: 820 },
        size: { width: 120, height: 20 }
      },
      'Mobile_2': { 
        name: 'mobilePhone2', 
        label: 'Mobile Phone 2', 
        type: 'tel', 
        validation: 'tel', 
        context: 'Contact Info',
        position: { x: 250, y: 820 },
        size: { width: 120, height: 20 }
      },
      'EMail': { 
        name: 'email', 
        label: 'Email', 
        type: 'email', 
        validation: 'email', 
        context: 'Contact Info',
        position: { x: 100, y: 850 },
        size: { width: 200, height: 20 }
      },
      'EMail_2': { 
        name: 'email2', 
        label: 'Email 2', 
        type: 'email', 
        validation: 'email', 
        context: 'Contact Info',
        position: { x: 100, y: 880 },
        size: { width: 200, height: 20 }
      },
      'Telefonnummer': { 
        name: 'phone', 
        label: 'Phone Number', 
        type: 'tel', 
        validation: 'tel', 
        context: 'Contact Info',
        position: { x: 100, y: 910 },
        size: { width: 120, height: 20 }
      },
      'EMailAdresse': { 
        name: 'emailAddress', 
        label: 'Email Address', 
        type: 'email', 
        validation: 'email', 
        context: 'Contact Info',
        position: { x: 100, y: 940 },
        size: { width: 200, height: 20 }
      },
      
      // === THERAPY AND SUPPORT SERVICES ===
      'Logopädie': { 
        name: 'speechTherapy', 
        label: 'Speech Therapy', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 100, y: 1000 },
        size: { width: 15, height: 15 }
      },
      'Psychomotorik': { 
        name: 'psychomotorTherapy', 
        label: 'Psychomotor Therapy', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 200, y: 1000 },
        size: { width: 15, height: 15 }
      },
      'DaZ-Unterricht': { 
        name: 'germanAsSecondLanguage', 
        label: 'German as Second Language', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 300, y: 1000 },
        size: { width: 15, height: 15 }
      },
      'Integrative Förderung': { 
        name: 'integrativeSupport', 
        label: 'Integrative Support', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 100, y: 1030 },
        size: { width: 15, height: 15 }
      },
      'Begabtenförderung': { 
        name: 'giftedSupport', 
        label: 'Gifted Support', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 200, y: 1030 },
        size: { width: 15, height: 15 }
      },
      'Sonderschulung': { 
        name: 'specialEducation', 
        label: 'Special Education', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 300, y: 1030 },
        size: { width: 15, height: 15 }
      },
      'andere Therapien': { 
        name: 'otherTherapies', 
        label: 'Other Therapies', 
        type: 'text', 
        context: 'Therapy Services',
        position: { x: 100, y: 1060 },
        size: { width: 200, height: 20 }
      },
      
      // === SPECIAL NEEDS AND SUPPORT ===
      'Nachteilsausgleich': { 
        name: 'disadvantageCompensation', 
        label: 'Disadvantage Compensation', 
        type: 'checkbox', 
        context: 'Special Needs',
        position: { x: 100, y: 1100 },
        size: { width: 15, height: 15 }
      },
      'Lernzielbefreiung': { 
        name: 'learningObjectiveExemption', 
        label: 'Learning Objective Exemption', 
        type: 'checkbox', 
        context: 'Special Needs',
        position: { x: 200, y: 1100 },
        size: { width: 15, height: 15 }
      },
      'ISR Bereich': { 
        name: 'isrArea', 
        label: 'ISR Area', 
        type: 'text', 
        context: 'Special Needs',
        position: { x: 100, y: 1130 },
        size: { width: 150, height: 20 }
      },
      'IF Bereiche': { 
        name: 'ifAreas', 
        label: 'IF Areas', 
        type: 'text', 
        context: 'Special Needs',
        position: { x: 250, y: 1130 },
        size: { width: 150, height: 20 }
      },
      'SSA': { 
        name: 'ssa', 
        label: 'SSA', 
        type: 'text', 
        context: 'Special Needs',
        position: { x: 100, y: 1160 },
        size: { width: 100, height: 20 }
      },
      
      // === ADDITIONAL MISSING FIELDS ===
      'Geschlecht': { 
        name: 'childGender', 
        label: 'Gender', 
        type: 'radio', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 100, y: 250 },
        size: { width: 200, height: 20 }
      },
      'Staatsangehörigkeit': { 
        name: 'childNationality', 
        label: 'Nationality', 
        type: 'text', 
        required: true, 
        context: 'Child Personal Info',
        position: { x: 100, y: 300 },
        size: { width: 120, height: 20 }
      },
      'Geburtsdatum_2': { 
        name: 'fatherBirthDate', 
        label: 'Father Date of Birth', 
        type: 'date', 
        context: 'Father Info',
        position: { x: 400, y: 500 },
        size: { width: 100, height: 20 }
      },
      'Geburtsdatum_3': { 
        name: 'motherBirthDate', 
        label: 'Mother Date of Birth', 
        type: 'date', 
        context: 'Mother Info',
        position: { x: 400, y: 600 },
        size: { width: 100, height: 20 }
      },
      'Umgangssprache in der Familie': { 
        name: 'familyLanguage', 
        label: 'Language Spoken in Family', 
        type: 'text', 
        required: true, 
        context: 'Language Info',
        position: { x: 100, y: 350 },
        size: { width: 200, height: 20 }
      },
      'Deutschkenntnisse': { 
        name: 'germanSkills', 
        label: 'German Language Skills', 
        type: 'text', 
        context: 'Language Info',
        position: { x: 100, y: 400 },
        size: { width: 200, height: 20 }
      },
      'Muttersprache': { 
        name: 'motherTongue', 
        label: 'Mother Tongue', 
        type: 'text', 
        context: 'Language Info',
        position: { x: 100, y: 450 },
        size: { width: 150, height: 20 }
      },
      'Logopädie': { 
        name: 'speechTherapy', 
        label: 'Speech Therapy', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 100, y: 1000 },
        size: { width: 15, height: 15 }
      },
      'Psychomotorik': { 
        name: 'psychomotorTherapy', 
        label: 'Psychomotor Therapy', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 200, y: 1000 },
        size: { width: 15, height: 15 }
      },
      'DaZ-Unterricht': { 
        name: 'germanAsSecondLanguage', 
        label: 'German as Second Language', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 300, y: 1000 },
        size: { width: 15, height: 15 }
      },
      'Integrative Förderung': { 
        name: 'integrativeSupport', 
        label: 'Integrative Support', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 100, y: 1030 },
        size: { width: 15, height: 15 }
      },
      'Begabtenförderung': { 
        name: 'giftedSupport', 
        label: 'Gifted Support', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 200, y: 1030 },
        size: { width: 15, height: 15 }
      },
      'Sonderschulung': { 
        name: 'specialEducation', 
        label: 'Special Education', 
        type: 'checkbox', 
        context: 'Therapy Services',
        position: { x: 300, y: 1030 },
        size: { width: 15, height: 15 }
      },
      'Nachteilsausgleich': { 
        name: 'disadvantageCompensation', 
        label: 'Disadvantage Compensation', 
        type: 'checkbox', 
        context: 'Special Needs',
        position: { x: 100, y: 1100 },
        size: { width: 15, height: 15 }
      },
      'Lernzielbefreiung': { 
        name: 'learningObjectiveExemption', 
        label: 'Learning Objective Exemption', 
        type: 'checkbox', 
        context: 'Special Needs',
        position: { x: 200, y: 1100 },
        size: { width: 15, height: 15 }
      }
    };

    // Process fields with precise mapping
    const preciseFields = fields
      .map((field, index) => {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;
        
        // Skip fields that are just numbers or decorative elements
        if (fieldName.match(/^[0-9_]+$/) || 
            fieldName === '1' || fieldName === '2' || fieldName === '1_2' || 
            fieldName === '2_2' || fieldName === '3' || fieldName === '3_2') {
          console.log(`🚫 Skipping field: ${fieldName} (decorative element)`);
          return null;
        }
        
        // Skip undefined fields without clear context (but keep checkboxes for mapping)
        if (fieldName.startsWith('undefined') && !fieldType.includes('CheckBox')) {
          console.log(`🚫 Skipping field: ${fieldName} (undefined without context)`);
          return null;
        }
        
        // Determine field type
        let mappedFieldType = 'text';
        if (fieldType.includes('CheckBox')) {
          mappedFieldType = 'checkbox';
        } else if (fieldType.includes('RadioGroup')) {
          mappedFieldType = 'radio';
        } else if (fieldType.includes('Dropdown')) {
          mappedFieldType = 'select';
        }
        
        // Apply precise field mapping
        let intelligentFieldName = fieldName;
        let originalLabel = fieldName;
        let translatedLabel = fieldName;
        let required = false;
        let validation = 'text';
        let placeholder = fieldName;
        let context = 'General';
        let position = { x: 100 + (index % 3) * 200, y: 100 + Math.floor(index / 3) * 50 };
        let size = { width: 150, height: 25 };
        
        if (preciseFieldMappings[fieldName]) {
          const mapping = preciseFieldMappings[fieldName];
          intelligentFieldName = mapping.name;
          originalLabel = fieldName;
          translatedLabel = mapping.label;
          mappedFieldType = mapping.type || 'text';
          required = mapping.required || false;
          validation = mapping.validation || 'text';
          placeholder = mapping.label;
          context = mapping.context || 'General';
          position = mapping.position || position;
          size = mapping.size || size;
          
          console.log(`✅ Mapped: ${fieldName} → ${mapping.label} (${mapping.context})`);
        } else {
          // Handle undefined checkboxes with intelligent context detection
          if (fieldName.startsWith('undefined') && fieldType.includes('CheckBox')) {
            // Map undefined checkboxes based on their position and context
            const checkboxMappings = [
              // Therapy and support checkboxes (based on typical Swiss form layout)
              { name: 'speechTherapy', label: 'Speech Therapy (Logopädie)', context: 'Therapy Services' },
              { name: 'psychomotorTherapy', label: 'Psychomotor Therapy', context: 'Therapy Services' },
              { name: 'integrativeSupport', label: 'Integrative Support (IF)', context: 'Therapy Services' },
              { name: 'germanAsSecondLanguage', label: 'German as Second Language (DaZ)', context: 'Therapy Services' },
              { name: 'giftedSupport', label: 'Gifted Support', context: 'Therapy Services' },
              { name: 'specialEducation', label: 'Special Education', context: 'Therapy Services' },
              { name: 'disadvantageCompensation', label: 'Disadvantage Compensation', context: 'Special Needs' },
              { name: 'learningObjectiveExemption', label: 'Learning Objective Exemption', context: 'Special Needs' },
              { name: 'isrSupport', label: 'ISR Support', context: 'Special Needs' },
              { name: 'ssaSupport', label: 'SSA Support', context: 'Special Needs' },
              { name: 'otherSupport', label: 'Other Support', context: 'Special Needs' },
              { name: 'additionalTherapy1', label: 'Additional Therapy 1', context: 'Therapy Services' },
              { name: 'additionalTherapy2', label: 'Additional Therapy 2', context: 'Therapy Services' },
              { name: 'additionalTherapy3', label: 'Additional Therapy 3', context: 'Therapy Services' },
              { name: 'additionalTherapy4', label: 'Additional Therapy 4', context: 'Therapy Services' },
              { name: 'additionalTherapy5', label: 'Additional Therapy 5', context: 'Therapy Services' },
              { name: 'additionalTherapy6', label: 'Additional Therapy 6', context: 'Therapy Services' },
              { name: 'additionalTherapy7', label: 'Additional Therapy 7', context: 'Therapy Services' },
              { name: 'additionalTherapy8', label: 'Additional Therapy 8', context: 'Therapy Services' },
              { name: 'additionalTherapy9', label: 'Additional Therapy 9', context: 'Therapy Services' },
              { name: 'additionalTherapy10', label: 'Additional Therapy 10', context: 'Therapy Services' },
              { name: 'additionalTherapy11', label: 'Additional Therapy 11', context: 'Therapy Services' },
              { name: 'additionalTherapy12', label: 'Additional Therapy 12', context: 'Therapy Services' },
              { name: 'additionalTherapy13', label: 'Additional Therapy 13', context: 'Therapy Services' },
              { name: 'additionalTherapy14', label: 'Additional Therapy 14', context: 'Therapy Services' },
              { name: 'additionalTherapy15', label: 'Additional Therapy 15', context: 'Therapy Services' },
              { name: 'additionalTherapy16', label: 'Additional Therapy 16', context: 'Therapy Services' },
              { name: 'additionalTherapy17', label: 'Additional Therapy 17', context: 'Therapy Services' },
              { name: 'additionalTherapy18', label: 'Additional Therapy 18', context: 'Therapy Services' },
              { name: 'additionalTherapy19', label: 'Additional Therapy 19', context: 'Therapy Services' },
              { name: 'additionalTherapy20', label: 'Additional Therapy 20', context: 'Therapy Services' },
              { name: 'additionalTherapy21', label: 'Additional Therapy 21', context: 'Therapy Services' },
              { name: 'additionalTherapy22', label: 'Additional Therapy 22', context: 'Therapy Services' },
              { name: 'additionalTherapy23', label: 'Additional Therapy 23', context: 'Therapy Services' },
              { name: 'additionalTherapy24', label: 'Additional Therapy 24', context: 'Therapy Services' }
            ];
            
            // Extract index from undefined field name
            const match = fieldName.match(/undefined(?:_(\d+))?/);
            let checkboxIndex = 0;
            if (match && match[1]) {
              checkboxIndex = parseInt(match[1]) - 1;
            } else {
              // For "undefined" without number, use field index
              checkboxIndex = index;
            }
            
            if (checkboxIndex >= 0 && checkboxIndex < checkboxMappings.length) {
              const mapping = checkboxMappings[checkboxIndex];
              intelligentFieldName = mapping.name;
              originalLabel = fieldName;
              translatedLabel = mapping.label;
              mappedFieldType = 'checkbox';
              required = false;
              validation = 'text';
              placeholder = mapping.label;
              context = mapping.context;
              
              // Estimate position for checkboxes
              position = { 
                x: 100 + (checkboxIndex % 4) * 150, 
                y: 1000 + Math.floor(checkboxIndex / 4) * 30 
              };
              size = { width: 15, height: 15 };
              
              console.log(`✅ Mapped undefined checkbox: ${fieldName} → ${mapping.label} (${mapping.context})`);
            } else {
              console.log(`🚫 Skipping undefined checkbox: ${fieldName} at index ${index} (no mapping available)`);
              return null;
            }
          } else {
            // For other unknown fields, create intelligent names
            intelligentFieldName = fieldName
              .replace(/[^a-zA-Z0-9]/g, '')
              .replace(/^([a-z])/, (match) => match.toUpperCase());
            
            // Apply intelligent German to English translation
            const translations: { [key: string]: string } = {
              'Name': 'Last Name', 'Vorname': 'First Name', 'Geburtsdatum': 'Date of Birth',
              'Geschlecht': 'Gender', 'männlich': 'Male', 'weiblich': 'Female',
              'Staatsangehörigkeit': 'Nationality', 'Nationalität': 'Nationality', 
              'Geburtsort': 'Place of Birth', 'Bürgerort': 'Place of Birth',
              'Religion': 'Religion', 'Beruf': 'Profession', 'Adresse': 'Address',
              'Mobile': 'Mobile Phone', 'EMail': 'Email', 'Telefonnummer': 'Phone Number',
              'EMailAdresse': 'Email Address', 'Strasse': 'Street', 'Ort': 'City',
              'Land': 'Country', 'Klasse': 'Class', 'Lehrperson': 'Teacher',
              'Zuzug': 'Move', 'per': 'Date', 'Kindes': 'Child', 'Schule': 'School',
              'Deutschkenntnisse': 'German Skills', 'Muttersprache': 'Mother Tongue',
              'Erstsprache': 'First Language', 'Zweitsprache': 'Second Language', 
              'Drittsprache': 'Third Language', 'Umgangssprache': 'Language', 
              'Familie': 'Family', 'DaZ': 'German as Second Language',
              'seit': 'Since', 'Logopädie': 'Speech Therapy', 'PMT': 'PMT',
              'Therapien': 'Therapies', 'andere': 'Other', 'Arbeitsund': 'Work and',
              'Lernverhalten': 'Learning Behavior', 'Sozialverhalten': 'Social Behavior',
              'Sonstiges': 'Other', 'Funktion': 'Function', 'Begabtenund': 'Gifted and',
              'Begabungsförderung': 'Talent Promotion', 'Nachteilsausgleich': 'Disadvantage Compensation',
              'Lernzielbefreiung': 'Learning Objective Exemption', 'IF': 'IF',
              'Bereiche': 'Areas', 'ISR': 'ISR', 'Bereich': 'Area', 'SSA': 'SSA',
              'gültig': 'Valid', 'bis': 'Until', 'bisher': 'Previous', 'und': 'and',
              'oder': 'or', 'etc': 'etc', 'in': 'in', 'Form': 'Form', 'von': 'of'
            };
            
            let translatedText = fieldName;
            Object.entries(translations).forEach(([german, english]) => {
              translatedText = translatedText.replace(new RegExp(german, 'gi'), english);
            });
            
            translatedLabel = translatedText;
            originalLabel = fieldName;
            required = fieldName.toLowerCase().includes('name') || fieldName.toLowerCase().includes('datum');
            context = 'General';
          }
        }
        
        return {
          fieldName: intelligentFieldName,
          originalLabel: originalLabel,
          translatedLabel: translatedLabel,
          fieldType: mappedFieldType,
          position: position,
          size: size,
          required: required,
          validation: validation,
          placeholder: placeholder,
          context: context
        };
      })
      .filter(field => field !== null); // Remove null entries
    
    console.log(`✅ Precise mapping completed: ${preciseFields.length} fields processed`);
    
    return NextResponse.json({
      success: true,
      fields: preciseFields,
      totalFields: preciseFields.length,
      pdfDimensions: { width, height }
    });
    
  } catch (error) {
    console.error('❌ Precise field mapping failed:', error);
    return NextResponse.json({ 
      error: 'Precise field mapping failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
