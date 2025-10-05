const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function createRealTestPDF() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title
  page.drawText('Schulanmeldung', {
    x: 50,
    y: 750,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Student Information Section
  page.drawText('Schülerdaten:', {
    x: 50,
    y: 700,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Form fields with labels
  const fields = [
    { label: 'Vorname:', x: 50, y: 670, fieldX: 150, fieldY: 665, fieldW: 200, fieldH: 20 },
    { label: 'Name:', x: 50, y: 640, fieldX: 150, fieldY: 635, fieldW: 200, fieldH: 20 },
    { label: 'Geburtsdatum:', x: 50, y: 610, fieldX: 150, fieldY: 605, fieldW: 150, fieldH: 20 },
    { label: 'Adresse:', x: 50, y: 580, fieldX: 150, fieldY: 575, fieldW: 300, fieldH: 20 },
    { label: 'Telefon:', x: 50, y: 550, fieldX: 150, fieldY: 545, fieldW: 150, fieldH: 20 },
    { label: 'E-Mail:', x: 50, y: 520, fieldX: 150, fieldY: 515, fieldW: 200, fieldH: 20 },
  ];

  fields.forEach(field => {
    // Draw label
    page.drawText(field.label, {
      x: field.x,
      y: field.y,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Draw field box
    page.drawRectangle({
      x: field.fieldX,
      y: field.fieldY,
      width: field.fieldW,
      height: field.fieldH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
  });

  // Checkboxes
  page.drawText('Geschlecht:', {
    x: 50,
    y: 480,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('[ ] Männlich', {
    x: 150,
    y: 480,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('[ ] Weiblich', {
    x: 250,
    y: 480,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // School Information
  page.drawText('Schulinformationen:', {
    x: 50,
    y: 440,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText('Schule:', {
    x: 50,
    y: 410,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: 150,
    y: 405,
    width: 200,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawText('Klasse:', {
    x: 50,
    y: 380,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: 150,
    y: 375,
    width: 100,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Additional checkboxes
  page.drawText('[ ] Deutsch als Muttersprache', {
    x: 50,
    y: 340,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('[ ] Schulbus benötigt', {
    x: 50,
    y: 310,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Notes section
  page.drawText('Zusätzliche Bemerkungen:', {
    x: 50,
    y: 270,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawRectangle({
    x: 50,
    y: 200,
    width: 500,
    height: 60,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('real_test_form.pdf', pdfBytes);
  
  console.log('✅ Real test PDF created: real_test_form.pdf');
}

createRealTestPDF().catch(console.error);
