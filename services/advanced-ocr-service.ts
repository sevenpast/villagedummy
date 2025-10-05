import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface OCRTextBlock {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  page: number;
}

interface OCRResult {
  textBlocks: OCRTextBlock[];
  fullText: string;
  confidence: number;
  pageCount: number;
}

export class AdvancedOCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('deu+eng', 1, {
        logger: m => console.log('OCR:', m)
      });
    }
  }

  async processPDFWithOCR(pdfBytes: Uint8Array): Promise<OCRResult> {
    try {
      await this.initialize();

      console.log('🔍 Starting advanced OCR processing...');

      // Convert PDF to images
      const images = await this.convertPDFToImages(pdfBytes);
      console.log(`📄 Converted PDF to ${images.length} images`);

      let allTextBlocks: OCRTextBlock[] = [];
      let combinedText = '';
      let totalConfidence = 0;

      // Process each page
      for (let i = 0; i < images.length; i++) {
        console.log(`🔍 Processing page ${i + 1}/${images.length}...`);

        const pageResult = await this.processImageWithOCR(images[i], i);
        allTextBlocks.push(...pageResult.textBlocks);
        combinedText += pageResult.fullText + '\n';
        totalConfidence += pageResult.confidence;
      }

      const averageConfidence = totalConfidence / images.length;

      console.log(`✅ OCR completed: ${allTextBlocks.length} text blocks, ${averageConfidence.toFixed(1)}% confidence`);

      return {
        textBlocks: allTextBlocks,
        fullText: combinedText,
        confidence: averageConfidence,
        pageCount: images.length
      };

    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  private async convertPDFToImages(pdfBytes: Uint8Array): Promise<HTMLCanvasElement[]> {
    const images: HTMLCanvasElement[] = [];

    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher resolution for better OCR

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        images.push(canvas);
      }

    } catch (error) {
      console.error('PDF to image conversion failed:', error);
      throw new Error(`PDF conversion failed: ${error.message}`);
    }

    return images;
  }

  private async processImageWithOCR(canvas: HTMLCanvasElement, pageNumber: number): Promise<{
    textBlocks: OCRTextBlock[];
    fullText: string;
    confidence: number;
  }> {
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    // Convert canvas to image data
    const imageData = canvas.toDataURL('image/png');

    // Perform OCR
    const { data } = await this.worker.recognize(imageData);

    const textBlocks: OCRTextBlock[] = [];
    let fullText = '';
    let totalConfidence = 0;
    let blockCount = 0;

    // Process each word/block
    data.words.forEach((word: any) => {
      if (word.confidence > 30) { // Filter low confidence words
        const textBlock: OCRTextBlock = {
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1
          },
          page: pageNumber
        };

        textBlocks.push(textBlock);
        fullText += word.text + ' ';
        totalConfidence += word.confidence;
        blockCount++;
      }
    });

    const averageConfidence = blockCount > 0 ? totalConfidence / blockCount : 0;

    return {
      textBlocks,
      fullText: fullText.trim(),
      confidence: averageConfidence
    };
  }

  async detectFormFieldsFromOCR(ocrResult: OCRResult): Promise<Array<{
    name: string;
    type: 'text' | 'checkbox' | 'date' | 'email' | 'phone' | 'select';
    position: { x: number; y: number; width: number; height: number };
    confidence: number;
    originalText: string;
    suggestedTranslation: string;
    contextHints: string[];
    isRequired: boolean;
  }>> {
    const detectedFields: any[] = [];

    // Enhanced pattern matching for Swiss/German form fields
    const fieldPatterns = [
      // Personal information
      { pattern: /vorname|first\s*name/i, type: 'text' as const, translation: 'First Name', contextHints: ['personal'] },
      { pattern: /nachname|last\s*name|surname|familienname/i, type: 'text' as const, translation: 'Last Name', contextHints: ['personal'] },
      { pattern: /name(?!.*vorname)(?!.*nach)/i, type: 'text' as const, translation: 'Name', contextHints: ['personal'] },

      // Date fields
      { pattern: /geburt|birth|geboren/i, type: 'date' as const, translation: 'Date of Birth', contextHints: ['personal', 'date'] },
      { pattern: /datum(?!.*geburt)/i, type: 'date' as const, translation: 'Date', contextHints: ['date', 'administrative'] },
      { pattern: /eintrittsdatum|entry.*date/i, type: 'date' as const, translation: 'Entry Date', contextHints: ['date', 'school'] },

      // Gender fields - usually checkboxes
      { pattern: /geschlecht|gender|sex/i, type: 'checkbox' as const, translation: 'Gender', contextHints: ['demographic', 'checkbox'] },
      { pattern: /männlich|male/i, type: 'checkbox' as const, translation: 'Male', contextHints: ['demographic', 'checkbox'] },
      { pattern: /weiblich|female/i, type: 'checkbox' as const, translation: 'Female', contextHints: ['demographic', 'checkbox'] },

      // Nationality and origin
      { pattern: /nationalität|nationality/i, type: 'select' as const, translation: 'Nationality', contextHints: ['demographic'] },
      { pattern: /staatsangehörigkeit|citizenship/i, type: 'select' as const, translation: 'Citizenship', contextHints: ['demographic'] },
      { pattern: /geburtsort|birth.*place/i, type: 'text' as const, translation: 'Place of Birth', contextHints: ['personal', 'location'] },
      { pattern: /bürgerort|heimatort/i, type: 'text' as const, translation: 'Place of Citizenship', contextHints: ['personal', 'location'] },

      // Address components
      { pattern: /adresse|address|anschrift/i, type: 'text' as const, translation: 'Address', contextHints: ['address'] },
      { pattern: /straße|strasse|street/i, type: 'text' as const, translation: 'Street', contextHints: ['address'] },
      { pattern: /hausnummer|house.*number/i, type: 'text' as const, translation: 'House Number', contextHints: ['address'] },
      { pattern: /plz|postal|zip/i, type: 'text' as const, translation: 'Postal Code', contextHints: ['address'] },
      { pattern: /ort(?!.*geburt)|city|stadt/i, type: 'text' as const, translation: 'City', contextHints: ['address'] },

      // Contact information
      { pattern: /telefon|phone|tel(?!.*email)/i, type: 'phone' as const, translation: 'Phone', contextHints: ['contact'] },
      { pattern: /mobile|handy|mobilnummer/i, type: 'phone' as const, translation: 'Mobile', contextHints: ['contact'] },
      { pattern: /email|e-mail|e_mail|mail/i, type: 'email' as const, translation: 'Email', contextHints: ['contact'] },

      // Language fields
      { pattern: /sprache|language|muttersprache/i, type: 'select' as const, translation: 'Language', contextHints: ['demographic'] },
      { pattern: /erstsprache|first.*language/i, type: 'select' as const, translation: 'First Language', contextHints: ['demographic'] },
      { pattern: /heimatsprache|native.*language/i, type: 'select' as const, translation: 'Native Language', contextHints: ['demographic'] },

      // School information
      { pattern: /schule|school/i, type: 'text' as const, translation: 'School', contextHints: ['school'] },
      { pattern: /klasse|grade|schulklasse/i, type: 'select' as const, translation: 'Grade/Class', contextHints: ['school'] },
      { pattern: /stufe|level/i, type: 'select' as const, translation: 'Level', contextHints: ['school'] },

      // Medical and special needs
      { pattern: /allergien|allergies|allergy/i, type: 'text' as const, translation: 'Allergies', contextHints: ['medical'] },
      { pattern: /medizin|medical|gesundheit|health/i, type: 'text' as const, translation: 'Medical Information', contextHints: ['medical'] },
      { pattern: /besondere.*bedürfnisse|special.*needs/i, type: 'text' as const, translation: 'Special Needs', contextHints: ['medical'] },

      // Yes/No questions - usually checkboxes
      { pattern: /tagesschule|ganztag/i, type: 'checkbox' as const, translation: 'All-Day School', contextHints: ['school', 'checkbox'] },
      { pattern: /alleinerziehend|single.*parent/i, type: 'checkbox' as const, translation: 'Single Parent', contextHints: ['family', 'checkbox'] },
      { pattern: /beide.*eltern|both.*parents/i, type: 'checkbox' as const, translation: 'Both Parents', contextHints: ['family', 'checkbox'] },
      { pattern: /ja\s*\/\s*nein|yes\s*\/\s*no/i, type: 'checkbox' as const, translation: 'Yes/No', contextHints: ['checkbox'] },

      // Administrative
      { pattern: /unterschrift|signature/i, type: 'text' as const, translation: 'Signature', contextHints: ['administrative'] },
      { pattern: /bemerkungen|comments|anmerkungen/i, type: 'text' as const, translation: 'Comments', contextHints: ['administrative'] },
      { pattern: /hinweise|notes/i, type: 'text' as const, translation: 'Notes', contextHints: ['administrative'] }
    ];

    // Analyze each text block
    ocrResult.textBlocks.forEach(block => {
      fieldPatterns.forEach(({ pattern, type, translation, contextHints }) => {
        if (pattern.test(block.text)) {
          // Look for nearby input areas (lines, boxes, etc.)
          const nearbyBlocks = ocrResult.textBlocks.filter(otherBlock =>
            otherBlock.page === block.page &&
            Math.abs(otherBlock.bbox.x0 - block.bbox.x1) < 150 && // Increased range for better detection
            Math.abs(otherBlock.bbox.y0 - block.bbox.y0) < 30     // Tighter vertical range
          );

          // Check for required field indicators
          const isRequired = /\*|required|pflicht|obligator/i.test(block.text) ||
                           nearbyBlocks.some(b => /\*|required|pflicht|obligator/i.test(b.text));

          // Enhanced position detection for form fields
          const fieldPosition = this.detectFormFieldPosition(block, nearbyBlocks, ocrResult.textBlocks);

          detectedFields.push({
            name: this.generateFieldName(block.text),
            type,
            position: fieldPosition,
            confidence: Math.min(95, block.confidence + 10), // Boost confidence for recognized patterns
            originalText: block.text,
            suggestedTranslation: translation,
            contextHints,
            isRequired
          });
        }
      });
    });

    // Post-process detected fields to improve accuracy
    const processedFields = this.postProcessDetectedFields(detectedFields, ocrResult);

    console.log(`🔍 OCR detected ${processedFields.length} potential form fields`);
    return processedFields;
  }

  /**
   * Generate a clean field name from OCR text
   */
  private generateFieldName(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  /**
   * Detect the actual form field position (input area vs label)
   */
  private detectFormFieldPosition(
    labelBlock: OCRTextBlock,
    nearbyBlocks: OCRTextBlock[],
    allBlocks: OCRTextBlock[]
  ): { x: number; y: number; width: number; height: number } {
    const rightSide = {
      x: labelBlock.bbox.x1 + 10,
      y: labelBlock.bbox.y0,
      width: 200,
      height: labelBlock.bbox.y1 - labelBlock.bbox.y0
    };

    const hasOverlappingText = allBlocks.some(block =>
      block.page === labelBlock.page &&
      block.bbox.x0 < rightSide.x + rightSide.width &&
      block.bbox.x1 > rightSide.x &&
      block.bbox.y0 < rightSide.y + rightSide.height &&
      block.bbox.y1 > rightSide.y &&
      block !== labelBlock
    );

    if (!hasOverlappingText) {
      return rightSide;
    }

    return {
      x: labelBlock.bbox.x0,
      y: labelBlock.bbox.y0,
      width: labelBlock.bbox.x1 - labelBlock.bbox.x0,
      height: labelBlock.bbox.y1 - labelBlock.bbox.y0
    };
  }

  /**
   * Post-process detected fields to improve accuracy and remove duplicates
   */
  private postProcessDetectedFields(
    fields: Array<any>,
    ocrResult: OCRResult
  ) {
    const deduplicatedFields = [];

    for (const field of fields) {
      const isDuplicate = deduplicatedFields.some(existing =>
        Math.abs(existing.position.x - field.position.x) < 50 &&
        Math.abs(existing.position.y - field.position.y) < 20
      );

      if (!isDuplicate) {
        const enhancedType = this.enhanceFieldTypeDetection(field, ocrResult);
        deduplicatedFields.push({
          ...field,
          type: enhancedType
        });
      }
    }

    return deduplicatedFields.sort((a, b) => {
      if (Math.abs(a.position.y - b.position.y) < 20) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });
  }

  /**
   * Enhance field type detection based on surrounding context
   */
  private enhanceFieldTypeDetection(field: any, ocrResult: OCRResult): string {
    const text = field.originalText.toLowerCase();

    const nearbyText = ocrResult.textBlocks
      .filter(block => {
        if (!field.position) return false;
        const distance = Math.sqrt(
          Math.pow(block.bbox.x0 - field.position.x, 2) +
          Math.pow(block.bbox.y0 - field.position.y, 2)
        );
        return distance < 100;
      })
      .map(block => block.text.toLowerCase())
      .join(' ');

    if (/□|☐|\[\s*\]|\(\s*\)|○|◯/.test(nearbyText) ||
        /ja\s*\/\s*nein|yes\s*\/\s*no|männlich\s*\/\s*weiblich/.test(nearbyText)) {
      return 'checkbox';
    }

    if (/\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}|__\.__\.____|dd\.mm\.yyyy/.test(nearbyText)) {
      return 'date';
    }

    if (/dropdown|auswahl|wählen|select|option/.test(nearbyText) ||
        (field.contextHints?.includes('demographic') &&
         /nationalität|sprache|klasse|nationality|language|grade/.test(text))) {
      return 'select';
    }

    return field.type;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const advancedOCRService = new AdvancedOCRService();
