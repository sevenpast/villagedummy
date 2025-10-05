interface TranslationProvider {
  name: string;
  translate(text: string, from: string, to: string): Promise<string>;
  detectLanguage(text: string): Promise<string>;
}

class GoogleTranslateProvider implements TranslationProvider {
  name = 'Google Translate';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: from,
          target: to,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.translations[0].translatedText;
    } catch (error) {
      console.error('Google Translate error:', error);
      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });

      if (!response.ok) {
        throw new Error(`Google Translate detection error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.detections[0][0].language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'auto';
    }
  }
}

class DeepLProvider implements TranslationProvider {
  name = 'DeepL';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      // Convert language codes for DeepL
      const deepLFrom = this.convertToDeepLCode(from);
      const deepLTo = this.convertToDeepLCode(to);

      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          source_lang: deepLFrom,
          target_lang: deepLTo
        })
      });

      if (!response.ok) {
        throw new Error(`DeepL API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error('DeepL error:', error);
      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          target_lang: 'EN'
        })
      });

      if (!response.ok) {
        throw new Error(`DeepL detection error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.convertFromDeepLCode(data.translations[0].detected_source_language);
    } catch (error) {
      console.error('DeepL language detection error:', error);
      return 'auto';
    }
  }

  private convertToDeepLCode(lang: string): string {
    const mapping: Record<string, string> = {
      'de': 'DE',
      'en': 'EN',
      'fr': 'FR',
      'es': 'ES',
      'it': 'IT',
      'pt': 'PT',
      'ru': 'RU',
      'ja': 'JA',
      'zh': 'ZH'
    };
    return mapping[lang] || 'EN';
  }

  private convertFromDeepLCode(lang: string): string {
    const mapping: Record<string, string> = {
      'DE': 'de',
      'EN': 'en',
      'FR': 'fr',
      'ES': 'es',
      'IT': 'it',
      'PT': 'pt',
      'RU': 'ru',
      'JA': 'ja',
      'ZH': 'zh'
    };
    return mapping[lang] || 'en';
  }
}

class FallbackProvider implements TranslationProvider {
  name = 'Free Translation (Offline)';

  async translate(text: string, from: string, to: string): Promise<string> {
    // Comprehensive fallback translations for demo
    const translations: Record<string, Record<string, string>> = {
      // Personal Information
      'vorname': { 'en': 'First Name', 'de': 'Vorname', 'fr': 'Prénom', 'es': 'Nombre' },
      'name': { 'en': 'Last Name', 'de': 'Name', 'fr': 'Nom', 'es': 'Apellido' },
      'nachname': { 'en': 'Last Name', 'de': 'Nachname', 'fr': 'Nom de famille', 'es': 'Apellido' },
      'geburtsdatum': { 'en': 'Date of Birth', 'de': 'Geburtsdatum', 'fr': 'Date de naissance', 'es': 'Fecha de nacimiento' },
      'geboren': { 'en': 'Born', 'de': 'Geboren', 'fr': 'Né(e)', 'es': 'Nacido(a)' },
      'geschlecht': { 'en': 'Gender', 'de': 'Geschlecht', 'fr': 'Sexe', 'es': 'Género' },
      'nationalität': { 'en': 'Nationality', 'de': 'Nationalität', 'fr': 'Nationalité', 'es': 'Nacionalidad' },
      'nationalitaet': { 'en': 'Nationality', 'de': 'Nationalität', 'fr': 'Nationalité', 'es': 'Nacionalidad' },
      
      // Contact Information
      'adresse': { 'en': 'Address', 'de': 'Adresse', 'fr': 'Adresse', 'es': 'Dirección' },
      'telefon': { 'en': 'Phone', 'de': 'Telefon', 'fr': 'Téléphone', 'es': 'Teléfono' },
      'email': { 'en': 'Email', 'de': 'E-Mail', 'fr': 'E-mail', 'es': 'Correo electrónico' },
      'e-mail': { 'en': 'Email', 'de': 'E-Mail', 'fr': 'E-mail', 'es': 'Correo electrónico' },
      'ort': { 'en': 'City', 'de': 'Ort', 'fr': 'Ville', 'es': 'Ciudad' },
      'stadt': { 'en': 'City', 'de': 'Stadt', 'fr': 'Ville', 'es': 'Ciudad' },
      'plz': { 'en': 'Postal Code', 'de': 'PLZ', 'fr': 'Code postal', 'es': 'Código postal' },
      'postleitzahl': { 'en': 'Postal Code', 'de': 'Postleitzahl', 'fr': 'Code postal', 'es': 'Código postal' },
      
      // Family Information
      'mutter': { 'en': 'Mother', 'de': 'Mutter', 'fr': 'Mère', 'es': 'Madre' },
      'vater': { 'en': 'Father', 'de': 'Vater', 'fr': 'Père', 'es': 'Padre' },
      'eltern': { 'en': 'Parents', 'de': 'Eltern', 'fr': 'Parents', 'es': 'Padres' },
      'kind': { 'en': 'Child', 'de': 'Kind', 'fr': 'Enfant', 'es': 'Niño/Niña' },
      'kinder': { 'en': 'Children', 'de': 'Kinder', 'fr': 'Enfants', 'es': 'Niños' },
      
      // School Information
      'schule': { 'en': 'School', 'de': 'Schule', 'fr': 'École', 'es': 'Escuela' },
      'kindergarten': { 'en': 'Kindergarten', 'de': 'Kindergarten', 'fr': 'Jardin d\'enfants', 'es': 'Jardín de infancia' },
      'klasse': { 'en': 'Class', 'de': 'Klasse', 'fr': 'Classe', 'es': 'Clase' },
      'lehrer': { 'en': 'Teacher', 'de': 'Lehrer', 'fr': 'Enseignant', 'es': 'Profesor' },
      
      // Medical Information
      'allergien': { 'en': 'Allergies', 'de': 'Allergien', 'fr': 'Allergies', 'es': 'Alergias' },
      'medizin': { 'en': 'Medical', 'de': 'Medizin', 'fr': 'Médical', 'es': 'Médico' },
      'arzt': { 'en': 'Doctor', 'de': 'Arzt', 'fr': 'Médecin', 'es': 'Médico' },
      
      // Administrative
      'datum': { 'en': 'Date', 'de': 'Datum', 'fr': 'Date', 'es': 'Fecha' },
      'unterschrift': { 'en': 'Signature', 'de': 'Unterschrift', 'fr': 'Signature', 'es': 'Firma' },
      'formular': { 'en': 'Form', 'de': 'Formular', 'fr': 'Formulaire', 'es': 'Formulario' },
      'anmeldung': { 'en': 'Registration', 'de': 'Anmeldung', 'fr': 'Inscription', 'es': 'Inscripción' }
    };

    const lowerText = text.toLowerCase().trim();
    
    // Direct match
    if (translations[lowerText] && translations[lowerText][to]) {
      return translations[lowerText][to];
    }
    
    // Partial match (for compound words)
    for (const [key, translations] of Object.entries(translations)) {
      if (lowerText.includes(key) && translations[to]) {
        return translations[to];
      }
    }
    
    // If no translation found, return original text
    return text;
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on common German words
    const germanWords = ['der', 'die', 'das', 'und', 'oder', 'mit', 'von', 'zu', 'auf', 'für'];
    const words = text.toLowerCase().split(/\s+/);
    
    const germanWordCount = words.filter(word => germanWords.includes(word)).length;
    return germanWordCount > words.length * 0.1 ? 'de' : 'en';
  }
}

export class TranslationAPIService {
  private providers: TranslationProvider[] = [];
  private currentProvider: TranslationProvider;

  constructor() {
    // Always add fallback provider first (free)
    this.providers.push(new FallbackProvider());
    
    // Add Google Translate if API key is available
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      this.providers.push(new GoogleTranslateProvider(process.env.GOOGLE_TRANSLATE_API_KEY));
    }
    
    // Add DeepL if API key is available
    if (process.env.DEEPL_API_KEY) {
      this.providers.push(new DeepLProvider(process.env.DEEPL_API_KEY));
    }
    
    // Use the fallback provider by default (free)
    this.currentProvider = this.providers[0];
    
    console.log(`🌐 Translation service initialized with ${this.providers.length} providers`);
    console.log(`📡 Active provider: ${this.currentProvider.name} (FREE)`);
  }

  async translateText(text: string, from: string = 'auto', to: string = 'en'): Promise<string> {
    try {
      // Detect language if auto
      if (from === 'auto') {
        from = await this.detectLanguage(text);
      }

      // Skip translation if source and target are the same
      if (from === to) {
        return text;
      }

      console.log(`🌐 Translating "${text}" from ${from} to ${to} using ${this.currentProvider.name}`);
      
      const translation = await this.currentProvider.translate(text, from, to);
      
      console.log(`✅ Translation result: "${translation}"`);
      return translation;
      
    } catch (error) {
      console.error('❌ Translation failed:', error);
      
      // Try fallback provider if current one fails
      if (this.currentProvider.name !== 'Fallback (Mock)') {
        console.log('🔄 Trying fallback provider...');
        const fallbackProvider = this.providers.find(p => p.name === 'Fallback (Mock)');
        if (fallbackProvider) {
          this.currentProvider = fallbackProvider;
          return await this.translateText(text, from, to);
        }
      }
      
      // Return original text if all providers fail
      return text;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      return await this.currentProvider.detectLanguage(text);
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'auto';
    }
  }

  async translateBatch(texts: string[], from: string = 'auto', to: string = 'en'): Promise<string[]> {
    console.log(`🌐 Batch translating ${texts.length} texts from ${from} to ${to}`);
    
    const translations = await Promise.all(
      texts.map(text => this.translateText(text, from, to))
    );
    
    console.log(`✅ Batch translation completed: ${translations.length} results`);
    return translations;
  }

  getAvailableProviders(): string[] {
    return this.providers.map(p => p.name);
  }

  switchProvider(providerName: string): boolean {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      this.currentProvider = provider;
      console.log(`🔄 Switched to translation provider: ${provider.name}`);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const translationAPIService = new TranslationAPIService();
