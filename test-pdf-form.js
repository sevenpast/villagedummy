// Simple test script to create a basic PDF form for testing
const { PDFDocument, PDFForm, PDFTextField } = require('pdf-lib');
const fs = require('fs');

async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  
  // Add some text
  page.drawText('Schulanmeldung - School Registration', {
    x: 50,
    y: 350,
    size: 16,
  });
  
  page.drawText('Familienname des Kindes:', {
    x: 50,
    y: 300,
    size: 12,
  });
  
  page.drawText('Vorname des Kindes:', {
    x: 50,
    y: 250,
    size: 12,
  });
  
  page.drawText('Geburtsdatum:', {
    x: 50,
    y: 200,
    size: 12,
  });
  
  // Create form
  const form = pdfDoc.getForm();
  
  // Add text fields
  const familyNameField = form.createTextField('familyName');
  familyNameField.addToPage(page, {
    x: 200,
    y: 295,
    width: 200,
    height: 20,
  });
  
  const firstNameField = form.createTextField('firstName');
  firstNameField.addToPage(page, {
    x: 200,
    y: 245,
    width: 200,
    height: 20,
  });
  
  const birthDateField = form.createTextField('birthDate');
  birthDateField.addToPage(page, {
    x: 200,
    y: 195,
    width: 200,
    height: 20,
  });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test-school-form.pdf', pdfBytes);
  console.log('Test PDF created: test-school-form.pdf');
}

createTestPDF().catch(console.error);
