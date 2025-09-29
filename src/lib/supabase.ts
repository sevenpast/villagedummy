import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uhnwfpenbkxgdkhkansu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVobndmcGVuYmt4Z2RraGthbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzY1NjksImV4cCI6MjA3NDQxMjU2OX0.LuavI__mXhr_n9bbcEHv-GfFH6jBnrZiED_RGQ855EM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  date_of_birth?: string
  country_of_origin: string
  is_eu_efta_citizen: boolean
  visa_status?: string
  visa_type?: string
  has_children: boolean
  children_count: number
  school_age_children_count: number
  children_details?: any[]
  target_canton?: string
  target_municipality?: string
  target_postal_code?: string
  target_address?: string
  profile_completeness?: any
  last_profile_update?: string
  created_at?: string
  updated_at?: string
}

