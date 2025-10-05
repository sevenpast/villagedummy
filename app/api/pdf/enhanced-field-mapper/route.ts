import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 Enhanced Field Mapper API called');
    
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

    // Enhanced field mapping with strict rules
    const enhancedFields = fields
      .map((field, index) => {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;
        
        // STRICT RULE 1: Ignore fields that are just numbers, enumeration marks, or decorative lines
        if (fieldName.match(/^[0-9_]+$/) || fieldName === '1' || fieldName === '2' || fieldName === '1_2' || fieldName === '2_2' || fieldName === '3' || fieldName === '3_2') {
          console.log(`🚫 Skipping field: ${fieldName} (matches exclusion pattern)`);
          return null;
        }
        
        // STRICT RULE 2: Skip undefined fields without clear context
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
        
        // Enhanced field mapping with comprehensive Swiss form translations
        const fieldMappings: { [key: string]: any } = {
          // Child Information - Core Fields
          'Name': { name: 'childLastName', label: 'Last Name', type: 'text', required: true, context: 'Child' },
          'Vorname': { name: 'childFirstName', label: 'First Name', type: 'text', required: true, context: 'Child' },
          'Geburtsdatum': { name: 'childBirthDate', label: 'Date of Birth', type: 'date', required: true, context: 'Child' },
          'Geschlecht': { name: 'childGender', label: 'Gender', type: 'radio', required: true, context: 'Child' },
          'männlich': { name: 'childGenderMale', label: 'Male', type: 'radio', context: 'Child' },
          'weiblich': { name: 'childGenderFemale', label: 'Female', type: 'radio', context: 'Child' },
          'Staatsangehörigkeit': { name: 'childNationality', label: 'Nationality', type: 'text', required: true, context: 'Child' },
          'Nationalität': { name: 'childNationality', label: 'Nationality', type: 'text', required: true, context: 'Child' },
          'Geburtsort': { name: 'childBirthPlace', label: 'Place of Birth', type: 'text', context: 'Child' },
          'Bürgerort': { name: 'childBirthPlace', label: 'Place of Birth', type: 'text', context: 'Child' },
          'Religion': { name: 'childReligion', label: 'Religion', type: 'text', context: 'Child' },
          
          // Language Information
          'Umgangssprache in der Familie': { name: 'familyLanguage', label: 'Language Spoken in Family', type: 'text', required: true, context: 'Language' },
          'Deutschkenntnisse': { name: 'germanSkills', label: 'German Language Skills', type: 'text', context: 'Language' },
          'Muttersprache': { name: 'motherTongue', label: 'Mother Tongue', type: 'text', context: 'Language' },
          'Erstsprache': { name: 'firstLanguage', label: 'First Language', type: 'text', context: 'Language' },
          'Zweitsprache': { name: 'secondLanguage', label: 'Second Language', type: 'text', context: 'Language' },
          'Drittsprache': { name: 'thirdLanguage', label: 'Third Language', type: 'text', context: 'Language' },
          'Deutschkenntnisse Muttersprache Zweit oder Drittsprache etc': { 
            name: 'germanSkillsDetailed', 
            label: 'German Skills: Mother Tongue, Second or Third Language etc', 
            type: 'text', 
            context: 'Language' 
          },
          
          // Father Information
          'Name_2': { name: 'fatherLastName', label: 'Father Last Name', type: 'text', required: true, context: 'Father' },
          'Vorname_2': { name: 'fatherFirstName', label: 'Father First Name', type: 'text', required: true, context: 'Father' },
          'Geburtsdatum_2': { name: 'fatherBirthDate', label: 'Father Date of Birth', type: 'date', context: 'Father' },
          'Staatsangehörigkeit_2': { name: 'fatherNationality', label: 'Father Nationality', type: 'text', context: 'Father' },
          'Nationalität_2': { name: 'fatherNationality', label: 'Father Nationality', type: 'text', context: 'Father' },
          'Beruf': { name: 'fatherProfession', label: 'Father Profession', type: 'text', context: 'Father' },
          
          // Mother Information
          'Name_3': { name: 'motherLastName', label: 'Mother Last Name', type: 'text', required: true, context: 'Mother' },
          'Vorname_3': { name: 'motherFirstName', label: 'Mother First Name', type: 'text', required: true, context: 'Mother' },
          'Geburtsdatum_3': { name: 'motherBirthDate', label: 'Mother Date of Birth', type: 'date', context: 'Mother' },
          'Staatsangehörigkeit_3': { name: 'motherNationality', label: 'Mother Nationality', type: 'text', context: 'Mother' },
          'Nationalität_3': { name: 'motherNationality', label: 'Mother Nationality', type: 'text', context: 'Mother' },
          'Beruf_2': { name: 'motherProfession', label: 'Mother Profession', type: 'text', context: 'Mother' },
          
          // Address Information
          'Adresse': { name: 'address', label: 'Address', type: 'text', required: true, context: 'Address' },
          'Adresse_2': { name: 'addressLine2', label: 'Address Line 2', type: 'text', context: 'Address' },
          'Strasse bisher': { name: 'previousStreet', label: 'Previous Street', type: 'text', context: 'Address' },
          'Ort  Land bisher': { name: 'previousCityCountry', label: 'Previous City/Country', type: 'text', context: 'Address' },
          'Adresse gültig bis': { name: 'addressValidUntil', label: 'Address Valid Until', type: 'date', context: 'Address' },
          
          // Contact Information
          'Mobile': { name: 'mobilePhone', label: 'Mobile Phone', type: 'tel', validation: 'tel', context: 'Contact' },
          'Mobile_2': { name: 'mobilePhone2', label: 'Mobile Phone 2', type: 'tel', validation: 'tel', context: 'Contact' },
          'EMail': { name: 'email', label: 'Email', type: 'email', validation: 'email', context: 'Contact' },
          'EMail_2': { name: 'email2', label: 'Email 2', type: 'email', validation: 'email', context: 'Contact' },
          'Telefonnummer': { name: 'phone', label: 'Phone Number', type: 'tel', validation: 'tel', context: 'Contact' },
          'EMailAdresse': { name: 'emailAddress', label: 'Email Address', type: 'email', validation: 'email', context: 'Contact' },
          
          // School Information
          'Klasse bisher': { name: 'previousClass', label: 'Previous Class', type: 'text', context: 'School' },
          'Name Lehrperson bisher': { name: 'previousTeacherName', label: 'Previous Teacher Name', type: 'text', context: 'School' },
          'Zuzug nach Wallisellen per': { name: 'moveToWallisellenDate', label: 'Move to Wallisellen Date', type: 'date', context: 'School' },
          'Name und Vorname des Kindes 1': { name: 'child1FullName', label: 'Child 1 Full Name', type: 'text', context: 'School' },
          'Name und Vorname des Kindes 2': { name: 'child2FullName', label: 'Child 2 Full Name', type: 'text', context: 'School' },
          'Name und Ort der Schule': { name: 'schoolNameLocation', label: 'School Name and Location', type: 'text', context: 'School' },
          
          // Special Needs and Support
          'DaZ seit': { name: 'dazSince', label: 'German as Second Language Since', type: 'date', context: 'Support' },
          'IF Bereiche': { name: 'ifAreas', label: 'IF Areas', type: 'text', context: 'Support' },
          'Nachteilsausgleich in Form von': { name: 'disadvantageCompensation', label: 'Disadvantage Compensation in Form of', type: 'text', context: 'Support' },
          'Lernzielbefreiung': { name: 'learningObjectiveExemption', label: 'Learning Objective Exemption', type: 'text', context: 'Support' },
          'ISR Bereich': { name: 'isrArea', label: 'ISR Area', type: 'text', context: 'Support' },
          'Begabtenund Begabungsförderung': { name: 'giftedTalentPromotion', label: 'Gifted and Talent Promotion', type: 'text', context: 'Support' },
          'SSA': { name: 'ssa', label: 'SSA', type: 'text', context: 'Support' },
          
          // Therapy Information
          'Logopädie seit': { name: 'speechTherapySince', label: 'Speech Therapy Since', type: 'date', context: 'Therapy' },
          'PMT seit': { name: 'pmtSince', label: 'PMT Since', type: 'date', context: 'Therapy' },
          'andere Therapien': { name: 'otherTherapies', label: 'Other Therapies', type: 'text', context: 'Therapy' },
          
          // Behavior and Development
          'Arbeitsund Lernverhalten': { name: 'workLearningBehavior', label: 'Work and Learning Behavior', type: 'text', context: 'Behavior' },
          'Sozialverhalten': { name: 'socialBehavior', label: 'Social Behavior', type: 'text', context: 'Behavior' },
          'Sonstiges': { name: 'other', label: 'Other', type: 'text', context: 'General' },
          
          // Emergency Contacts
          'Vorname_4': { name: 'contact1FirstName', label: 'Emergency Contact 1 First Name', type: 'text', context: 'Emergency' },
          'Vorname_5': { name: 'contact2FirstName', label: 'Emergency Contact 2 First Name', type: 'text', context: 'Emergency' },
          'Name_4': { name: 'contactName', label: 'Contact Name', type: 'text', context: 'Emergency' },
          'Name_5': { name: 'contact1LastName', label: 'Emergency Contact 1 Last Name', type: 'text', context: 'Emergency' },
          'Name_6': { name: 'contact2LastName', label: 'Emergency Contact 2 Last Name', type: 'text', context: 'Emergency' },
          'Funktion': { name: 'contact1Function', label: 'Emergency Contact 1 Function', type: 'text', context: 'Emergency' },
          'Funktion_2': { name: 'contact2Function', label: 'Emergency Contact 2 Function', type: 'text', context: 'Emergency' },
          'Telefonnummer_2': { name: 'contact1Phone', label: 'Emergency Contact 1 Phone', type: 'tel', validation: 'tel', context: 'Emergency' },
          'Telefonnummer_3': { name: 'contact2Phone', label: 'Emergency Contact 2 Phone', type: 'tel', validation: 'tel', context: 'Emergency' },
          'EMailAdresse_2': { name: 'contact1Email', label: 'Emergency Contact 1 Email', type: 'email', validation: 'email', context: 'Emergency' },
          'EMailAdresse_3': { name: 'contact2Email', label: 'Emergency Contact 2 Email', type: 'email', validation: 'email', context: 'Emergency' }
        };
        
        // Apply field mapping
        let intelligentFieldName = fieldName;
        let originalLabel = fieldName;
        let translatedLabel = fieldName;
        let required = false;
        let validation = 'text';
        let placeholder = fieldName;
        let options: any[] = [];
        let context = 'General';
        
        if (fieldMappings[fieldName]) {
          const mapping = fieldMappings[fieldName];
          intelligentFieldName = mapping.name;
          originalLabel = fieldName;
          translatedLabel = mapping.label;
          mappedFieldType = mapping.type || 'text';
          required = mapping.required || false;
          validation = mapping.validation || 'text';
          options = mapping.options || [];
          placeholder = mapping.label;
          context = mapping.context || 'General';
        } else {
          // Handle undefined checkboxes with context
          if (fieldName.startsWith('undefined') && fieldType.includes('CheckBox')) {
            // Map undefined checkboxes based on their position and context
            if (index >= 9 && index <= 17) {
              // These are likely therapy/support checkboxes
              const therapyOptions = [
                'Logopädie', 'Psychomotorik', 'Integrative Förderung', 'DaZ-Unterricht',
                'Begabtenförderung', 'Sonderschulung', 'SSA', 'andere Therapien'
              ];
              const therapyIndex = index - 9;
              if (therapyIndex < therapyOptions.length) {
                intelligentFieldName = `therapy_${therapyIndex + 1}`;
                originalLabel = therapyOptions[therapyIndex];
                translatedLabel = therapyOptions[therapyIndex];
                mappedFieldType = 'checkbox';
                validation = 'text';
                context = 'Therapy';
              }
            } else if (index >= 19 && index <= 24) {
              // These are likely additional support checkboxes
              const supportOptions = [
                'Nachteilsausgleich', 'Lernzielbefreiung', 'ISR Bereich', 'IF Bereiche', 'SSA'
              ];
              const supportIndex = index - 19;
              if (supportIndex < supportOptions.length) {
                intelligentFieldName = `support_${supportIndex + 1}`;
                originalLabel = supportOptions[supportIndex];
                translatedLabel = supportOptions[supportIndex];
                mappedFieldType = 'checkbox';
                validation = 'text';
                context = 'Support';
              }
            } else {
              // Skip undefined checkboxes without clear context
              console.log(`🚫 Skipping undefined checkbox: ${fieldName} at index ${index} (no clear context)`);
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
              'Staatsangehörigkeit': 'Nationality', 'Nationalität': 'Nationality', 'Geburtsort': 'Place of Birth',
              'Religion': 'Religion', 'Beruf': 'Profession', 'Adresse': 'Address',
              'Mobile': 'Mobile Phone', 'EMail': 'Email', 'Telefonnummer': 'Phone Number',
              'EMailAdresse': 'Email Address', 'Strasse': 'Street', 'Ort': 'City',
              'Land': 'Country', 'Klasse': 'Class', 'Lehrperson': 'Teacher',
              'Zuzug': 'Move', 'per': 'Date', 'Kindes': 'Child', 'Schule': 'School',
              'Deutschkenntnisse': 'German Skills', 'Muttersprache': 'Mother Tongue',
              'Erstsprache': 'First Language', 'Zweitsprache': 'Second Language', 'Drittsprache': 'Third Language',
              'Umgangssprache': 'Language', 'Familie': 'Family', 'DaZ': 'German as Second Language',
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
        
        // Estimate position based on field index and PDF dimensions
        const estimatedX = 100 + (index % 3) * 200;
        const estimatedY = 100 + Math.floor(index / 3) * 50;
        
        return {
          fieldName: intelligentFieldName,
          originalLabel: originalLabel,
          translatedLabel: translatedLabel,
          fieldType: mappedFieldType,
          position: { x: estimatedX, y: estimatedY },
          size: { width: 150, height: 25 },
          required: required,
          options: options,
          validation: validation,
          placeholder: placeholder,
          context: context
        };
      })
      .filter(field => field !== null); // Remove null entries
    
    console.log(`✅ Enhanced mapping completed: ${enhancedFields.length} fields processed`);
    
    return NextResponse.json({
      success: true,
      fields: enhancedFields,
      totalFields: enhancedFields.length,
      pdfDimensions: { width, height }
    });
    
  } catch (error) {
    console.error('❌ Enhanced field mapping failed:', error);
    return NextResponse.json({ 
      error: 'Enhanced field mapping failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
