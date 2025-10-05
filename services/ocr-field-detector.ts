import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

interface OCRField {
  name: string;
  suggestedMapping: string;
  confidence: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  context: string;
  fieldType: 'text' | 'checkbox' | 'date' | 'email' | 'phone';
}

interface OCRResult {
  detectedFields: OCRField[];
  extractedText: string;
  confidence: number;
  suggestedMappings: Record<string, string>;
}

export class OCRFieldDetector {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('deu', 1, {
        logger: m => console.log('OCR:', m)
      });
    }
  }

  async analyzePDFWithOCR(pdfBytes: Uint8Array): Promise<OCRResult> {
    try {
      await this.initialize();

      // Convert PDF to images for OCR analysis
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      console.log(`OCR: Analyzing ${pages.length} PDF pages...`);

      let allDetectedFields: OCRField[] = [];
      let combinedText = '';
      let totalConfidence = 0;

      // Process each page
      for (let i = 0; i < Math.min(pages.length, 3); i++) { // Limit to first 3 pages for performance
        console.log(`OCR: Processing page ${i + 1}...`);

        // This would need a PDF-to-image conversion
        // For now, we'll simulate OCR analysis with text patterns
        const pageText = await this.simulateOCRAnalysis(i);
        const pageFields = this.extractFieldsFromText(pageText, i);

        allDetectedFields.push(...pageFields);
        combinedText += pageText + '\n';
        totalConfidence += 85; // Simulated confidence
      }

      const suggestedMappings = this.generateSmartMappings(allDetectedFields, combinedText);

      return {
        detectedFields: allDetectedFields,
        extractedText: combinedText,
        confidence: totalConfidence / pages.length,
        suggestedMappings
      };

    } catch (error) {
      console.error('OCR Analysis failed:', error);
      return {
        detectedFields: [],
        extractedText: '',
        confidence: 0,
        suggestedMappings: {}
      };
    }
  }

  // Simulate OCR analysis for demo (replace with real OCR when PDF-to-image conversion is available)
  private async simulateOCRAnalysis(pageNumber: number): Promise<string> {
    // Simulate different form sections found via OCR
    const simulatedTexts = [
      `
      PERSONALIEN KIND
      Name: ________________
      Vorname: ______________
      Geburtsdatum: _________
      Geschlecht: □ männlich □ weiblich
      Nationalität: _________
      Bürgerort: ___________
      Erstsprache: _________
      Umgangssprache in der Familie: ________

      PERSONALIEN MUTTER
      Vorname: _____________
      Name: _______________
      Adresse: ____________
      Mobile: _____________
      E-Mail: _____________

      PERSONALIEN VATER
      Vorname: _____________
      Name: _______________
      Adresse: ____________
      Mobile: _____________
      E-Mail: _____________
      `,
      `
      ANMELDUNG KINDERGARTEN/SCHULE
      Gewünschtes Eintrittsdatum: __________
      Bisherige Schule: ________________
      Klasse: _________________________

      KONTAKTPERSON NOTFALL
      Name und Vorname: _______________
      Telefonnummer: _________________

      MEDIZINISCHE ANGABEN
      Allergien: ____________________
      Besondere Bedürfnisse: ________
      `,
      `
      ZUSÄTZLICHE INFORMATIONEN
      Deutschkenntnisse: □ gut □ mittel □ keine
      Tagesschule: □ ja □ nein
      Bemerkungen: __________________

      UNTERSCHRIFT
      Ort, Datum: __________________
      Unterschrift Erziehungsberechtigte: ____________
      `
    ];

    return simulatedTexts[pageNumber] || simulatedTexts[0];
  }

  private extractFieldsFromText(text: string, pageNumber: number): OCRField[] {
    const fields: OCRField[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentSection = '';
    let yPosition = 0;

    for (const line of lines) {
      yPosition += 30; // Simulate line spacing

      // Detect section headers
      if (line.includes('PERSONALIEN') || line.includes('ANMELDUNG') || line.includes('KONTAKT') || line.includes('MEDIZIN')) {
        currentSection = line.trim();
        continue;
      }

      // Extract field patterns
      const fieldMatch = line.match(/([^:_]+):\s*[_\s]+/);
      if (fieldMatch) {
        const fieldLabel = fieldMatch[1].trim();
        const suggestedMapping = this.mapLabelToField(fieldLabel, currentSection);

        fields.push({
          name: this.normalizeFieldName(fieldLabel),
          suggestedMapping,
          confidence: this.calculateFieldConfidence(fieldLabel, currentSection),
          position: {
            x: 50,
            y: yPosition,
            width: 200,
            height: 20
          },
          context: currentSection,
          fieldType: this.detectFieldType(fieldLabel)
        });
      }

      // Detect checkbox patterns
      const checkboxMatch = line.match(/□\s*([^□]+)/g);
      if (checkboxMatch) {
        checkboxMatch.forEach((match, index) => {
          const option = match.replace('□', '').trim();
          fields.push({
            name: this.normalizeFieldName(option),
            suggestedMapping: this.mapLabelToField(option, currentSection),
            confidence: 90,
            position: {
              x: 50 + (index * 100),
              y: yPosition,
              width: 80,
              height: 20
            },
            context: currentSection,
            fieldType: 'checkbox'
          });
        });
      }
    }

    console.log(`OCR: Extracted ${fields.length} fields from page ${pageNumber + 1}`);
    return fields;
  }

  private mapLabelToField(label: string, context: string): string {
    const labelLower = label.toLowerCase();
    const contextLower = context.toLowerCase();

    // Child fields
    if (contextLower.includes('kind')) {
      if (labelLower.includes('vorname')) return 'child.first_name';
      if (labelLower.includes('name')) return 'child.last_name';
      if (labelLower.includes('geburt')) return 'child.date_of_birth';
      if (labelLower.includes('geschlecht')) return 'child.gender';
      if (labelLower.includes('nationalität')) return 'child.nationality';
      if (labelLower.includes('bürgerort')) return 'child.birth_place';
      if (labelLower.includes('erstsprache')) return 'child.preferred_language';
      if (labelLower.includes('männlich')) return 'child.gender.male';
      if (labelLower.includes('weiblich')) return 'child.gender.female';
    }

    // Mother fields
    if (contextLower.includes('mutter')) {
      if (labelLower.includes('vorname')) return 'user.first_name';
      if (labelLower.includes('name')) return 'user.last_name';
      if (labelLower.includes('adresse')) return 'user.address';
      if (labelLower.includes('mobile')) return 'user.phone';
      if (labelLower.includes('e-mail')) return 'user.email';
    }

    // Father fields
    if (contextLower.includes('vater')) {
      if (labelLower.includes('vorname')) return 'user.partner_first_name';
      if (labelLower.includes('name')) return 'user.partner_last_name';
      if (labelLower.includes('adresse')) return 'user.address';
      if (labelLower.includes('mobile')) return 'user.partner_phone';
      if (labelLower.includes('e-mail')) return 'user.partner_email';
    }

    // Medical fields
    if (labelLower.includes('allergie')) return 'child.allergies';
    if (labelLower.includes('besondere')) return 'child.special_needs';
    if (labelLower.includes('medizin')) return 'child.medical_conditions';

    // School fields
    if (labelLower.includes('schule')) return 'child.previous_school';
    if (labelLower.includes('klasse')) return 'child.school_grade';
    if (labelLower.includes('eintritt')) return 'admin.entry_date';

    // Administrative
    if (labelLower.includes('datum')) return 'admin.current_date';
    if (labelLower.includes('unterschrift')) return 'admin.signature';

    return `unknown.${labelLower.replace(/[^a-z0-9]/g, '_')}`;
  }

  private normalizeFieldName(label: string): string {
    return label.toLowerCase()
      .replace(/[äöüß]/g, match => ({
        'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss'
      }[match] || match))
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private calculateFieldConfidence(label: string, context: string): number {
    let confidence = 60; // Base confidence

    // Boost confidence for clear patterns
    if (label.includes('name') || label.includes('vorname')) confidence += 20;
    if (label.includes('datum') || label.includes('birth')) confidence += 15;
    if (label.includes('email') || label.includes('mobile')) confidence += 25;
    if (context && context.length > 0) confidence += 10;

    return Math.min(confidence, 95);
  }

  private detectFieldType(label: string): 'text' | 'checkbox' | 'date' | 'email' | 'phone' {
    const labelLower = label.toLowerCase();

    if (labelLower.includes('datum') || labelLower.includes('date')) return 'date';
    if (labelLower.includes('email') || labelLower.includes('e-mail')) return 'email';
    if (labelLower.includes('telefon') || labelLower.includes('mobile')) return 'phone';
    if (labelLower.includes('männlich') || labelLower.includes('weiblich')) return 'checkbox';

    return 'text';
  }

  private generateSmartMappings(fields: OCRField[], fullText: string): Record<string, string> {
    const mappings: Record<string, string> = {};

    // Group fields by context and create intelligent mappings
    const fieldsByContext = this.groupFieldsByContext(fields);

    for (const [context, contextFields] of Object.entries(fieldsByContext)) {
      for (const field of contextFields) {
        // Create normalized field names for PDF mapping
        const pdfFieldName = this.generatePDFFieldName(field, context);
        mappings[pdfFieldName] = field.suggestedMapping;
      }
    }

    console.log('OCR: Generated smart mappings:', mappings);
    return mappings;
  }

  private groupFieldsByContext(fields: OCRField[]): Record<string, OCRField[]> {
    const grouped: Record<string, OCRField[]> = {};

    for (const field of fields) {
      const context = field.context || 'general';
      if (!grouped[context]) grouped[context] = [];
      grouped[context].push(field);
    }

    return grouped;
  }

  private generatePDFFieldName(field: OCRField, context: string): string {
    const contextLower = context.toLowerCase();
    let prefix = '';

    if (contextLower.includes('mutter')) prefix = 'mutter_';
    else if (contextLower.includes('vater')) prefix = 'vater_';
    else if (contextLower.includes('kind')) prefix = 'kind_';

    return prefix + field.name;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const ocrDetector = new OCRFieldDetector();