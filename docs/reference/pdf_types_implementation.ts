// features/pdf-upload/types/pdf.ts

export interface PDFDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  document_type?: 'passport' | 'employment_contract' | 'rental_agreement' | 'municipality_form' | 'school_form' | 'other';
  task_id?: number;
  uploaded_at: string;
  analyzed: boolean;
  is_fillable: boolean;
  analysis_result?: PDFAnalysisResult;
}

export interface PDFAnalysisResult {
  is_fillable: boolean;
  form_type?: string;
  detected_fields: PDFField[];
  field_count: number;
  page_count: number;
  confidence_score: number;
  language?: 'de' | 'fr' | 'it' | 'en';
}

export interface PDFField {
  field_name: string;
  field_type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'date' | 'signature';
  field_label?: string;
  default_value?: string;
  required?: boolean;
  auto_fillable: boolean;
  mapped_to?: keyof UserProfile;
  confidence: number;
}

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  country_of_origin?: string;
  current_address?: string;
  municipality?: string;
  canton?: string;
  postal_code?: string;
  employer?: string;
  has_kids: boolean;
  num_children?: number;
}

export interface AutoFillResult {
  success: boolean;
  filled_fields: number;
  total_fields: number;
  accuracy: number;
  filled_pdf_url?: string;
  errors?: string[];
}

export interface FieldMapping {
  pdf_field_name: string;
  user_profile_key: keyof UserProfile;
  confidence: number;
  manual_override?: boolean;
}
