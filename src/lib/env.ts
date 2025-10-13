// ============================================================================
// ENVIRONMENT VARIABLES
// Type-safe environment variable handling
// ============================================================================

interface EnvironmentConfig {
  // Supabase (Public - Safe for client-side)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Supabase (Private - Server-side only)
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // AI Services (Private - Server-side only)
  GEMINI_API_KEY: string;
  GOOGLE_CLOUD_VISION_API_KEY: string;
  
  // Email Service (Private - Server-side only)
  RESEND_API_KEY: string;
  
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
}

type EnvKey = keyof EnvironmentConfig;

class EnvironmentError extends Error {
  constructor(key: EnvKey) {
    super(`Environment variable ${key} is not set`);
    this.name = 'EnvironmentError';
  }
}

/**
 * Get environment variable with type safety
 */
function getEnv<K extends EnvKey>(key: K): EnvironmentConfig[K] {
  const value = process.env[key];
  
  if (!value) {
    throw new EnvironmentError(key);
  }
  
  return value as EnvironmentConfig[K];
}

/**
 * Get optional environment variable
 */
function getOptionalEnv<K extends EnvKey>(key: K): EnvironmentConfig[K] | undefined {
  return process.env[key] as EnvironmentConfig[K] | undefined;
}

/**
 * Check if environment variable exists
 */
function hasEnv<K extends EnvKey>(key: K): boolean {
  return !!process.env[key];
}

/**
 * Validate all required environment variables
 */
function validateEnvironment(): void {
  const requiredVars: EnvKey[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'RESEND_API_KEY',
    'NODE_ENV'
  ];

  const missing: string[] = [];
  
  for (const key of requiredVars) {
    if (!hasEnv(key)) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Export type-safe environment getters
export const env = {
  // Supabase
  supabaseUrl: () => getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: () => getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  
  // AI Services
  geminiApiKey: () => getEnv('GEMINI_API_KEY'),
  googleVisionApiKey: () => getOptionalEnv('GOOGLE_CLOUD_VISION_API_KEY'),
  
  // Email
  resendApiKey: () => getEnv('RESEND_API_KEY'),
  
  // Application
  nodeEnv: () => getEnv('NODE_ENV'),
  isDevelopment: () => getEnv('NODE_ENV') === 'development',
  isProduction: () => getEnv('NODE_ENV') === 'production',
  isTest: () => getEnv('NODE_ENV') === 'test',
  
  // Validation
  validate: validateEnvironment
};

// Validate environment on module load (only in production)
if (process.env.NODE_ENV === 'production') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}
