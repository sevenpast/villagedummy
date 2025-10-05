// Configuration for Village App
export const config = {
  // Set to true to use demo mode (no real database)
  // Set to false to use real Supabase database
  DEMO_MODE: true,
  
  // API endpoints
  API_ENDPOINTS: {
    SIGNUP: process.env.NODE_ENV === 'development' && true ? '/api/auth/demo-signup' : '/api/auth/signup',
    SIGNIN: process.env.NODE_ENV === 'development' && true ? '/api/auth/demo-signin' : '/api/auth/signin',
  },
  
  // App settings
  APP: {
    NAME: 'Village',
    DESCRIPTION: 'Your personal guide to settling in Switzerland',
    URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }
}

// Helper function to get API endpoint
export function getApiEndpoint(type: 'signup' | 'signin'): string {
  return config.API_ENDPOINTS[type.toUpperCase() as keyof typeof config.API_ENDPOINTS]
}
