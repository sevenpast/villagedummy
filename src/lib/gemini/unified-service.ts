// ============================================================================
// UNIFIED GEMINI SERVICE
// Consolidates all Gemini functionality into a single, secure service
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

interface CacheEntry {
  id: string;
  prompt_hash: string;
  response: string;
  created_at: string;
  expires_at: string;
}

interface MunicipalityInfo {
  website_url?: string;
  official_name?: string;
  official_language?: string;
  email?: string;
}

interface SchoolAuthorityInfo {
  website_url?: string;
  email?: string;
  official_language?: string;
  authority_name?: string;
}

interface EmailContent {
  subject: string;
  body_original: string;
  body_english: string;
}

interface DocumentAnalysis {
  [key: string]: string | number | boolean;
}

type GeminiData = MunicipalityInfo | SchoolAuthorityInfo | EmailContent | DocumentAnalysis | { content: string };

interface GeminiResponse {
  success: boolean;
  data?: GeminiData;
  error?: string;
  fromCache?: boolean;
}

export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private supabase: ReturnType<typeof createClient> | null;

  constructor() {
    // SECURITY: Use server-side only API key with type safety
    this.client = new GoogleGenerativeAI(env.geminiApiKey());
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    this.supabase = null; // Initialize lazily
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  /**
   * Generate content with caching
   */
  async generateWithCache(
    prompt: string, 
    cacheKey: string, 
    options: { 
      maxRetries?: number;
      timeout?: number;
      useCache?: boolean;
    } = {}
  ): Promise<GeminiResponse> {
    const { maxRetries = 3, timeout = 30000, useCache = true } = options;

    try {
      // Check cache first
      if (useCache) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            fromCache: true
          };
        }
      }

      // Generate new content
      const result = await this.generateContent(prompt, maxRetries, timeout);
      
      // Cache the result
      if (useCache && result.success) {
        await this.saveToCache(cacheKey, result.data);
      }

      return result;
    } catch (error) {
      console.error('Gemini generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate municipality website information
   */
  async findMunicipalityWebsite(
    municipality: string, 
    canton: string
  ): Promise<GeminiResponse> {
    const prompt = `Find the official website for ${municipality}, ${canton}, Switzerland. 
    Return only a JSON object with: {"website_url": "https://...", "official_name": "Official Name"}`;
    
    const cacheKey = `municipality_${municipality}_${canton}`;
    return this.generateWithCache(prompt, cacheKey);
  }

  /**
   * Generate school authority information
   */
  async findSchoolAuthority(
    municipality: string, 
    canton: string
  ): Promise<GeminiResponse> {
    const prompt = `Find the school authority website and contact information for ${municipality}, ${canton}, Switzerland.
    Return only a JSON object with: {"website_url": "https://...", "email": "contact@...", "official_language": "de/fr/it/en"}`;
    
    const cacheKey = `school_${municipality}_${canton}`;
    return this.generateWithCache(prompt, cacheKey);
  }

  /**
   * Generate multilingual email content
   */
  async generateMultilingualEmail(
    context: string,
    language: string,
    userInfo: any
  ): Promise<GeminiResponse> {
    const prompt = `Generate a professional email in ${language} and English for: ${context}
    User info: ${JSON.stringify(userInfo)}
    Return only a JSON object with: {"subject": "...", "body_original": "...", "body_english": "..."}`;
    
    const cacheKey = `email_${context}_${language}_${JSON.stringify(userInfo).slice(0, 50)}`;
    return this.generateWithCache(prompt, cacheKey);
  }

  /**
   * Analyze document content
   */
  async analyzeDocument(
    text: string,
    documentType: string
  ): Promise<GeminiResponse> {
    const prompt = `Analyze this ${documentType} document text and extract relevant information:
    ${text}
    Return only a JSON object with extracted fields.`;
    
    const cacheKey = `doc_${documentType}_${text.slice(0, 100)}`;
    return this.generateWithCache(prompt, cacheKey);
  }

  /**
   * Private method to generate content from Gemini
   */
  private async generateContent(
    prompt: string, 
    maxRetries: number, 
    timeout: number
  ): Promise<GeminiResponse> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await this.model.generateContent(prompt);
        clearTimeout(timeoutId);

        const response = await result.response;
        const text = response.text();

        // Try to parse as JSON, fallback to plain text
        try {
          const jsonData = JSON.parse(text);
          return {
            success: true,
            data: jsonData
          };
        } catch {
          return {
            success: true,
            data: { content: text }
          };
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Get cached result
   */
  private async getFromCache(cacheKey: string): Promise<any> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('gemini_cache')
        .select('response')
        .eq('prompt_hash', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return JSON.parse(data.response);
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Save result to cache
   */
  private async saveToCache(cacheKey: string, data: any): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Cache for 7 days

      await supabase
        .from('gemini_cache')
        .upsert({
          prompt_hash: cacheKey,
          response: JSON.stringify(data),
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Cache save error:', error);
      // Don't throw - caching is not critical
    }
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * Validate email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
