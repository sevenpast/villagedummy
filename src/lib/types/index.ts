// Village App Types
export interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  postal_code?: string
  municipality?: string
  canton?: string
  country_of_origin?: string
  has_children: boolean
  family_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'other'
  arrival_date?: string
  work_permit_type?: string
  language_preference: string
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  user_id: string
  first_name: string
  last_name: string
  relationship: 'spouse' | 'child' | 'parent' | 'other'
  birth_date?: string
  nationality?: string
  created_at: string
}

export interface DocumentCategory {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
}

export interface DocumentVault {
  id: string
  user_id: string
  category_id?: string
  file_name: string
  file_size: number
  file_type: string
  encrypted_data: ArrayBuffer
  encryption_key_hash: string
  metadata: Record<string, unknown>
  is_deleted: boolean
  created_at: string
  updated_at: string
  category?: DocumentCategory
}

export interface DocumentAccessLog {
  id: string
  document_id: string
  user_id: string
  action: 'view' | 'download' | 'delete' | 'share'
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Module {
  id: string
  name: string
  description?: string
  icon?: string
  order_index: number
  is_active: boolean
  created_at: string
}

export interface Task {
  id: string
  module_id: string
  title: string
  description?: string
  task_type: 'form' | 'document' | 'appointment' | 'information'
  priority: number
  estimated_duration?: number
  is_active: boolean
  created_at: string
  module?: Module
}

export interface TaskVariant {
  id: string
  task_id: string
  title: string
  description?: string
  content: Record<string, unknown>
  target_segments: string[]
  is_default: boolean
  created_at: string
}

export interface UserTaskProgress {
  id: string
  user_id: string
  task_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  task?: Task
}

export interface Municipality {
  id: string
  postal_code: string
  municipality_name: string
  canton_code: string
  canton_name: string
  created_at: string
}

export interface EmailLog {
  id: string
  user_id: string
  email_type: string
  recipient_email: string
  subject?: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sent_at?: string
  error_message?: string
  created_at: string
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form Types
export interface SignUpForm {
  email: string
  password: string
  confirmPassword: string
}

export interface ProfileForm {
  first_name?: string
  last_name?: string
  phone?: string
  postal_code?: string
  municipality?: string
  canton?: string
  country_of_origin?: string
  has_children: boolean
  family_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'other'
  arrival_date?: string
  work_permit_type?: string
  language_preference: string
}

// Document Upload Types
export interface DocumentUpload {
  file: File
  category_id?: string
  metadata?: Record<string, unknown>
}

export interface DocumentUploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'encrypting' | 'uploading' | 'completed' | 'error'
  error?: string
}

// Swiss PLZ Types
export interface PLZSearchResult {
  postal_code: string
  municipality_name: string
  canton_code: string
  canton_name: string
}

// User Segments
export type UserSegment = 
  | 'eu_citizen' 
  | 'non_eu_citizen' 
  | 'has_children' 
  | 'no_children'
  | 'single'
  | 'married'
  | 'with_work_permit'
  | 'without_work_permit'

// Task Status
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'

// Document Actions
export type DocumentAction = 'view' | 'download' | 'delete' | 'share'

// File Types
export type AllowedFileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'doc' | 'docx'

// Language Preferences
export type LanguagePreference = 'de' | 'en' | 'fr' | 'it'

// Family Status
export type FamilyStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'other'

// Relationship Types
export type Relationship = 'spouse' | 'child' | 'parent' | 'other'
