import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import { ocrDetector } from './ocr-field-detector';
import { translateFormFieldWithContext, detectFieldType, extractContextHints } from './translation-service';
import { advancedOCRService } from './advanced-ocr-service';

interface FormFieldMapping {
  [key: string]: string;
}

interface AddressParts {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

// Helper function to parse address into components
function parseAddress(address: string): AddressParts {
  if (!address) {
    return { street: '', houseNumber: '', postalCode: '', city: '' };
  }

  // Try to parse Swiss address format: "Street Number, PostalCode City"
  const addressPattern = /^(.+?)\s+(\d+[a-zA-Z]?),?\s*(\d{4})\s+(.+)$/;
  const match = address.match(addressPattern);

  if (match) {
    return {
      street: `${match[1]} ${match[2]}`.trim(),
      houseNumber: match[2],
      postalCode: match[3],
      city: match[4].trim()
    };
  }

  // Fallback: try to extract postal code and city
  const fallbackPattern = /(\d{4})\s+(.+)$/;
  const fallbackMatch = address.match(fallbackPattern);

  if (fallbackMatch) {
    const beforePostal = address.replace(fallbackPattern, '').trim().replace(/,$/, '');
    return {
      street: beforePostal,
      houseNumber: '',
      postalCode: fallbackMatch[1],
      city: fallbackMatch[2].trim()
    };
  }

  // Last resort: return the full address as street
  return {
    street: address,
    houseNumber: '',
    postalCode: '',
    city: ''
  };
}

// Helper function to format dates in German format
function formatGermanDate(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    return date.toLocaleDateString('de-DE');
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
}

// Helper function to detect incorrect mappings based on context
function isIncorrectMapping(fieldName: string, pattern: string, mappedValue: string): boolean {
  // Check if we're trying to map a first name field to a last name value
  if (fieldName.includes('vorname') && mappedValue && !mappedValue.includes(' ')) {
    // If the mapped value looks like a last name (longer, capitalized)
    const isLikelyLastName = mappedValue.length > 2 && mappedValue !== mappedValue.toLowerCase();
    const isFromChildLastName = pattern.includes('last_name') || pattern.includes('nachname');

    if (isLikelyLastName && isFromChildLastName) {
      return true; // This is likely wrong - vorname should not get lastname
    }
  }

  // Check if we're trying to map a last name field to a first name value
  if ((fieldName.includes('name') && !fieldName.includes('vorname')) && mappedValue) {
    const isFromChildFirstName = pattern.includes('first_name') || pattern.includes('vorname');

    if (isFromChildFirstName && mappedValue.length <= 2) {
      return true; // This is likely wrong - name field should not get short first name
    }
  }

  return false;
}

// Helper function to check for common abbreviations and variations
function checkAbbreviations(fieldName: string, pattern: string): number {
  const abbreviations: { [key: string]: string[] } = {
    'name': ['nm', 'nome', 'namen'],
    'vorname': ['vn', 'fn', 'firstname', 'fname'],
    'nachname': ['nn', 'ln', 'lastname', 'lname', 'surname'],
    'geburtsdatum': ['geb', 'bd', 'birthdate', 'dob'],
    'telefon': ['tel', 'phone', 'fon'],
    'mobile': ['mob', 'handy', 'cell'],
    'email': ['mail', 'em', 'e_mail', 'e-mail'],
    'adresse': ['addr', 'address', 'anschrift'],
    'plz': ['zip', 'postal', 'postcode'],
    'geschlecht': ['sex', 'gender'],
    'nationalität': ['nat', 'nationality', 'nation'],
    'allergien': ['allergy', 'allergies'],
    'bemerkungen': ['notes', 'comments', 'remarks'],
    'datum': ['date', 'dt'],
    'unterschrift': ['signature', 'sign']
  };

  // Check if fieldName matches any abbreviation of pattern
  for (const [key, abbrevs] of Object.entries(abbreviations)) {
    if (pattern.includes(key)) {
      for (const abbrev of abbrevs) {
        if (fieldName.includes(abbrev) || abbrev.includes(fieldName)) {
          return 30; // Lower score for abbreviation matches
        }
      }
    }
  }

  // Check reverse: if pattern matches abbreviation of fieldName
  for (const [key, abbrevs] of Object.entries(abbreviations)) {
    if (fieldName.includes(key)) {
      for (const abbrev of abbrevs) {
        if (pattern.includes(abbrev) || abbrev.includes(pattern)) {
          return 30;
        }
      }
    }
  }

  return 0;
}

export async function analyzeAndFillPDF(
  originalPdfBytes: Uint8Array,
  userProfile: any
): Promise<{ filledPdfBytes: Uint8Array; fields: any[] }> {

  console.log('🔍 Starting enhanced PDF analysis with OCR...');

  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const form = pdfDoc.getForm();

  // Get all form fields from PDF structure
  const pdfFields = form.getFields();
  const detectedFields: any[] = [];

  // STEP 1: Enhanced OCR Analysis for intelligent field mapping
  let ocrMappings: Record<string, string> = {};
  let advancedOCRFields: any[] = [];
  try {
    console.log('🤖 Running advanced OCR analysis for smart field detection...');

    // Use the new advanced OCR service
    const ocrResult = await advancedOCRService.processPDFWithOCR(originalPdfBytes);
    const detectedFields = await advancedOCRService.detectFormFieldsFromOCR(ocrResult);
    advancedOCRFields = detectedFields;

    // Convert advanced OCR results to mappings
    detectedFields.forEach(field => {
      ocrMappings[field.name] = field.suggestedTranslation;
    });

    console.log(`📊 Advanced OCR found ${detectedFields.length} potential fields with enhanced type detection`);
  } catch (error) {
    console.warn('⚠️ Advanced OCR analysis failed, falling back to standard mapping:', error);

    // Fallback to old OCR method
    try {
      const ocrResult = await ocrDetector.analyzePDFWithOCR(originalPdfBytes);
      ocrMappings = ocrResult.suggestedMappings;
      console.log(`📊 Fallback OCR found ${ocrResult.detectedFields.length} potential fields`);
    } catch (fallbackError) {
      console.warn('⚠️ All OCR methods failed:', fallbackError);
    }
  }

  // Enhanced field mapping with better pattern recognition for German forms
  const createFieldMappings = (userProfile: any): FormFieldMapping => {
    const child = userProfile.children?.[0] || {};
    const address = userProfile.address || userProfile.current_address || '';
    const addressParts = parseAddress(address);

    return {
      // PRIORITY: Parent information comes first to avoid conflicts
      // Parent information - Mother (numbered variants) - HIGHEST PRIORITY
      'vorname_1': userProfile.first_name || '',
      'name_1': userProfile.last_name || '',
      'nachname_1': userProfile.last_name || '',
      'familienname_1': userProfile.last_name || '',

      // Parent information - Father (numbered variants) - HIGHEST PRIORITY
      // For demo purposes, use fallback names if partner info not available
      'vorname_2': userProfile.partner_first_name || (userProfile.gender !== 'female' ? userProfile.first_name : 'Michael'),
      'name_2': userProfile.partner_last_name || userProfile.last_name || '',
      'nachname_2': userProfile.partner_last_name || userProfile.last_name || '',
      'familienname_2': userProfile.partner_last_name || userProfile.last_name || '',

      // Parent information - Additional numbered variants (alternating mother/father)
      'vorname_3': userProfile.partner_first_name || (userProfile.gender !== 'female' ? userProfile.first_name : 'Michael'),
      'name_3': userProfile.partner_last_name || userProfile.last_name || '',
      'nachname_3': userProfile.partner_last_name || userProfile.last_name || '',
      'familienname_3': userProfile.partner_last_name || userProfile.last_name || '',

      'vorname_4': userProfile.first_name || '',
      'name_4': userProfile.last_name || '',
      'nachname_4': userProfile.last_name || '',
      'familienname_4': userProfile.last_name || '',

      'vorname_5': userProfile.partner_first_name || (userProfile.gender !== 'female' ? userProfile.first_name : 'Michael'),
      'name_5': userProfile.partner_last_name || userProfile.last_name || '',
      'nachname_5': userProfile.partner_last_name || userProfile.last_name || '',
      'familienname_5': userProfile.partner_last_name || userProfile.last_name || '',

      'vorname_6': userProfile.first_name || '',
      'name_6': userProfile.last_name || '',
      'nachname_6': userProfile.last_name || '',
      'familienname_6': userProfile.last_name || '',

      // Child information - LOWER PRIORITY, more specific field names
      'kind_name': `${child.first_name || ''} ${child.last_name || userProfile.last_name || ''}`.trim(),
      'child_name': `${child.first_name || ''} ${child.last_name || userProfile.last_name || ''}`.trim(),
      'vorname_kind': child.first_name || '',
      'nachname_kind': child.last_name || userProfile.last_name || '',
      'familienname_kind': child.last_name || userProfile.last_name || '',

      // Generic fields - LOWEST PRIORITY, only for unambiguous matches
      'name': child.last_name || userProfile.last_name || '',
      'nachname': child.last_name || userProfile.last_name || '',
      'familienname': child.last_name || userProfile.last_name || '',
      'surname': child.last_name || userProfile.last_name || '',
      'vorname': child.first_name || '',
      'firstname': child.first_name || '',

      // Date variations
      'geburtsdatum': formatGermanDate(child.date_of_birth) || '',
      'geb_datum': formatGermanDate(child.date_of_birth) || '',
      'birth_date': formatGermanDate(child.date_of_birth) || '',
      'date_of_birth': formatGermanDate(child.date_of_birth) || '',
      'geburtstag': formatGermanDate(child.date_of_birth) || '',

      // Gender variations
      'geschlecht': child.gender === 'female' ? 'weiblich' : child.gender === 'male' ? 'männlich' : '',
      'gender': child.gender === 'female' ? 'weiblich' : child.gender === 'male' ? 'männlich' : '',

      // Nationality variations
      'nationalität': child.nationality || '',
      'nationality': child.nationality || '',
      'staatsangehörigkeit': child.nationality || '',
      'staatsangehoerigkeit': child.nationality || '',
      'citizenship': child.nationality || '',

      // Birth place variations
      'geburtsort': child.birth_place || '',
      'birth_place': child.birth_place || '',
      'place_of_birth': child.birth_place || '',
      'bürgerort': child.birth_place || '',
      'buergerort': child.birth_place || '',

      // Language variations
      'erstsprache': child.preferred_language || '',
      'first_language': child.preferred_language || '',
      'muttersprache': child.preferred_language || '',
      'heimatsprache': child.preferred_language || '',
      'umgangssprache': child.preferred_language ? `${child.preferred_language}/Deutsch` : '',

      // Additional address and contact info for numbered parents
      'adresse_1': address || '',
      'strasse_1': addressParts.street || '',
      'plz_1': addressParts.postalCode || '',
      'ort_1': addressParts.city || '',
      'mobile_1': userProfile.phone || '',
      'telefon_1': userProfile.phone || '',
      'e-mail_1': userProfile.email || '',
      'email_1': userProfile.email || '',

      'adresse_2': address || '',
      'strasse_2': addressParts.street || '',
      'plz_2': addressParts.postalCode || '',
      'ort_2': addressParts.city || '',
      'mobile_2': userProfile.partner_phone || userProfile.phone || '',
      'telefon_2': userProfile.partner_phone || userProfile.phone || '',
      'e-mail_2': userProfile.partner_email || userProfile.email || '',
      'email_2': userProfile.partner_email || userProfile.email || '',

      // Mother specific fields
      'mutter_vorname': userProfile.first_name || '',
      'mutter_nachname': userProfile.last_name || '',
      'mutter_name': `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
      'mother_firstname': userProfile.first_name || '',
      'mother_lastname': userProfile.last_name || '',
      'mother_name': `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),

      // Father specific fields
      'vater_vorname': userProfile.partner_first_name || (userProfile.gender !== 'female' ? userProfile.first_name : 'Michael'),
      'vater_nachname': userProfile.partner_last_name || userProfile.last_name || '',
      'vater_name': (userProfile.partner_first_name || (userProfile.gender !== 'female' ? userProfile.first_name : 'Michael')) + ' ' + (userProfile.partner_last_name || userProfile.last_name || ''),
      'father_firstname': userProfile.partner_first_name || (userProfile.gender !== 'female' ? userProfile.first_name : 'Michael'),
      'father_lastname': userProfile.partner_last_name || userProfile.last_name || '',
      'father_name': (userProfile.partner_first_name || (userProfile.gender !== 'female' ? userProfile.first_name : 'Michael')) + ' ' + (userProfile.partner_last_name || userProfile.last_name || ''),

      // Generic parent fields
      'eltern_vorname': userProfile.first_name || '',
      'eltern_nachname': userProfile.last_name || '',
      'erziehungsberechtigte_vorname': userProfile.first_name || '',
      'erziehungsberechtigte_nachname': userProfile.last_name || '',
      'guardian_firstname': userProfile.first_name || '',
      'guardian_lastname': userProfile.last_name || '',

      // Address variations
      'adresse': address || '',
      'address': address || '',
      'anschrift': address || '',
      'wohnort': address || '',
      'wohnadresse': address || '',
      'strasse': addressParts.street || '',
      'street': addressParts.street || '',
      'strassenname': addressParts.street || '',
      'hausnummer': addressParts.houseNumber || '',
      'house_number': addressParts.houseNumber || '',
      'plz': addressParts.postalCode || '',
      'postleitzahl': addressParts.postalCode || '',
      'postal_code': addressParts.postalCode || '',
      'zip_code': addressParts.postalCode || '',
      'ort': addressParts.city || '',
      'stadt': addressParts.city || '',
      'city': addressParts.city || '',
      'wohnort_stadt': addressParts.city || '',

      // Contact information variations
      'telefon': userProfile.phone || '',
      'telefonnummer': userProfile.phone || '',
      'phone': userProfile.phone || '',
      'mobile': userProfile.phone || '',
      'handy': userProfile.phone || '',
      'mobilnummer': userProfile.phone || '',
      'mobile_number': userProfile.phone || '',
      'phone_number': userProfile.phone || '',
      'tel': userProfile.phone || '',
      'email': userProfile.email || '',
      'e_mail': userProfile.email || '',
      'e-mail': userProfile.email || '',
      'e.mail': userProfile.email || '',
      'email_address': userProfile.email || '',
      'mail': userProfile.email || '',

      // Medical information
      'allergien': child.allergies || '',
      'allergies': child.allergies || '',
      'allergy': child.allergies || '',
      'unverträglichkeiten': child.allergies || '',
      'besondere_bedürfnisse': child.special_needs || child.medical_conditions || '',
      'special_needs': child.special_needs || child.medical_conditions || '',
      'medizinische_hinweise': child.medical_conditions || '',
      'medical_conditions': child.medical_conditions || '',
      'gesundheit': child.medical_conditions || '',
      'bemerkungen': child.notes || child.allergies || '',
      'notes': child.notes || child.allergies || '',
      'anmerkungen': child.notes || child.allergies || '',
      'comments': child.notes || child.allergies || '',
      'hinweise': child.notes || child.allergies || '',

      // School information
      'bisherige_schule': child.previous_school || '',
      'previous_school': child.previous_school || '',
      'frühere_schule': child.previous_school || '',
      'alte_schule': child.previous_school || '',
      'klasse': child.school_grade || '',
      'schulklasse': child.school_grade || '',
      'grade': child.school_grade || '',
      'school_grade': child.school_grade || '',
      'stufe': child.school_grade || '',

      // Administrative dates
      'datum': new Date().toLocaleDateString('de-DE'),
      'date': new Date().toLocaleDateString('de-DE'),
      'heute': new Date().toLocaleDateString('de-DE'),
      'today': new Date().toLocaleDateString('de-DE'),
      'unterschrift_datum': new Date().toLocaleDateString('de-DE'),
      'signature_date': new Date().toLocaleDateString('de-DE'),
      'ort_datum': addressParts.city ? `${addressParts.city}, ${new Date().toLocaleDateString('de-DE')}` : new Date().toLocaleDateString('de-DE'),
      'place_date': addressParts.city ? `${addressParts.city}, ${new Date().toLocaleDateString('de-DE')}` : new Date().toLocaleDateString('de-DE'),
      'eintrittsdatum': new Date().toLocaleDateString('de-DE'),
      'entry_date': new Date().toLocaleDateString('de-DE'),
      'gewünschtes_eintrittsdatum': new Date().toLocaleDateString('de-DE'),
      'desired_entry_date': new Date().toLocaleDateString('de-DE'),

      // Boolean fields for checkboxes
      'männlich': child.gender === 'male' ? 'true' : 'false',
      'male': child.gender === 'male' ? 'true' : 'false',
      'weiblich': child.gender === 'female' ? 'true' : 'false',
      'female': child.gender === 'female' ? 'true' : 'false',
      'wohnhaft_bei_eltern': 'true',
      'living_with_parents': 'true',
      'beide_elternteile': 'true',
      'both_parents': 'true',
      'alleinerziehend': 'false',
      'single_parent': 'false',
      'ja': 'false',
      'yes': 'false',
      'nein': 'true',
      'no': 'true',
      'tagesschule_ja': 'false',
      'tagesschule_nein': 'true',
      'deutsch_gut': 'true',
      'deutsch_mittel': 'false',
      'deutsch_keine': 'false',
      'german_good': 'true',
      'german_medium': 'false',
      'german_none': 'false',
    };
  };

  const fieldMappings = createFieldMappings(userProfile);

  // STEP 2: Process each PDF field with enhanced mapping
  for (const field of pdfFields) {
    const fieldName = field.getName().toLowerCase();
    const fieldType = field.constructor.name;

    console.log(`🔍 Processing field: ${fieldName} (${fieldType})`);

    let value = '';
    let translation = '';
    let isAutoFilled = false;
    let mappingSource = 'standard';
    let contextHints: string[] = [];
    let isRequired = false;
    let enhancedFieldType = getFieldType(fieldType);

    // STEP 2A: Check OCR-suggested mappings first (highest priority)
    let bestMatch = { value: '', score: 0, pattern: '' };

    // Check if OCR provided a specific mapping for this field
    for (const [ocrFieldName, ocrMapping] of Object.entries(ocrMappings)) {
      if (fieldName.includes(ocrFieldName.toLowerCase()) || ocrFieldName.toLowerCase().includes(fieldName)) {
        const ocrValue = getValueFromMapping(ocrMapping, userProfile);
        if (ocrValue) {
          bestMatch = { value: ocrValue, score: 95, pattern: `ocr:${ocrMapping}` };
          mappingSource = 'ocr';
          console.log(`🎯 OCR matched field: ${fieldName} → ${ocrMapping} = ${ocrValue}`);
          break;
        }
      }
    }

    // STEP 2B: Standard pattern matching if OCR didn't provide a good match
    if (bestMatch.score < 90) {
      for (const [pattern, mappedValue] of Object.entries(fieldMappings)) {
      const patternLower = pattern.toLowerCase();
      const fieldNameLower = fieldName.toLowerCase();

      let score = 0;

      // Exact match gets highest score
      if (fieldNameLower === patternLower) {
        score = 100;
      }
      // Field contains pattern - but check for specificity
      else if (fieldNameLower.includes(patternLower)) {
        score = 80 + (patternLower.length / fieldNameLower.length) * 20;

        // PENALTY: Reduce score if mapping seems wrong for context
        // Example: Don't map "vorname" to last name if field clearly asks for first name
        if (isIncorrectMapping(fieldNameLower, patternLower, mappedValue)) {
          score = score * 0.5; // Reduce score by half
        }
      }
      // Pattern contains field (less precise)
      else if (patternLower.includes(fieldNameLower)) {
        score = 60 + (fieldNameLower.length / patternLower.length) * 20;
      }
      // Check for word boundaries and common variations
      else {
        // Remove common separators and check again
        const cleanFieldName = fieldNameLower.replace(/[_\-\.]/g, '');
        const cleanPattern = patternLower.replace(/[_\-\.]/g, '');

        if (cleanFieldName === cleanPattern) {
          score = 90;
        } else if (cleanFieldName.includes(cleanPattern)) {
          score = 70;
        } else if (cleanPattern.includes(cleanFieldName)) {
          score = 50;
        }

        // Check for common abbreviations and variations
        if (score === 0) {
          score = checkAbbreviations(fieldNameLower, patternLower);
        }
      }

        // Update best match if this score is higher
        if (score > bestMatch.score && mappedValue) {
          bestMatch = { value: mappedValue, score, pattern };
        }
      }
    }

    if (bestMatch.score > 40) { // Minimum confidence threshold
      value = bestMatch.value;
      isAutoFilled = true;
    }

    // Enhanced translation with context awareness
    try {
      // Extract context hints for better translation
      contextHints = extractContextHints(fieldName, []);

      // Use advanced translation if available
      const contextTranslation = await translateFormFieldWithContext(
        fieldName,
        enhancedFieldType,
        contextHints
      );
      translation = contextTranslation.translation;

      // Update field type based on context analysis
      if (contextTranslation.confidence > 80) {
        enhancedFieldType = contextTranslation.fieldTypeHint;
      }
    } catch (error) {
      console.warn('Context-aware translation failed, using fallback:', error);
      // Fallback to simple translation
      translation = translateFieldName(fieldName);
    }

    // Check if field is required (from advanced OCR)
    const advancedField = advancedOCRFields.find(f =>
      f.name === fieldName || f.originalText.toLowerCase().includes(fieldName)
    );
    if (advancedField) {
      isRequired = advancedField.isRequired || false;
      contextHints = advancedField.contextHints || contextHints;
    }

    // Store enhanced field info for frontend display
    detectedFields.push({
      name: fieldName,
      originalName: fieldName,
      translation: translation,
      value: value,
      confidence: isAutoFilled ? Math.round(bestMatch.score) : 0,
      isAutoFilled: isAutoFilled,
      fieldType: enhancedFieldType,
      position: advancedField ? {
        x: advancedField.position.x,
        y: advancedField.position.y,
        width: advancedField.position.width,
        height: advancedField.position.height
      } : {
        x: 0,
        y: 0,
        width: 100,
        height: 20
      },
      context: contextHints.join(', '),
      contextHints: contextHints,
      isRequired: isRequired,
      originalType: fieldType,
      matchScore: bestMatch.score
    });

    console.log(`Field: ${fieldName} | Translation: ${translation} | Value: ${value} | Confidence: ${isAutoFilled ? Math.round(bestMatch.score) : 0}% | Type: ${fieldType}`);

    // Fill the field if we have a value
    if (value && field instanceof PDFTextField) {
      try {
        field.setText(value);
        console.log(`Filled text field ${fieldName} with: ${value}`);
      } catch (error) {
        console.error(`Error filling field ${fieldName}:`, error);
      }
    } else if (value && field instanceof PDFCheckBox) {
      try {
        if (value.toLowerCase() === 'ja' || value.toLowerCase() === 'yes' || value === 'true') {
          field.check();
        }
        console.log(`Filled checkbox ${fieldName} with: ${value}`);
      } catch (error) {
        console.error(`Error filling checkbox ${fieldName}:`, error);
      }
    } else if (value && field instanceof PDFDropdown) {
      try {
        const options = field.getOptions();
        const matchingOption = options.find(opt =>
          opt.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(opt.toLowerCase())
        );
        if (matchingOption) {
          field.select(matchingOption);
        }
        console.log(`Filled dropdown ${fieldName} with: ${matchingOption || value}`);
      } catch (error) {
        console.error(`Error filling dropdown ${fieldName}:`, error);
      }
    }
  }

  // Save the filled PDF
  const filledPdfBytes = await pdfDoc.save();

  return {
    filledPdfBytes,
    fields: detectedFields
  };
}

// Helper function to safely access nested properties
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key];
    }
    return undefined;
  }, obj);
}

// Helper function to extract value from OCR mapping path
function getValueFromMapping(mappingPath: string, userProfile: any): string {
  // Handle special cases first
  if (mappingPath.includes('current_date')) {
    return new Date().toLocaleDateString('de-DE');
  }

  if (mappingPath.includes('signature')) {
    return userProfile.signature || '';
  }

  // Handle array access for children
  if (mappingPath.startsWith('child.') && Array.isArray(userProfile.children) && userProfile.children.length > 0) {
    const childProperty = mappingPath.replace('child.', '');
    const firstChild = userProfile.children[0];
    return getNestedValue(firstChild, childProperty) || '';
  }

  // Handle gender checkboxes
  if (mappingPath.includes('gender.male')) {
    const gender = getNestedValue(userProfile, mappingPath.replace('.male', ''));
    return gender === 'male' || gender === 'männlich' ? 'Yes' : '';
  }

  if (mappingPath.includes('gender.female')) {
    const gender = getNestedValue(userProfile, mappingPath.replace('.female', ''));
    return gender === 'female' || gender === 'weiblich' ? 'Yes' : '';
  }

  // Extract value using the mapping path
  const value = getNestedValue(userProfile, mappingPath);

  // Return the value as string, or empty string if not found
  return value ? String(value) : '';
}

function translateFieldName(germanName: string): string {
  const translations: { [key: string]: string } = {
    // Personal information
    'vorname': 'First Name',
    'nachname': 'Last Name',
    'familienname': 'Family Name',
    'name': 'Name',
    'surname': 'Surname',
    'firstname': 'First Name',
    'lastname': 'Last Name',

    // Child specific
    'kind_name': 'Child Name',
    'child_name': 'Child Name',
    'vorname_kind': 'Child First Name',
    'nachname_kind': 'Child Last Name',

    // Parent specific
    'mutter_vorname': 'Mother First Name',
    'mutter_nachname': 'Mother Last Name',
    'mutter_name': 'Mother Name',
    'vater_vorname': 'Father First Name',
    'vater_nachname': 'Father Last Name',
    'vater_name': 'Father Name',
    'eltern_vorname': 'Parent First Name',
    'eltern_nachname': 'Parent Last Name',
    'erziehungsberechtigte': 'Guardian',
    'guardian': 'Guardian',

    // Dates
    'geburtsdatum': 'Date of Birth',
    'geb_datum': 'Birth Date',
    'birth_date': 'Birth Date',
    'date_of_birth': 'Date of Birth',
    'geburtstag': 'Birthday',
    'eintrittsdatum': 'Entry Date',
    'gewünschtes_eintrittsdatum': 'Desired Entry Date',
    'datum': 'Date',
    'heute': 'Today',
    'unterschrift_datum': 'Signature Date',

    // Gender
    'geschlecht': 'Gender',
    'gender': 'Gender',
    'männlich': 'Male',
    'weiblich': 'Female',
    'male': 'Male',
    'female': 'Female',

    // Nationality and origin
    'nationalität': 'Nationality',
    'nationality': 'Nationality',
    'staatsangehörigkeit': 'Citizenship',
    'staatsangehoerigkeit': 'Citizenship',
    'citizenship': 'Citizenship',
    'geburtsort': 'Place of Birth',
    'birth_place': 'Place of Birth',
    'place_of_birth': 'Place of Birth',
    'bürgerort': 'Place of Origin',
    'buergerort': 'Place of Origin',

    // Languages
    'erstsprache': 'First Language',
    'first_language': 'First Language',
    'muttersprache': 'Mother Tongue',
    'heimatsprache': 'Native Language',
    'umgangssprache': 'Language of Communication',

    // Address components
    'adresse': 'Address',
    'address': 'Address',
    'anschrift': 'Address',
    'wohnort': 'Place of Residence',
    'wohnadresse': 'Residential Address',
    'strasse': 'Street',
    'street': 'Street',
    'strassenname': 'Street Name',
    'hausnummer': 'House Number',
    'house_number': 'House Number',
    'plz': 'Postal Code',
    'postleitzahl': 'Postal Code',
    'postal_code': 'Postal Code',
    'zip_code': 'ZIP Code',
    'ort': 'City',
    'stadt': 'City',
    'city': 'City',

    // Contact information
    'telefon': 'Phone',
    'telefonnummer': 'Phone Number',
    'phone': 'Phone',
    'mobile': 'Mobile',
    'handy': 'Mobile Phone',
    'mobilnummer': 'Mobile Number',
    'tel': 'Telephone',
    'email': 'Email',
    'e_mail': 'Email',
    'e-mail': 'Email',
    'e.mail': 'Email',
    'mail': 'Email',

    // Medical and special information
    'allergien': 'Allergies',
    'allergies': 'Allergies',
    'allergy': 'Allergy',
    'unverträglichkeiten': 'Intolerances',
    'besondere_bedürfnisse': 'Special Needs',
    'special_needs': 'Special Needs',
    'medizinische_hinweise': 'Medical Notes',
    'medical_conditions': 'Medical Conditions',
    'gesundheit': 'Health',
    'bemerkungen': 'Comments',
    'notes': 'Notes',
    'anmerkungen': 'Remarks',
    'comments': 'Comments',
    'hinweise': 'Notes',

    // School information
    'bisherige_schule': 'Previous School',
    'previous_school': 'Previous School',
    'frühere_schule': 'Former School',
    'alte_schule': 'Old School',
    'klasse': 'Class/Grade',
    'schulklasse': 'School Class',
    'grade': 'Grade',
    'school_grade': 'School Grade',
    'stufe': 'Level',

    // Administrative
    'unterschrift': 'Signature',
    'signature': 'Signature',
    'ort_datum': 'Place and Date',
    'place_date': 'Place and Date',

    // Boolean fields
    'ja': 'Yes',
    'nein': 'No',
    'yes': 'Yes',
    'no': 'No',
    'wohnhaft_bei_eltern': 'Living with Parents',
    'beide_elternteile': 'Both Parents',
    'alleinerziehend': 'Single Parent',
    'tagesschule': 'All-Day School',
    'deutsch_kenntnisse': 'German Skills',

    // Family relations
    'kind': 'Child',
    'eltern': 'Parents',
    'mutter': 'Mother',
    'vater': 'Father',
    'both_parents': 'Both Parents',
    'single_parent': 'Single Parent',

    // Numbers for multiple entries
    '_1': ' (Person 1)',
    '_2': ' (Person 2)',
    '1': ' 1',
    '2': ' 2'
  };

  // Find the best translation with scoring
  let bestTranslation = '';
  let bestScore = 0;

  const fieldLower = germanName.toLowerCase();

  for (const [german, english] of Object.entries(translations)) {
    const germanLower = german.toLowerCase();
    let score = 0;

    // Exact match
    if (fieldLower === germanLower) {
      score = 100;
    }
    // Field contains the German term
    else if (fieldLower.includes(germanLower)) {
      score = 80 + (germanLower.length / fieldLower.length) * 20;
    }
    // German term contains the field (for abbreviations)
    else if (germanLower.includes(fieldLower) && fieldLower.length > 2) {
      score = 60;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTranslation = english;
    }
  }

  // If we found a good translation, return it
  if (bestScore > 50) {
    return bestTranslation;
  }

  // Fallback: capitalize and clean up
  return germanName.charAt(0).toUpperCase() + germanName.slice(1)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space before capitals
}

function getFieldType(pdfFieldType: string): 'text' | 'date' | 'checkbox' | 'select' {
  switch (pdfFieldType) {
    case 'PDFTextField':
      return 'text';
    case 'PDFCheckBox':
      return 'checkbox';
    case 'PDFDropdown':
      return 'select';
    default:
      return 'text';
  }
}

export async function fillPDFWithCustomData(
  originalPdfBytes: Uint8Array,
  fieldData: { [key: string]: string }
): Promise<Uint8Array> {

  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const form = pdfDoc.getForm();

  // Get all form fields
  const fields = form.getFields();

  // Fill each field with provided data
  for (const field of fields) {
    const fieldName = field.getName().toLowerCase();
    const value = fieldData[fieldName];

    if (value) {
      if (field instanceof PDFTextField) {
        try {
          field.setText(value);
        } catch (error) {
          console.error(`Error filling text field ${fieldName}:`, error);
        }
      } else if (field instanceof PDFCheckBox) {
        try {
          if (value.toLowerCase() === 'ja' || value.toLowerCase() === 'yes' || value === 'true') {
            field.check();
          }
        } catch (error) {
          console.error(`Error filling checkbox ${fieldName}:`, error);
        }
      } else if (field instanceof PDFDropdown) {
        try {
          const options = field.getOptions();
          const matchingOption = options.find(opt =>
            opt.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(opt.toLowerCase())
          );
          if (matchingOption) {
            field.select(matchingOption);
          }
        } catch (error) {
          console.error(`Error filling dropdown ${fieldName}:`, error);
        }
      }
    }
  }

  // Save and return the filled PDF
  return await pdfDoc.save();
}