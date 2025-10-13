import { createClient } from '@/lib/supabase/client'

export interface CacheResult {
  success: boolean
  data?: any
  error?: string
  fromCache?: boolean
}

export interface MunicipalityInfo {
  municipality: string
  canton: string
  website_url?: string
  school_website_url?: string
  school_authority_name?: string
  school_authority_email?: string
  official_language?: string
  contact_phone?: string
  address?: string
}

// Generate cache key for consistent caching
export function generateCacheKey(
  type: 'municipality_website' | 'school_website' | 'school_authority' | 'email_content',
  municipality: string,
  canton: string,
  additionalParams?: string
): string {
  const baseKey = `${type}_${municipality.toLowerCase().replace(/\s+/g, '_')}_${canton.toLowerCase()}`
  return additionalParams ? `${baseKey}_${additionalParams}` : baseKey
}

// Validate and clean URL
export function validateAndCleanUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  
  // Remove extra whitespace and newlines
  let cleanUrl = url.trim().replace(/\n/g, '').replace(/\r/g, '')
  
  // Remove any text after the URL
  cleanUrl = cleanUrl.split(' ')[0]
  
  // Add protocol if missing
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`
  }
  
  // Basic URL validation
  try {
    const urlObj = new URL(cleanUrl)
    // Only allow http/https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null
    }
    return cleanUrl
  } catch {
    return null
  }
}

// Validate email address
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Get cached result
export async function getCachedResult(
  cacheKey: string,
  userId: string
): Promise<CacheResult> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_gemini_cache', {
      p_cache_key: cacheKey,
      p_user_id: userId
    })
    
    if (error) {
      console.warn('Cache lookup error:', error)
      return { success: false, error: error.message }
    }
    
    if (data) {
      return { success: true, data, fromCache: true }
    }
    
    return { success: false, error: 'No cached data found' }
  } catch (error) {
    console.error('Cache retrieval error:', error)
    return { success: false, error: 'Cache retrieval failed' }
  }
}

// Set cached result
export async function setCachedResult(
  cacheKey: string,
  cacheType: 'municipality_website' | 'school_website' | 'school_authority' | 'email_content',
  municipality: string,
  canton: string,
  resultData: any,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.rpc('set_gemini_cache', {
      p_cache_key: cacheKey,
      p_cache_type: cacheType,
      p_municipality: municipality,
      p_canton: canton,
      p_result_data: resultData,
      p_user_id: userId
    })
    
    if (error) {
      console.error('Cache storage error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Cache storage error:', error)
    return false
  }
}

// Validate municipality and canton data
export function validateLocationData(municipality?: string, canton?: string): {
  isValid: boolean
  error?: string
  municipality?: string
  canton?: string
} {
  if (!municipality || !canton) {
    return {
      isValid: false,
      error: 'Municipality and canton information is required. Please update your profile with your location information.'
    }
  }
  
  if (typeof municipality !== 'string' || typeof canton !== 'string') {
    return {
      isValid: false,
      error: 'Invalid location data format. Please update your profile.'
    }
  }
  
  const cleanMunicipality = municipality.trim()
  const cleanCanton = canton.trim()
  
  if (cleanMunicipality.length < 2 || cleanCanton.length < 2) {
    return {
      isValid: false,
      error: 'Location information appears to be incomplete. Please update your profile.'
    }
  }
  
  return {
    isValid: true,
    municipality: cleanMunicipality,
    canton: cleanCanton
  }
}

// Get official language based on canton
export function getOfficialLanguage(canton: string): string {
  const cantonCode = canton.toUpperCase()
  
  // German-speaking cantons
  if (['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'VD', 'VS', 'NE', 'GE', 'JU'].includes(cantonCode)) {
    // French-speaking cantons
    if (['VD', 'VS', 'NE', 'GE', 'JU'].includes(cantonCode)) {
      return 'Français'
    }
    // Italian-speaking cantons
    if (['TI'].includes(cantonCode)) {
      return 'Italiano'
    }
    // German-speaking cantons
    return 'Deutsch'
  }
  
  // Default to German
  return 'Deutsch'
}

// Generate multilingual email content
export function generateMultilingualEmail(
  officialLanguage: string,
  municipality: string,
  canton: string,
  purpose: 'school_registration' | 'municipality_registration'
): { subject: string; body: string } {
  const isGerman = officialLanguage === 'Deutsch'
  const isFrench = officialLanguage === 'Français'
  const isItalian = officialLanguage === 'Italiano'
  
  if (purpose === 'school_registration') {
    if (isGerman) {
      return {
        subject: `Schulanmeldung für ${municipality}`,
        body: `Sehr geehrte Damen und Herren,

ich möchte mich gerne über die Schulanmeldung für meine Kinder in ${municipality} informieren.

Könnten Sie mir bitte die notwendigen Unterlagen und das Anmeldeverfahren zusenden?

Vielen Dank für Ihre Hilfe.

Mit freundlichen Grüßen

---
Dear Sir/Madam,

I would like to get information about school registration for my children in ${municipality}.

Could you please send me the necessary documents and the registration procedure?

Thank you for your help.

Best regards`
      }
    } else if (isFrench) {
      return {
        subject: `Inscription scolaire pour ${municipality}`,
        body: `Madame, Monsieur,

je souhaiterais obtenir des informations sur l'inscription scolaire pour mes enfants à ${municipality}.

Pourriez-vous m'envoyer les documents nécessaires et la procédure d'inscription ?

Merci pour votre aide.

Cordialement

---
Dear Sir/Madam,

I would like to get information about school registration for my children in ${municipality}.

Could you please send me the necessary documents and the registration procedure?

Thank you for your help.

Best regards`
      }
    } else if (isItalian) {
      return {
        subject: `Iscrizione scolastica per ${municipality}`,
        body: `Gentile Signora/Signore,

vorrei ottenere informazioni sull'iscrizione scolastica per i miei figli a ${municipality}.

Potreste inviarmi i documenti necessari e la procedura di iscrizione?

Grazie per il vostro aiuto.

Cordiali saluti

---
Dear Sir/Madam,

I would like to get information about school registration for my children in ${municipality}.

Could you please send me the necessary documents and the registration procedure?

Thank you for your help.

Best regards`
      }
    }
  } else if (purpose === 'municipality_registration') {
    if (isGerman) {
      return {
        subject: `Einwohneranmeldung für ${municipality}`,
        body: `Sehr geehrte Damen und Herren,

ich möchte mich gerne über die Einwohneranmeldung in ${municipality} informieren.

Könnten Sie mir bitte die notwendigen Unterlagen und das Anmeldeverfahren zusenden?

Vielen Dank für Ihre Hilfe.

Mit freundlichen Grüßen

---
Dear Sir/Madam,

I would like to get information about residence registration in ${municipality}.

Could you please send me the necessary documents and the registration procedure?

Thank you for your help.

Best regards`
      }
    } else if (isFrench) {
      return {
        subject: `Inscription de résidence pour ${municipality}`,
        body: `Madame, Monsieur,

je souhaiterais obtenir des informations sur l'inscription de résidence à ${municipality}.

Pourriez-vous m'envoyer les documents nécessaires et la procédure d'inscription ?

Merci pour votre aide.

Cordialement

---
Dear Sir/Madam,

I would like to get information about residence registration in ${municipality}.

Could you please send me the necessary documents and the registration procedure?

Thank you for your help.

Best regards`
      }
    } else if (isItalian) {
      return {
        subject: `Iscrizione di residenza per ${municipality}`,
        body: `Gentile Signora/Signore,

vorrei ottenere informazioni sull'iscrizione di residenza a ${municipality}.

Potreste inviarmi i documenti necessari e la procedura di iscrizione?

Grazie per il vostro aiuto.

Cordiali saluti

---
Dear Sir/Madam,

I would like to get information about residence registration in ${municipality}.

Could you please send me the necessary documents and the registration procedure?

Thank you for your help.

Best regards`
      }
    }
  }
  
  // Fallback to German
  return {
    subject: `Anfrage für ${municipality}`,
    body: `Sehr geehrte Damen und Herren,

ich habe eine Anfrage bezüglich ${municipality}.

Vielen Dank für Ihre Hilfe.

Mit freundlichen Grüßen

---
Dear Sir/Madam,

I have a question regarding ${municipality}.

Thank you for your help.

Best regards`
  }
}
