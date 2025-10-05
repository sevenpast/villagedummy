import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface TranslationCache {
  [key: string]: string;
}

// In-memory cache to avoid repeated translations
const translationCache: TranslationCache = {};

/**
 * Dynamically translate any text from any language to English using AI
 */
export async function translateToEnglish(text: string): Promise<string> {
  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Skip translation for already English text or very short text
  if (text.length < 2 || isLikelyEnglish(text)) {
    const result = formatFieldName(text);
    translationCache[cacheKey] = result;
    return result;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const prompt = `Translate this Swiss/German form field name to English with context awareness. Return ONLY the English translation.

Rules:
- If it's already in English, return it as-is
- Make it a proper form field label (e.g., "First Name", "Date of Birth")
- For compound German words, break them down logically
- Context-aware: Distinguish between parent and child fields
- Common translations: "Name" = "Last Name", "Vorname" = "First Name", "Geburtsdatum" = "Date of Birth"
- Swiss specifics: "Bürgerort" = "Place of Citizenship", "PLZ" = "Postal Code"
- Numbered fields: "_1" often indicates parent 1, "_2" parent 2, etc.

Text to translate: "${text}"

English translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let translation = response.text().trim();

    // Clean up the response
    translation = translation.replace(/["""]/g, '');
    translation = translation.replace(/^(Translation:|English:|Result:)\s*/i, '');

    // Format as proper field name
    translation = formatFieldName(translation);

    // Cache the result
    translationCache[cacheKey] = translation;

    return translation;
  } catch (error) {
    console.error('Translation failed:', error);

    // Fallback to simple formatting
    const fallback = formatFieldName(text);
    translationCache[cacheKey] = fallback;
    return fallback;
  }
}

/**
 * Batch translate multiple field names at once for efficiency
 */
export async function batchTranslateToEnglish(texts: string[]): Promise<string[]> {
  // Check which texts need translation
  const toTranslate: { index: number; text: string }[] = [];
  const results: string[] = new Array(texts.length);

  texts.forEach((text, index) => {
    const cacheKey = text.toLowerCase().trim();
    if (translationCache[cacheKey]) {
      results[index] = translationCache[cacheKey];
    } else if (text.length < 2 || isLikelyEnglish(text)) {
      const formatted = formatFieldName(text);
      translationCache[cacheKey] = formatted;
      results[index] = formatted;
    } else {
      toTranslate.push({ index, text });
    }
  });

  // If nothing to translate, return cached results
  if (toTranslate.length === 0) {
    return results;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const fieldList = toTranslate.map((item, i) => `${i + 1}. ${item.text}`).join('\n');

    const prompt = `Translate these form field names to English. Return ONLY the translations in the same order, one per line, numbered.

Rules:
- If already in English, return as-is
- Make proper form field labels (e.g., "First Name", "Date of Birth")
- For compound German words, break them down logically
- Common translations: "Name" = "Last Name", "Vorname" = "First Name", "Geburtsdatum" = "Date of Birth"

Field names to translate:
${fieldList}

English translations:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translations = response.text()
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    // Map translations back to original positions
    toTranslate.forEach((item, translationIndex) => {
      if (translations[translationIndex]) {
        let translation = translations[translationIndex];
        translation = translation.replace(/["""]/g, '');
        translation = formatFieldName(translation);

        translationCache[item.text.toLowerCase().trim()] = translation;
        results[item.index] = translation;
      } else {
        // Fallback
        const fallback = formatFieldName(item.text);
        translationCache[item.text.toLowerCase().trim()] = fallback;
        results[item.index] = fallback;
      }
    });

    return results;
  } catch (error) {
    console.error('Batch translation failed:', error);

    // Fallback to simple formatting for untranslated items
    toTranslate.forEach((item) => {
      if (!results[item.index]) {
        const fallback = formatFieldName(item.text);
        translationCache[item.text.toLowerCase().trim()] = fallback;
        results[item.index] = fallback;
      }
    });

    return results;
  }
}

/**
 * Enhanced context-aware translation for Swiss/German form fields
 */
export async function translateFormFieldWithContext(
  fieldName: string,
  fieldType: 'text' | 'checkbox' | 'date' | 'email' | 'phone' | 'select',
  contextHints: string[] = []
): Promise<{
  translation: string;
  confidence: number;
  fieldTypeHint: 'text' | 'checkbox' | 'date' | 'email' | 'phone' | 'select';
}> {
  const cacheKey = `${fieldName}:${fieldType}:${contextHints.join(',')}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const prompt = `Analyze this Swiss/German form field and provide the best English translation:

Field Name: "${fieldName}"
Field Type: ${fieldType}
Context Hints: ${contextHints.join(', ')}

Provide a JSON response with:
{
  "translation": "proper English form label",
  "confidence": confidence_score_0_to_100,
  "recommendedType": "text|checkbox|date|email|phone|select",
  "reasoning": "brief explanation"
}

Rules:
- For Swiss forms: "Vorname" = "First Name", "Name/Nachname" = "Last Name"
- Consider parent vs child context (e.g., "Vorname_1" = "Parent 1 First Name")
- Detect checkbox fields: gender options, yes/no questions
- Date fields: "Geburtsdatum", "Datum", "Eintrittsdatum"
- Address components: "Strasse", "PLZ", "Ort"
- Swiss German specifics: "Bürgerort", "Heimatsprache", "Tagesschule"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = JSON.parse(response.text());

    return {
      translation: jsonResponse.translation,
      confidence: jsonResponse.confidence,
      fieldTypeHint: jsonResponse.recommendedType
    };
  } catch (error) {
    console.error('Context-aware translation failed:', error);
    // Fallback to simple translation
    const fallback = await translateToEnglish(fieldName);
    return {
      translation: fallback,
      confidence: 50,
      fieldTypeHint: fieldType
    };
  }
}

/**
 * Check if text is likely already in English
 */
function isLikelyEnglish(text: string): boolean {
  const englishIndicators = [
    'first', 'last', 'name', 'email', 'phone', 'address', 'date', 'birth',
    'gender', 'nationality', 'country', 'city', 'street', 'postal', 'code',
    'signature', 'comments', 'other', 'yes', 'no', 'male', 'female'
  ];

  const lowerText = text.toLowerCase();
  return englishIndicators.some(word => lowerText.includes(word));
}

/**
 * Format field name to proper case
 */
function formatFieldName(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Detect field type based on field name and context
 */
export function detectFieldType(fieldName: string, contextText: string = ''): {
  type: 'text' | 'checkbox' | 'date' | 'email' | 'phone' | 'select';
  confidence: number;
} {
  const name = fieldName.toLowerCase();
  const context = contextText.toLowerCase();

  // Date fields - high confidence
  if (/datum|date|birth|geb|eintrittsdatum/.test(name)) {
    return { type: 'date', confidence: 95 };
  }

  // Email fields - high confidence
  if (/email|e-mail|e_mail|mail/.test(name)) {
    return { type: 'email', confidence: 95 };
  }

  // Phone fields - high confidence
  if (/telefon|phone|mobile|handy|tel/.test(name)) {
    return { type: 'phone', confidence: 95 };
  }

  // Checkbox indicators - medium to high confidence
  if (/männlich|weiblich|male|female|ja|nein|yes|no/.test(name)) {
    return { type: 'checkbox', confidence: 85 };
  }

  // Gender context suggests checkboxes
  if (/geschlecht|gender/.test(name) || /geschlecht|gender/.test(context)) {
    return { type: 'checkbox', confidence: 80 };
  }

  // Yes/No questions suggest checkboxes
  if (/\?|tagesschule|alleinerziehend|beide_eltern/.test(name) || /\?|ja\/nein|yes\/no/.test(context)) {
    return { type: 'checkbox', confidence: 75 };
  }

  // Selection fields - medium confidence
  if (/klasse|grade|stufe|nationalität|nationality/.test(name)) {
    return { type: 'select', confidence: 70 };
  }

  // Default to text field
  return { type: 'text', confidence: 60 };
}

/**
 * Extract context hints from surrounding text or field structure
 */
export function extractContextHints(fieldName: string, surroundingText: string[]): string[] {
  const hints: string[] = [];
  const name = fieldName.toLowerCase();

  // Parent/Child context
  if (/_1|_2|_3|mutter|vater|eltern|parent/.test(name)) {
    hints.push('parent-context');
  }
  if (/kind|child/.test(name)) {
    hints.push('child-context');
  }

  // Address context
  if (/adresse|strasse|plz|ort|address|street|postal|city/.test(name)) {
    hints.push('address-context');
  }

  // School context
  if (/schule|klasse|grade|school|education/.test(name)) {
    hints.push('school-context');
  }

  // Medical context
  if (/allergi|medical|gesundheit|health/.test(name)) {
    hints.push('medical-context');
  }

  // Gender/demographic context
  if (/geschlecht|nationalität|geburt|gender|nationality|birth/.test(name)) {
    hints.push('demographic-context');
  }

  // Administrative context
  if (/datum|unterschrift|signature|date/.test(name)) {
    hints.push('administrative-context');
  }

  return hints;
}

/**
 * Clear the translation cache (useful for testing)
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(key => delete translationCache[key]);
}