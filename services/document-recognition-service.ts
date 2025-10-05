import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DocumentAnalysis {
  documentType: string;
  confidence: number;
  tags: string[];
  description: string;
  extractedText: string;
  detectedLanguage: string;
}

export interface RecognizedDocument {
  type: 'passport' | 'driver_license' | 'residence_permit' | 'birth_certificate' | 'marriage_certificate' | 'diploma' | 'contract' | 'insurance' | 'bank_statement' | 'tax_document' | 'medical_record' | 'other';
  confidence: number;
  tags: string[];
  description: string;
}

class DocumentRecognitionService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyC8CHSLaNtftBtpLqk2HDuFX5Jiq98Pifo';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI initialized successfully');
    } else {
      console.warn('Gemini API key not found. AI analysis will use fallback pattern matching.');
    }
  }

  async analyzeDocument(file: File): Promise<DocumentAnalysis> {
    try {
      console.log('🔍 Starting document analysis for:', file.name);
      
      // Step 0: Quick filename analysis for obvious cases
      const filenameAnalysis = this.analyzeFilename(file.name);
      if (filenameAnalysis.confidence > 0.8) {
        console.log('📁 High confidence filename match:', filenameAnalysis);
        return {
          documentType: filenameAnalysis.type,
          confidence: filenameAnalysis.confidence,
          tags: filenameAnalysis.tags,
          description: filenameAnalysis.description,
          extractedText: '',
          detectedLanguage: 'unknown'
        };
      }
      
      // Step 1: Extract text using OCR
      const extractedText = await this.extractTextFromImage(file);
      console.log('📝 OCR extracted text:', extractedText.substring(0, 200) + '...');

      // Step 2: Analyze with AI to determine document type
      const aiAnalysis = await this.analyzeWithAI(extractedText, file);
      console.log('🤖 AI Analysis result:', aiAnalysis);

      // Step 3: Enhance with pattern matching
      const enhancedAnalysis = this.enhanceWithPatterns(extractedText, aiAnalysis);
      console.log('✨ Enhanced analysis result:', enhancedAnalysis);

      return {
        ...enhancedAnalysis,
        extractedText,
        detectedLanguage: this.detectLanguage(extractedText)
      };
    } catch (error) {
      console.error('❌ Document analysis failed:', error);
      throw new Error('Failed to analyze document');
    }
  }

  private async extractTextFromImage(file: File): Promise<string> {
    try {
      // Use Swiss languages: German, French, Italian, English, and Romansh
      const { data: { text } } = await Tesseract.recognize(file, 'deu+eng+fra+ita', {
        logger: m => console.log('OCR Progress:', m),
        // Optimize for Swiss documents
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÄÖÜäöüßÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ.,-:()[]{}"/\\',
        preserve_interword_spaces: '1'
      });
      console.log('✅ OCR extraction completed:', text.substring(0, 100) + '...');
      return text;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  private async analyzeWithAI(text: string, file: File): Promise<RecognizedDocument> {
    try {
      // If no API key is available, use fallback pattern analysis
      if (!this.genAI) {
        console.log('Using fallback pattern analysis (no API key)');
        return this.fallbackPatternAnalysis(text);
      }

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Convert file to base64 for image analysis
      const base64 = await this.fileToBase64(file);

      const prompt = `
        You are an expert document classifier specializing in Swiss official documents. Analyze this document image and extracted text to determine the exact document type.

        Extracted Text: "${text}"

        Classify this document as one of these types (be very specific):
        - passport (Reisepass, Passport, Passeport, Pass 2.0, Pass Version) - Swiss red passport with eagle, any document with "Pass" in filename
        - driver_license (Führerschein, Driver's License, Permis de conduire) - Swiss driving license
        - residence_permit (Aufenthaltsbewilligung, Residence Permit, Permis de séjour) - Swiss residence permit card
        - birth_certificate (Geburtsurkunde, Birth Certificate, Acte de naissance) - Official birth record
        - marriage_certificate (Heiratsurkunde, Marriage Certificate, Certificat de mariage) - Marriage record
        - diploma (Diplom, Diploma, Diplôme, Zeugnis) - Educational certificates, university diplomas
        - contract (Vertrag, Contract, Contrat) - Rental agreements, employment contracts
        - insurance (Versicherung, Insurance, Assurance) - Health insurance cards, policy documents
        - bank_statement (Kontoauszug, Bank Statement, Relevé bancaire) - Bank account statements
        - tax_document (Steuerdokument, Tax Document, Document fiscal) - Tax forms, tax certificates
        - medical_record (Krankenakte, Medical Record, Dossier médical) - Medical documents, prescriptions
        - id_card (ID-Karte, Identity Card, Carte d'identité) - Swiss ID card, foreign ID cards
        - work_permit (Arbeitsbewilligung, Work Permit, Permis de travail) - Work authorization documents
        - other (if none of the above fit)

        IMPORTANT: If the filename contains "Pass" (like "Pass 2.0"), it's almost certainly a passport document!

        IMPORTANT: Look for Swiss-specific elements:
        - Swiss cross/flag symbols
        - "Schweizerische Eidgenossenschaft" or "Confédération Suisse"
        - Swiss German, French, Italian, or Romansh text
        - Swiss postal codes (4 digits)
        - Swiss phone numbers (+41)
        - Swiss IBAN format (CH...)

        Respond with JSON format:
        {
          "type": "document_type",
          "confidence": 0.95,
          "tags": ["swiss", "official", "passport", "travel"],
          "description": "Swiss passport issued by the Swiss Confederation"
        }

        Confidence should be between 0.0 and 1.0 (be conservative, only high confidence for clear matches).
        Tags should include: document type, country (swiss/foreign), language, and relevant keywords.
      `;

      const imagePart = {
        inlineData: {
          data: base64.split(',')[1],
          mimeType: file.type
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text_response = response.text();

      // Extract JSON from response
      const jsonMatch = text_response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        type: analysis.type,
        confidence: Math.min(Math.max(analysis.confidence, 0), 1),
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
        description: analysis.description || 'Document analysis'
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fallback to pattern matching
      return this.fallbackPatternAnalysis(text);
    }
  }

  private enhanceWithPatterns(text: string, aiAnalysis: RecognizedDocument): RecognizedDocument {
    const patterns = {
      passport: [
        /reisepass/i, /passport/i, /passeport/i,
        /swiss.*confederation/i, /schweizerische.*eidgenossenschaft/i,
        /passport.*number/i, /pass.*nr/i, /pass.*no/i,
        /confédération.*suisse/i, /confederazione.*svizzera/i,
        /pass\s*2\.0/i, /pass\s*\d/i, /pass\s*version/i
      ],
      driver_license: [
        /führerschein/i, /driver.*license/i, /permis.*conduire/i,
        /fahrerlaubnis/i, /driving.*licence/i, /patente.*guida/i,
        /licence.*conduire/i, /patent.*de.*conduire/i
      ],
      residence_permit: [
        /aufenthaltsbewilligung/i, /residence.*permit/i, /permis.*séjour/i,
        /aufenthaltstitel/i, /permit.*[a-z]/i, /autorisation.*séjour/i,
        /permesso.*soggiorno/i, /aufenthaltsbewilligung/i
      ],
      birth_certificate: [
        /geburtsurkunde/i, /birth.*certificate/i, /acte.*naissance/i,
        /geboren/i, /born/i, /né.*le/i, /nato.*il/i, /atto.*nascita/i,
        /certificat.*naissance/i, /geburtsurkunde/i
      ],
      marriage_certificate: [
        /heiratsurkunde/i, /marriage.*certificate/i, /certificat.*mariage/i,
        /eheschließung/i, /married/i, /marié/i, /sposato/i, /atto.*matrimonio/i,
        /certificat.*mariage/i, /trauungsurkunde/i
      ],
      diploma: [
        /diplom/i, /diploma/i, /diplôme/i, /zeugnis/i, /certificate/i, /certificat/i,
        /universität/i, /university/i, /université/i, /hochschule/i, /università/i,
        /eth.*zürich/i, /university.*zurich/i, /université.*genève/i
      ],
      bank_statement: [
        /kontoauszug/i, /bank.*statement/i, /relevé.*bancaire/i,
        /iban/i, /swift/i, /account.*number/i, /konto.*nr/i, /estratto.*conto/i,
        /ch\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/i, /swiss.*bank/i
      ],
      insurance: [
        /versicherung/i, /insurance/i, /assurance/i, /assicurazione/i,
        /police.*number/i, /versicherungs.*nr/i, /krankenversicherung/i,
        /swisscare/i, /css.*insurance/i, /sanitas/i, /helsana/i
      ],
      id_card: [
        /id.*karte/i, /identity.*card/i, /carte.*identité/i, /carta.*identità/i,
        /personalausweis/i, /carte.*d'identité/i, /documento.*identità/i
      ],
      work_permit: [
        /arbeitsbewilligung/i, /work.*permit/i, /permis.*travail/i, /permesso.*lavoro/i,
        /autorisation.*travail/i, /work.*authorization/i
      ]
    };

    let enhancedConfidence = aiAnalysis.confidence;
    let enhancedTags = [...aiAnalysis.tags];

    // Check pattern matches
    for (const [docType, patternList] of Object.entries(patterns)) {
      const matches = patternList.filter(pattern => pattern.test(text)).length;
      if (matches > 0) {
        if (docType === aiAnalysis.type) {
          enhancedConfidence = Math.min(enhancedConfidence + (matches * 0.1), 1.0);
        }
        enhancedTags.push(docType);
      }
    }

    // Add Swiss-specific tags
    if (/schweiz|swiss|suisse|svizzera|schweizerische|confédération.*suisse|confederazione.*svizzera/i.test(text)) {
      enhancedTags.push('swiss', 'official');
    }

    // Add Swiss institutions
    if (/eth.*zürich|university.*zurich|université.*genève|università.*lugano/i.test(text)) {
      enhancedTags.push('swiss', 'university', 'education');
    }

    // Add Swiss banks
    if (/ubs|credit.*suisse|postfinance|raiffeisen|zürcher.*kantonalbank/i.test(text)) {
      enhancedTags.push('swiss', 'bank', 'financial');
    }

    // Add Swiss insurance companies
    if (/swisscare|css|sanitas|helsana|swica|kpt/i.test(text)) {
      enhancedTags.push('swiss', 'insurance', 'health');
    }

    // Add language tags
    const language = this.detectLanguage(text);
    enhancedTags.push(language);

    // Ensure document type is the first tag
    const finalTags = [...new Set(enhancedTags)];
    const documentTypeTag = aiAnalysis.type;
    if (!finalTags.includes(documentTypeTag)) {
      finalTags.unshift(documentTypeTag);
    } else {
      // Move document type to front
      const index = finalTags.indexOf(documentTypeTag);
      finalTags.splice(index, 1);
      finalTags.unshift(documentTypeTag);
    }

    return {
      ...aiAnalysis,
      confidence: enhancedConfidence,
      tags: finalTags
    };
  }

  private fallbackPatternAnalysis(text: string): RecognizedDocument {
    const simplePatterns = [
      { type: 'passport' as const, patterns: [/reisepass/i, /passport/i, /pass\s*2\.0/i, /pass\s*\d/i, /passeport/i], confidence: 0.8 },
      { type: 'driver_license' as const, patterns: [/führerschein/i, /driver.*license/i, /permis.*conduire/i], confidence: 0.7 },
      { type: 'residence_permit' as const, patterns: [/aufenthaltsbewilligung/i, /residence.*permit/i, /permis.*séjour/i], confidence: 0.7 },
      { type: 'birth_certificate' as const, patterns: [/geburtsurkunde/i, /birth.*certificate/i, /acte.*naissance/i], confidence: 0.7 },
      { type: 'diploma' as const, patterns: [/diplom/i, /diploma/i, /zeugnis/i, /certificate/i], confidence: 0.6 },
      { type: 'bank_statement' as const, patterns: [/kontoauszug/i, /bank.*statement/i, /iban/i, /relevé.*bancaire/i], confidence: 0.6 },
      { type: 'id_card' as const, patterns: [/id.*karte/i, /identity.*card/i, /carte.*identité/i], confidence: 0.7 }
    ];

    for (const { type, patterns, confidence } of simplePatterns) {
      if (patterns.some(pattern => pattern.test(text))) {
        return {
          type,
          confidence,
          tags: [type, 'pattern_matched'],
          description: `Document identified as ${type} through pattern matching`
        };
      }
    }

    return {
      type: 'other',
      confidence: 0.3,
      tags: ['unknown', 'manual_review_needed'],
      description: 'Document type could not be determined automatically'
    };
  }

  private analyzeFilename(filename: string): RecognizedDocument {
    const lowerFilename = filename.toLowerCase();
    
    // Passport patterns - HIGH PRIORITY for "Pass 2.0"
    if (/pass\s*2\.0|pass\s*\d|passport|reisepass|passeport/i.test(lowerFilename)) {
      return {
        type: 'passport',
        confidence: 0.95,
        tags: ['passport', 'swiss', 'official'],
        description: 'Swiss passport document identified from filename'
      };
    }
    
    // Driver license patterns
    if (/führerschein|driver.*license|permis.*conduire|patente/i.test(lowerFilename)) {
      return {
        type: 'driver_license',
        confidence: 0.9,
        tags: ['driver_license', 'swiss', 'official'],
        description: 'Driver license document identified from filename'
      };
    }
    
    // ID card patterns
    if (/id.*karte|identity.*card|carte.*identité|personalausweis/i.test(lowerFilename)) {
      return {
        type: 'id_card',
        confidence: 0.9,
        tags: ['id_card', 'swiss', 'official'],
        description: 'ID card document identified from filename'
      };
    }
    
    // Residence permit patterns
    if (/aufenthaltsbewilligung|residence.*permit|permis.*séjour/i.test(lowerFilename)) {
      return {
        type: 'residence_permit',
        confidence: 0.9,
        tags: ['residence_permit', 'swiss', 'official'],
        description: 'Residence permit document identified from filename'
      };
    }
    
    // Birth certificate patterns
    if (/geburtsurkunde|birth.*certificate|acte.*naissance/i.test(lowerFilename)) {
      return {
        type: 'birth_certificate',
        confidence: 0.9,
        tags: ['birth_certificate', 'official'],
        description: 'Birth certificate document identified from filename'
      };
    }
    
    // Diploma patterns
    if (/diplom|diploma|zeugnis|certificate/i.test(lowerFilename)) {
      return {
        type: 'diploma',
        confidence: 0.8,
        tags: ['diploma', 'education'],
        description: 'Educational document identified from filename'
      };
    }
    
    // Bank statement patterns
    if (/kontoauszug|bank.*statement|relevé.*bancaire/i.test(lowerFilename)) {
      return {
        type: 'bank_statement',
        confidence: 0.8,
        tags: ['bank_statement', 'financial'],
        description: 'Bank statement document identified from filename'
      };
    }
    
    // Insurance patterns
    if (/versicherung|insurance|assurance|police/i.test(lowerFilename)) {
      return {
        type: 'insurance',
        confidence: 0.8,
        tags: ['insurance', 'health'],
        description: 'Insurance document identified from filename'
      };
    }
    
    return {
      type: 'other',
      confidence: 0.1,
      tags: ['unknown'],
      description: 'Document type could not be determined from filename'
    };
  }

  private detectLanguage(text: string): string {
    const languages = [
      { code: 'german', patterns: [/der|die|das|und|mit|von|zu|in|für|auf|an|bei|nach/i] },
      { code: 'french', patterns: [/le|la|les|de|du|des|et|avec|pour|dans|sur|par/i] },
      { code: 'italian', patterns: [/il|la|le|di|del|della|e|con|per|in|su/i] },
      { code: 'english', patterns: [/the|and|with|for|in|on|at|by|from|to/i] }
    ];

    let maxMatches = 0;
    let detectedLanguage = 'unknown';

    for (const { code, patterns } of languages) {
      const matches = patterns.filter(pattern => pattern.test(text)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLanguage = code;
      }
    }

    return detectedLanguage;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Email attachment helpers
  static getEmailTemplates() {
    return {
      passport: {
        subject: 'Passport Copy Required',
        body: 'Please find attached a copy of my passport as requested.'
      },
      driver_license: {
        subject: 'Driver License Copy',
        body: 'Please find attached a copy of my driver license.'
      },
      residence_permit: {
        subject: 'Residence Permit Documentation',
        body: 'Please find attached my residence permit documentation.'
      },
      birth_certificate: {
        subject: 'Birth Certificate',
        body: 'Please find attached my birth certificate as requested.'
      },
      marriage_certificate: {
        subject: 'Marriage Certificate',
        body: 'Please find attached my marriage certificate.'
      },
      diploma: {
        subject: 'Educational Credentials',
        body: 'Please find attached my educational credentials/diploma.'
      },
      bank_statement: {
        subject: 'Bank Statement',
        body: 'Please find attached my bank statement as requested.'
      },
      insurance: {
        subject: 'Insurance Documentation',
        body: 'Please find attached my insurance documentation.'
      }
    };
  }

  static createMailtoLink(documentType: string, recipientEmail: string = '', attachmentName: string): string {
    const templates = this.getEmailTemplates();
    const template = templates[documentType as keyof typeof templates] || {
      subject: 'Document Attachment',
      body: 'Please find attached the requested document.'
    };

    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(`${template.body}\n\nDocument: ${attachmentName}`);

    return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  }
}

export default DocumentRecognitionService;