import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from 'pdf-lib';

export interface FieldMapping {
  fieldName: string;
  userValue: string;
  fieldType: 'text' | 'checkbox';
}

export interface SimpleFillResult {
  success: boolean;
  filledFields: string[];
  error?: string;
}

export class SimplePDFFiller {
  private static fieldPatterns = {
    // Name patterns (German, English, French, Italian)
    firstName: [
      'vorname', 'firstname', 'first_name', 'prenom', 'nome', 'given_name',
      'vorname_kind', 'firstname_child', 'prenom_enfant', 'nome_bambino'
    ],
    lastName: [
      'nachname', 'lastname', 'last_name', 'nom', 'cognome', 'family_name',
      'nachname_kind', 'lastname_child', 'nom_enfant', 'cognome_bambino',
      'familienname', 'surname'
    ],
    email: [
      'email', 'e_mail', 'e-mail', 'mail', 'email_adresse', 'courriel'
    ],
    phone: [
      'telefon', 'phone', 'telephone', 'tel', 'mobile', 'handy', 'portable'
    ],
    address: [
      'adresse', 'address', 'wohnort', 'residence', 'domicile', 'indirizzo'
    ],
    postalCode: [
      'plz', 'postleitzahl', 'postal_code', 'zip', 'code_postal', 'cap'
    ],
    city: [
      'ort', 'city', 'stadt', 'ville', 'citta', 'municipality', 'gemeinde'
    ],
    country: [
      'land', 'country', 'pays', 'paese', 'nationality', 'staatsangehorigkeit'
    ],
    birthDate: [
      'geburtsdatum', 'birth_date', 'date_naissance', 'data_nascita', 'geburt'
    ],
    gender: [
      'geschlecht', 'gender', 'sexe', 'sesso', 'm_f', 'm/w'
    ]
  };

  static async fillPDFWithUserData(
    pdfBuffer: Buffer, 
    userData: any
  ): Promise<SimpleFillResult> {
    try {
      console.log('📝 Starting simple PDF filling with user data');

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const form = pdfDoc.getForm();

      const filledFields: string[] = [];
      let totalFields = 0;

      // Get all form fields
      const fields = form.getFields();
      console.log(`📋 Found ${fields.length} form fields`);

      // Try to fill each field based on patterns
      for (const field of fields) {
        totalFields++;
        const fieldName = field.getName().toLowerCase();
        console.log(`🔍 Checking field: ${fieldName}`);

        // Try to match field with user data
        const fieldValue = this.findMatchingValue(fieldName, userData);
        
        if (fieldValue) {
          try {
            if (field instanceof PDFTextField) {
              field.setText(fieldValue);
              filledFields.push(fieldName);
              console.log(`✅ Filled text field: ${fieldName} = ${fieldValue}`);
            } else if (field instanceof PDFCheckBox) {
              // For checkboxes, check if value indicates true
              if (fieldValue.toLowerCase() === 'yes' || fieldValue.toLowerCase() === 'ja' || fieldValue.toLowerCase() === 'oui' || fieldValue.toLowerCase() === 'si') {
                field.check();
                filledFields.push(fieldName);
                console.log(`✅ Checked checkbox: ${fieldName}`);
              }
            }
          } catch (fieldError) {
            console.warn(`⚠️ Could not fill field ${fieldName}:`, fieldError);
          }
        }
      }

      // Save the filled PDF
      const filledPdfBytes = await pdfDoc.save();
      
      console.log(`✅ PDF filling completed: ${filledFields.length}/${totalFields} fields filled`);

      return {
        success: true,
        filledFields: filledFields
      };

    } catch (error) {
      console.error('❌ PDF filling failed:', error);
      return {
        success: false,
        filledFields: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static findMatchingValue(fieldName: string, userData: any): string | null {
    // Check each pattern category
    for (const [category, patterns] of Object.entries(this.fieldPatterns)) {
      for (const pattern of patterns) {
        if (fieldName.includes(pattern)) {
          const value = this.getUserValueForCategory(category, userData);
          if (value) {
            console.log(`🎯 Matched field "${fieldName}" to category "${category}" with value "${value}"`);
            return value;
          }
        }
      }
    }

    // Special handling for child fields
    if (fieldName.includes('kind') || fieldName.includes('child') || fieldName.includes('enfant') || fieldName.includes('bambino')) {
      if (userData.children && userData.children.length > 0) {
        const firstChild = userData.children[0];
        if (fieldName.includes('vorname') || fieldName.includes('firstname') || fieldName.includes('prenom') || fieldName.includes('nome')) {
          return firstChild.first_name || '';
        }
        if (fieldName.includes('nachname') || fieldName.includes('lastname') || fieldName.includes('nom') || fieldName.includes('cognome')) {
          return firstChild.last_name || '';
        }
        if (fieldName.includes('geburtsdatum') || fieldName.includes('birth_date') || fieldName.includes('date_naissance')) {
          return firstChild.birth_date || '';
        }
      }
    }

    return null;
  }

  private static getUserValueForCategory(category: string, userData: any): string | null {
    switch (category) {
      case 'firstName':
        return userData.first_name || '';
      case 'lastName':
        return userData.last_name || '';
      case 'email':
        return userData.email || '';
      case 'phone':
        return userData.phone || '';
      case 'address':
        return userData.address || userData.current_address || '';
      case 'postalCode':
        return userData.target_postal_code || userData.postal_code || '';
      case 'city':
        return userData.target_municipality || userData.city || '';
      case 'country':
        return userData.country_of_origin || userData.nationality || '';
      case 'birthDate':
        return userData.birth_date || '';
      case 'gender':
        return userData.gender || '';
      default:
        return null;
    }
  }

  static getFieldPatterns() {
    return this.fieldPatterns;
  }
}
