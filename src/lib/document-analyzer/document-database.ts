export interface DocumentType {
  id: string;
  name: string;
  keywords: string[];
  germanKeywords: string[];
  frenchKeywords: string[];
  italianKeywords: string[];
  filePatterns: string[];
  confidence: number;
  category: string;
  description: string;
  tags: string[];
}

export class DocumentDatabase {
  private static documentTypes: DocumentType[] = [
    // Passport & ID Documents
    {
      id: 'passport',
      name: 'Reisepass/ID',
      keywords: ['passport', 'pass', 'id', 'identity', 'identity card', 'ausweis', 'reisepass'],
      germanKeywords: ['pass', 'reisepass', 'ausweis', 'identitätskarte', 'personalausweis'],
      frenchKeywords: ['passeport', 'carte d\'identité', 'pièce d\'identité'],
      italianKeywords: ['passaporto', 'carta d\'identità', 'documento d\'identità'],
      filePatterns: ['pass', 'passport', 'id', 'ausweis', 'reisepass'],
      confidence: 0.95,
      category: 'identity',
      description: 'Personal identification documents',
      tags: ['passport', 'identity', 'travel']
    },

    // School Registration
    {
      id: 'school_registration',
      name: 'Schule/Kindergarten',
      keywords: ['school', 'kindergarten', 'registration', 'anmeldung', 'schule', 'kita'],
      germanKeywords: ['anmeldung', 'schule', 'kindergarten', 'kita', 'schulanmeldung', 'einschulung'],
      frenchKeywords: ['inscription', 'école', 'jardin d\'enfants', 'crèche'],
      italianKeywords: ['iscrizione', 'scuola', 'asilo', 'nido'],
      filePatterns: ['anmeldung', 'schule', 'kindergarten', 'kita', 'school', 'registration'],
      confidence: 0.95,
      category: 'education',
      description: 'School and kindergarten registration forms',
      tags: ['education', 'school', 'children', 'registration']
    },

    // Employment Contracts
    {
      id: 'employment',
      name: 'Arbeitsvertrag',
      keywords: ['contract', 'employment', 'work', 'job', 'arbeitsvertrag', 'anstellung'],
      germanKeywords: ['arbeitsvertrag', 'anstellung', 'arbeitsplatz', 'job', 'beruf'],
      frenchKeywords: ['contrat de travail', 'emploi', 'travail'],
      italianKeywords: ['contratto di lavoro', 'impiego', 'lavoro'],
      filePatterns: ['contract', 'employment', 'arbeitsvertrag', 'anstellung', 'work'],
      confidence: 0.90,
      category: 'employment',
      description: 'Work contracts and employment documents',
      tags: ['employment', 'contract', 'work']
    },

    // Diplomas & Certificates
    {
      id: 'diploma',
      name: 'Diplome & Zertifikate',
      keywords: ['diploma', 'certificate', 'cert', 'degree', 'qualification', 'zeugnis', 'diplom'],
      germanKeywords: ['zeugnis', 'diplom', 'zertifikat', 'urkunde', 'bescheinigung', 'abschluss'],
      frenchKeywords: ['diplôme', 'certificat', 'attestation', 'qualification'],
      italianKeywords: ['diploma', 'certificato', 'attestato', 'qualifica'],
      filePatterns: ['diploma', 'cert', 'zeugnis', 'diplom', 'zertifikat', 'degree'],
      confidence: 0.90,
      category: 'education',
      description: 'Educational certificates and diplomas',
      tags: ['education', 'certificate', 'diploma']
    },

    // Rental Agreements
    {
      id: 'rental',
      name: 'Mietvertrag',
      keywords: ['rental', 'lease', 'mietvertrag', 'wohnung', 'apartment'],
      germanKeywords: ['mietvertrag', 'wohnung', 'miete', 'vermietung', 'apartment'],
      frenchKeywords: ['bail', 'location', 'appartement', 'logement'],
      italianKeywords: ['affitto', 'contratto di affitto', 'appartamento'],
      filePatterns: ['mietvertrag', 'rental', 'lease', 'wohnung', 'apartment'],
      confidence: 0.90,
      category: 'housing',
      description: 'Rental and lease agreements',
      tags: ['housing', 'rental', 'lease']
    },

    // Payroll Documents
    {
      id: 'payroll',
      name: 'Lohnabrechnung',
      keywords: ['payroll', 'salary', 'wage', 'lohn', 'gehalt', 'payslip'],
      germanKeywords: ['lohn', 'gehalt', 'lohnabrechnung', 'gehaltsabrechnung', 'payslip'],
      frenchKeywords: ['salaire', 'paie', 'bulletin de paie'],
      italianKeywords: ['stipendio', 'paga', 'busta paga'],
      filePatterns: ['lohn', 'gehalt', 'payroll', 'salary', 'payslip'],
      confidence: 0.90,
      category: 'employment',
      description: 'Salary statements and payroll documents',
      tags: ['employment', 'salary', 'payroll']
    },

    // Invoices
    {
      id: 'invoice',
      name: 'Rechnungen',
      keywords: ['invoice', 'bill', 'rechnung', 'quittung', 'receipt'],
      germanKeywords: ['rechnung', 'quittung', 'beleg', 'rechnungsstellung'],
      frenchKeywords: ['facture', 'reçu', 'note'],
      italianKeywords: ['fattura', 'ricevuta', 'scontrino'],
      filePatterns: ['rechnung', 'invoice', 'bill', 'quittung', 'receipt'],
      confidence: 0.85,
      category: 'financial',
      description: 'Bills, invoices and receipts',
      tags: ['financial', 'invoice', 'bill']
    },

    // Insurance Documents
    {
      id: 'insurance',
      name: 'Versicherungsunterlagen',
      keywords: ['insurance', 'versicherung', 'policy', 'coverage'],
      germanKeywords: ['versicherung', 'police', 'deckung', 'krankenversicherung', 'haftpflicht'],
      frenchKeywords: ['assurance', 'police', 'couverture'],
      italianKeywords: ['assicurazione', 'polizza', 'copertura'],
      filePatterns: ['versicherung', 'insurance', 'policy', 'krankenversicherung'],
      confidence: 0.90,
      category: 'insurance',
      description: 'Insurance policies and documents',
      tags: ['insurance', 'policy', 'coverage']
    },

    // Birth Certificates
    {
      id: 'birth',
      name: 'Geburtsurkunde',
      keywords: ['birth', 'geburt', 'certificate', 'urkunde', 'birth certificate'],
      germanKeywords: ['geburt', 'geburtsurkunde', 'geburtsschein'],
      frenchKeywords: ['naissance', 'acte de naissance'],
      italianKeywords: ['nascita', 'atto di nascita'],
      filePatterns: ['geburt', 'birth', 'geburtsurkunde', 'birth certificate'],
      confidence: 0.95,
      category: 'personal',
      description: 'Birth certificates and personal documents',
      tags: ['personal', 'birth', 'family']
    },

    // Marriage Certificates
    {
      id: 'marriage',
      name: 'Heiratsurkunde',
      keywords: ['marriage', 'heirat', 'wedding', 'certificate', 'urkunde'],
      germanKeywords: ['heirat', 'heiratsurkunde', 'eheschließung', 'trauung'],
      frenchKeywords: ['mariage', 'acte de mariage'],
      italianKeywords: ['matrimonio', 'atto di matrimonio'],
      filePatterns: ['heirat', 'marriage', 'heiratsurkunde', 'marriage certificate'],
      confidence: 0.95,
      category: 'personal',
      description: 'Marriage certificates and family documents',
      tags: ['personal', 'marriage', 'family']
    },

    // Residence Permits
    {
      id: 'residence',
      name: 'Aufenthaltsbewilligung',
      keywords: ['residence', 'permit', 'bewilligung', 'aufenthalt', 'visa'],
      germanKeywords: ['aufenthaltsbewilligung', 'bewilligung', 'aufenthalt', 'visum'],
      frenchKeywords: ['permis de séjour', 'autorisation de séjour'],
      italianKeywords: ['permesso di soggiorno', 'autorizzazione di soggiorno'],
      filePatterns: ['bewilligung', 'aufenthalt', 'residence', 'permit', 'visa'],
      confidence: 0.90,
      category: 'immigration',
      description: 'Residence permits and immigration documents',
      tags: ['immigration', 'residence', 'permit']
    },

    // Banking Documents
    {
      id: 'banking',
      name: 'Bankdokumente',
      keywords: ['bank', 'banking', 'account', 'konto', 'banking documents'],
      germanKeywords: ['bank', 'konto', 'banking', 'kontodokumente', 'kontoauszug'],
      frenchKeywords: ['banque', 'compte', 'documents bancaires'],
      italianKeywords: ['banca', 'conto', 'documenti bancari'],
      filePatterns: ['bank', 'konto', 'banking', 'account', 'kontoauszug'],
      confidence: 0.85,
      category: 'financial',
      description: 'Bank statements and banking documents',
      tags: ['financial', 'banking', 'account']
    },

    // Tax Documents
    {
      id: 'tax',
      name: 'Steuerdokumente',
      keywords: ['tax', 'steuer', 'taxation', 'tax return', 'steuererklärung'],
      germanKeywords: ['steuer', 'steuererklärung', 'steuerbescheid', 'steuerdokumente'],
      frenchKeywords: ['impôt', 'déclaration fiscale', 'documents fiscaux'],
      italianKeywords: ['tassa', 'dichiarazione fiscale', 'documenti fiscali'],
      filePatterns: ['steuer', 'tax', 'steuererklärung', 'tax return'],
      confidence: 0.90,
      category: 'financial',
      description: 'Tax returns and tax documents',
      tags: ['financial', 'tax', 'taxation']
    },

    // Medical Documents
    {
      id: 'medical',
      name: 'Medizinische Dokumente',
      keywords: ['medical', 'health', 'doctor', 'arzt', 'medical report'],
      germanKeywords: ['medizinisch', 'arzt', 'gesundheit', 'krankenhaus', 'medizinischer bericht'],
      frenchKeywords: ['médical', 'médecin', 'santé', 'rapport médical'],
      italianKeywords: ['medico', 'salute', 'rapporto medico'],
      filePatterns: ['medical', 'arzt', 'health', 'doctor', 'medizinisch'],
      confidence: 0.85,
      category: 'health',
      description: 'Medical reports and health documents',
      tags: ['health', 'medical', 'doctor']
    }
  ];

  static findBestMatch(fileName: string): DocumentType {
    const fileNameLower = fileName.toLowerCase();
    let bestMatch: DocumentType | null = null;
    let bestScore = 0;

    console.log('🔍 Analyzing filename:', fileName);

    for (const docType of this.documentTypes) {
      let score = 0;
      let matches: string[] = [];

      // Check file patterns (highest priority)
      for (const pattern of docType.filePatterns) {
        if (fileNameLower.includes(pattern.toLowerCase())) {
          score += 10;
          matches.push(`pattern:${pattern}`);
        }
      }

      // Check German keywords
      for (const keyword of docType.germanKeywords) {
        if (fileNameLower.includes(keyword.toLowerCase())) {
          score += 8;
          matches.push(`german:${keyword}`);
        }
      }

      // Check English keywords
      for (const keyword of docType.keywords) {
        if (fileNameLower.includes(keyword.toLowerCase())) {
          score += 6;
          matches.push(`english:${keyword}`);
        }
      }

      // Check French keywords
      for (const keyword of docType.frenchKeywords) {
        if (fileNameLower.includes(keyword.toLowerCase())) {
          score += 7;
          matches.push(`french:${keyword}`);
        }
      }

      // Check Italian keywords
      for (const keyword of docType.italianKeywords) {
        if (fileNameLower.includes(keyword.toLowerCase())) {
          score += 7;
          matches.push(`italian:${keyword}`);
        }
      }

      // Apply confidence multiplier
      score *= docType.confidence;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = docType;
      }

      if (matches.length > 0) {
        console.log(`📋 ${docType.name}: score=${score.toFixed(2)}, matches=[${matches.join(', ')}]`);
      }
    }

    if (bestMatch && bestScore > 0) {
      console.log(`✅ Best match: ${bestMatch.name} (score: ${bestScore.toFixed(2)})`);
      return bestMatch;
    }

    // Fallback to unknown
    console.log('❌ No match found, using fallback');
    return {
      id: 'unknown',
      name: 'Unbekanntes Dokument',
      keywords: [],
      germanKeywords: [],
      frenchKeywords: [],
      italianKeywords: [],
      filePatterns: [],
      confidence: 0.1,
      category: 'unknown',
      description: 'Document type could not be determined',
      tags: ['unknown']
    };
  }

  static getAllDocumentTypes(): DocumentType[] {
    return this.documentTypes;
  }

  static getDocumentTypeById(id: string): DocumentType | null {
    return this.documentTypes.find(doc => doc.id === id) || null;
  }
}
