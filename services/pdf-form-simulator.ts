import { PDFDocument, StandardFonts, rgb, PDFForm, PDFTextField } from 'pdf-lib';

// Create a realistic Zürich Kindergarten form with actual form fields
export async function createRealisticKindergartenForm(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let currentY = height - 60;

  // Title
  page.drawText('Stadt Zürich - Schulamt', {
    x: 50,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 25;

  page.drawText('Anmeldung für den Kindergarten', {
    x: 50,
    y: currentY,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 40;

  // Get the form
  const form = pdfDoc.getForm();

  // Helper function to add a labeled text field
  const addTextField = (label: string, fieldName: string, y: number, width: number = 200) => {
    page.drawText(label, {
      x: 50,
      y: y + 5,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    const textField = form.createTextField(fieldName);
    textField.addToPage(page, {
      x: 250,
      y: y,
      width: width,
      height: 20,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    return textField;
  };

  // Section: Child Information
  page.drawText('ANGABEN ZUM KIND', {
    x: 50,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentY -= 30;

  addTextField('Vorname des Kindes:', 'vorname_kind', currentY);
  currentY -= 35;

  addTextField('Familienname des Kindes:', 'familienname_kind', currentY);
  currentY -= 35;

  addTextField('Geburtsdatum (TT.MM.JJJJ):', 'geburtsdatum_kind', currentY);
  currentY -= 35;

  addTextField('Geschlecht (m/w/d):', 'geschlecht', currentY, 100);
  currentY -= 35;

  addTextField('Staatsangehörigkeit:', 'staatsangehörigkeit', currentY);
  currentY -= 50;

  // Section: Parent Information
  page.drawText('ANGABEN ZU DEN ERZIEHUNGSBERECHTIGTEN', {
    x: 50,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentY -= 30;

  addTextField('Vorname Erziehungsberechtigte/r:', 'vorname_erziehungsberechtigte', currentY);
  currentY -= 35;

  addTextField('Familienname Erziehungsberechtigte/r:', 'familienname_erziehungsberechtigte', currentY);
  currentY -= 35;

  addTextField('Strasse und Hausnummer:', 'strasse', currentY);
  currentY -= 35;

  addTextField('PLZ und Ort:', 'plz_ort', currentY);
  currentY -= 35;

  addTextField('Telefonnummer:', 'telefonnummer', currentY);
  currentY -= 35;

  addTextField('E-Mail-Adresse:', 'email', currentY);
  currentY -= 50;

  // Section: Additional Information
  page.drawText('WEITERE ANGABEN', {
    x: 50,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentY -= 30;

  addTextField('Allergien/Besondere Bedürfnisse:', 'allergien', currentY, 300);
  currentY -= 35;

  addTextField('Gewünschtes Eintrittsdatum:', 'eintrittsdatum', currentY);
  currentY -= 50;

  // Signature section
  page.drawText('Datum: _______________', {
    x: 50,
    y: currentY,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('Unterschrift: ___________________________', {
    x: 300,
    y: currentY,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}

// Simulate the full workflow: create form → analyze → fill → return
export async function simulateFormFillWorkflow(userProfile: any, customFields?: { [key: string]: string }) {
  // 1. Create a realistic form (simulates uploaded PDF)
  const originalPdfBytes = await createRealisticKindergartenForm();

  // 2. Load the PDF and analyze fields
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const detectedFields: any[] = [];

  // 3. Map user data to form fields
  const fieldMappings: { [key: string]: string } = {
    'vorname_kind': userProfile.children?.[0]?.first_name || '',
    'familienname_kind': userProfile.children?.[0]?.last_name || '',
    'geburtsdatum_kind': userProfile.children?.[0]?.date_of_birth || '',
    'geschlecht': userProfile.children?.[0]?.gender === 'female' ? 'weiblich' : userProfile.children?.[0]?.gender === 'male' ? 'männlich' : '',
    'staatsangehörigkeit': userProfile.children?.[0]?.nationality || '',
    'vorname_erziehungsberechtigte': userProfile.first_name || '',
    'familienname_erziehungsberechtigte': userProfile.last_name || '',
    'strasse': userProfile.address || '',
    'plz_ort': userProfile.target_municipality ? `${userProfile.target_postal_code || ''} ${userProfile.target_municipality}`.trim() : '',
    'telefonnummer': userProfile.phone || '',
    'email': userProfile.email || '',
    'allergien': userProfile.children?.[0]?.allergies || '',
    'eintrittsdatum': '' // This should be filled by user
  };

  // 4. Process each field and create analysis result
  for (const field of fields) {
    const fieldName = field.getName();
    const mappedValue = customFields?.[fieldName] || fieldMappings[fieldName] || '';
    const isAutoFilled = !!fieldMappings[fieldName];

    // Fill the field
    if (mappedValue && field instanceof PDFTextField) {
      try {
        field.setText(mappedValue);
      } catch (error) {
        console.error(`Error filling field ${fieldName}:`, error);
      }
    }

    // Add to detected fields for frontend
    detectedFields.push({
      name: fieldName,
      originalName: translateToGerman(fieldName),
      translation: translateToEnglish(fieldName),
      value: mappedValue,
      confidence: isAutoFilled ? 90 : 0,
      isAutoFilled: isAutoFilled,
      fieldType: 'text'
    });
  }

  // 5. Save the filled PDF
  const filledPdfBytes = await pdfDoc.save();

  return {
    originalPdfBytes,
    filledPdfBytes,
    fields: detectedFields
  };
}

function translateToGerman(fieldName: string): string {
  const translations: { [key: string]: string } = {
    'vorname_kind': 'Vorname des Kindes',
    'familienname_kind': 'Familienname des Kindes',
    'geburtsdatum_kind': 'Geburtsdatum',
    'geschlecht': 'Geschlecht',
    'staatsangehörigkeit': 'Staatsangehörigkeit',
    'vorname_erziehungsberechtigte': 'Vorname Erziehungsberechtigte/r',
    'familienname_erziehungsberechtigte': 'Familienname Erziehungsberechtigte/r',
    'strasse': 'Strasse und Hausnummer',
    'plz_ort': 'PLZ und Ort',
    'telefonnummer': 'Telefonnummer',
    'email': 'E-Mail-Adresse',
    'allergien': 'Allergien/Besondere Bedürfnisse',
    'eintrittsdatum': 'Gewünschtes Eintrittsdatum'
  };

  return translations[fieldName] || fieldName;
}

function translateToEnglish(fieldName: string): string {
  const translations: { [key: string]: string } = {
    'vorname_kind': 'Child\'s First Name',
    'familienname_kind': 'Child\'s Last Name',
    'geburtsdatum_kind': 'Child\'s Date of Birth',
    'geschlecht': 'Gender',
    'staatsangehörigkeit': 'Nationality',
    'vorname_erziehungsberechtigte': 'Parent\'s First Name',
    'familienname_erziehungsberechtigte': 'Parent\'s Last Name',
    'strasse': 'Street and House Number',
    'plz_ort': 'Postal Code and City',
    'telefonnummer': 'Phone Number',
    'email': 'Email Address',
    'allergien': 'Allergies/Special Needs',
    'eintrittsdatum': 'Desired Entry Date'
  };

  return translations[fieldName] || fieldName;
}