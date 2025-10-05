// Housing scraper with Gemini AI integration for daily top picks
import { GoogleGenerativeAI } from '@google/generative-ai';

// Data structures
export interface HousingListing {
  url: string;
  title: string;
  price_chf: number;
  address: string;
  living_space_sqm: number | null;
  number_of_rooms: number | null;
  match_score: number;
  source: 'immoscout24' | 'homegate' | 'newhome';
  scraped_at: string;
}

export interface UserHousingPreferences {
  userId: string;
  maxRent: number;
  minRooms: number;
  maxRooms: number;
  location: string;
  postalCode: string;
  canton: string;
}

export interface ScrapingResult {
  success: boolean;
  listings: HousingListing[];
  errors: string[];
  repair_needed: string[];
}

// Gemini AI configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Data validation schema
export class HousingListingValidator {
  static validate(listing: any): { isValid: boolean; data?: HousingListing; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!listing.url || typeof listing.url !== 'string') {
      errors.push('Invalid or missing URL');
    }
    if (!listing.title || typeof listing.title !== 'string') {
      errors.push('Invalid or missing title');
    }
    if (!listing.price_chf || typeof listing.price_chf !== 'number') {
      errors.push('Invalid or missing price');
    }
    if (!listing.address || typeof listing.address !== 'string') {
      errors.push('Invalid or missing address');
    }

    // Optional fields validation
    if (listing.living_space_sqm !== null && typeof listing.living_space_sqm !== 'number') {
      errors.push('Invalid living space');
    }
    if (listing.number_of_rooms !== null && typeof listing.number_of_rooms !== 'number') {
      errors.push('Invalid number of rooms');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        url: listing.url,
        title: listing.title,
        price_chf: listing.price_chf,
        address: listing.address,
        living_space_sqm: listing.living_space_sqm || null,
        number_of_rooms: listing.number_of_rooms || null,
        match_score: listing.match_score || 0,
        source: listing.source || 'immoscout24',
        scraped_at: new Date().toISOString()
      },
      errors: []
    };
  }
}

// Lightweight scraper for ImmoScout24
export class ImmoScout24Scraper {
  private static readonly BASE_URL = 'https://www.immoscout24.ch';
  private static readonly SEARCH_URL = 'https://www.immoscout24.ch/de/immobilien/mieten';

  static async scrapeListings(preferences: UserHousingPreferences): Promise<ScrapingResult> {
    const results: HousingListing[] = [];
    const errors: string[] = [];
    const repair_needed: string[] = [];

    try {
      // Construct search URL based on preferences
      const searchUrl = this.constructSearchUrl(preferences);
      
      // Fetch the page
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // Simple HTML parsing (lightweight approach)
      const listings = this.parseListings(html, preferences);
      
      // Validate each listing
      for (const listing of listings) {
        const validation = HousingListingValidator.validate(listing);
        
        if (validation.isValid && validation.data) {
          results.push(validation.data);
        } else {
          repair_needed.push(listing.url || 'unknown');
          errors.push(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return {
        success: results.length > 0,
        listings: results.slice(0, 3), // Return top 3
        errors,
        repair_needed
      };

    } catch (error) {
      return {
        success: false,
        listings: [],
        errors: [`Scraping failed: ${error}`],
        repair_needed: []
      };
    }
  }

  private static constructSearchUrl(preferences: UserHousingPreferences): string {
    const params = new URLSearchParams();
    
    // Basic search parameters
    params.append('se', 'rent');
    params.append('t', '1'); // Apartment
    params.append('pr', `0,${preferences.maxRent}`);
    params.append('ro', `${preferences.minRooms},${preferences.maxRooms}`);
    
    // Location
    if (preferences.postalCode) {
      params.append('pc', preferences.postalCode);
    } else if (preferences.location) {
      params.append('l', preferences.location);
    }

    return `${this.SEARCH_URL}?${params.toString()}`;
  }

  private static parseListings(html: string, preferences: UserHousingPreferences): any[] {
    const listings: any[] = [];
    
    try {
      // Simple regex-based extraction (lightweight approach)
      const listingRegex = /<article[^>]*class="[^"]*result-item[^"]*"[^>]*>(.*?)<\/article>/g;
      const matches = html.match(listingRegex);
      
      if (!matches) return listings;

      for (const match of matches.slice(0, 5)) { // Only first 5
        const listing = this.extractListingData(match, preferences);
        if (listing) {
          listings.push(listing);
        }
      }
    } catch (error) {
      console.error('Parsing error:', error);
    }

    return listings;
  }

  private static extractListingData(html: string, preferences: UserHousingPreferences): any | null {
    try {
      // Extract URL
      const urlMatch = html.match(/href="([^"]*\/expose\/[^"]*)"/);
      const url = urlMatch ? `${this.BASE_URL}${urlMatch[1]}` : null;

      // Extract title
      const titleMatch = html.match(/<h2[^>]*>([^<]*)<\/h2>/);
      const title = titleMatch ? titleMatch[1].trim() : null;

      // Extract price
      const priceMatch = html.match(/CHF\s*([0-9'.,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/['.,]/g, '')) : null;

      // Extract address
      const addressMatch = html.match(/<p[^>]*class="[^"]*address[^"]*"[^>]*>([^<]*)<\/p>/);
      const address = addressMatch ? addressMatch[1].trim() : null;

      if (!url || !title || !price || !address) {
        return null;
      }

      // Calculate match score
      const matchScore = this.calculateMatchScore(price, preferences);

      return {
        url,
        title,
        price_chf: price,
        address,
        living_space_sqm: null, // Will be filled by LLM repair if needed
        number_of_rooms: null,  // Will be filled by LLM repair if needed
        match_score: matchScore,
        source: 'immoscout24'
      };
    } catch (error) {
      console.error('Extraction error:', error);
      return null;
    }
  }

  private static calculateMatchScore(price: number, preferences: UserHousingPreferences): number {
    const budgetRatio = price / preferences.maxRent;
    
    if (budgetRatio <= 0.8) return 100; // Excellent match
    if (budgetRatio <= 1.0) return 80;  // Good match
    if (budgetRatio <= 1.2) return 60;  // Acceptable match
    return 40; // Poor match
  }
}

// Gemini AI Repair Worker
export class GeminiRepairWorker {
  private static readonly model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  static async repairListing(url: string): Promise<HousingListing | null> {
    try {
      // Fetch the listing page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // Create Gemini prompt
      const prompt = this.createGeminiPrompt(html);
      
      // Get AI response
      const result = await this.model.generateContent(prompt);
      const response_text = result.response.text();
      
      // Parse JSON response
      const jsonMatch = response_text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      
      // Validate the AI-extracted data
      const validation = HousingListingValidator.validate({
        ...extractedData,
        url,
        source: 'immoscout24'
      });

      if (validation.isValid && validation.data) {
        return validation.data;
      } else {
        console.error('AI extraction validation failed:', validation.errors);
        return null;
      }

    } catch (error) {
      console.error('Gemini repair failed:', error);
      return null;
    }
  }

  private static createGeminiPrompt(html: string): string {
    return `
Analyze the following HTML content from a Swiss real estate website (ImmoScout24) and extract the specified information.
Return the result ONLY as a single, minified JSON object. Do not include any explanatory text, comments, or markdown formatting.

HTML Content:
---
${html.substring(0, 15000)}
---

Extract the following fields and return as JSON:
{
  "title": "string (property title/description)",
  "price_chf": "integer (only numbers, no CHF or punctuation)",
  "address": "string (street, postal code, city)",
  "living_space_sqm": "integer (only numbers, if available, otherwise null)",
  "number_of_rooms": "float (e.g., 3.5, if available, otherwise null)"
}

Examples:
- Price "CHF 2'500.–" should become: "price_chf": 2500
- Address "Bahnhofstrasse 1, 8001 Zürich" should become: "address": "Bahnhofstrasse 1, 8001 Zürich"
- Rooms "3.5 Zimmer" should become: "number_of_rooms": 3.5
- Living space "85 m²" should become: "living_space_sqm": 85

If a value cannot be found, set it to null.
`;
  }
}

// Main daily housing job orchestrator
export class DailyHousingJob {
  static async runDailyJob(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    try {
      // Get all users with housing preferences
      const users = await this.getUsersWithHousingPreferences();
      
      for (const user of users) {
        try {
          // Scrape listings
          const scrapingResult = await ImmoScout24Scraper.scrapeListings(user.preferences);
          
          // Process successful listings
          if (scrapingResult.success) {
            await this.saveListings(user.userId, scrapingResult.listings);
            processed++;
          }

          // Repair failed listings with Gemini
          for (const url of scrapingResult.repair_needed) {
            const repairedListing = await GeminiRepairWorker.repairListing(url);
            if (repairedListing) {
              await this.saveListings(user.userId, [repairedListing]);
            }
          }

          // Log errors
          errors.push(...scrapingResult.errors);

        } catch (userError) {
          errors.push(`User ${user.userId}: ${userError}`);
        }
      }

      return {
        success: processed > 0,
        processed,
        errors
      };

    } catch (error) {
      return {
        success: false,
        processed,
        errors: [`Daily job failed: ${error}`]
      };
    }
  }

  private static async getUsersWithHousingPreferences(): Promise<{ userId: string; preferences: UserHousingPreferences }[]> {
    // This would typically query your database
    // For now, return mock data
    return [
      {
        userId: 'user1',
        preferences: {
          userId: 'user1',
          maxRent: 3000,
          minRooms: 2,
          maxRooms: 4,
          location: 'Zürich',
          postalCode: '8001',
          canton: 'ZH'
        }
      }
    ];
  }

  private static async saveListings(userId: string, listings: HousingListing[]): Promise<void> {
    // This would typically save to your database
    console.log(`Saving ${listings.length} listings for user ${userId}`);
    
    // Store in localStorage for now (in production, use database)
    const existingListings = JSON.parse(localStorage.getItem(`housing_listings_${userId}`) || '[]');
    const updatedListings = [...existingListings, ...listings];
    
    // Keep only the latest 10 listings per user
    const recentListings = updatedListings
      .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
      .slice(0, 10);
    
    localStorage.setItem(`housing_listings_${userId}`, JSON.stringify(recentListings));
  }
}
