import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create client if we have real credentials
export const supabase = supabaseUrl.includes('placeholder') 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  auth_user_id?: string
  email: string
  first_name?: string
  last_name?: string
  date_of_birth?: string
  phone?: string
  country_of_origin?: string
  current_address?: string
  municipality?: string
  canton?: string
  postal_code?: string
  employer?: string
  occupation?: string
  work_address?: string
  has_kids?: boolean
  num_children?: number
  marital_status?: string
  months_in_switzerland?: number
  arrival_date?: string
  residence_permit_type?: string
  preferred_language?: string
  timezone?: string
  is_verified?: boolean
  is_premium?: boolean
  onboarding_completed?: boolean
  created_at?: string
  updated_at?: string
  last_login_at?: string
}

export interface SignUpData {
  email: string
  password: string
  first_name: string
  last_name?: string
  country_of_origin: string
  municipality: string
  canton: string
  postal_code: string
  has_kids: boolean
  num_children?: number
}

export interface SignInData {
  email: string
  password: string
}
