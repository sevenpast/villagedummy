// ============================================================================
// APPLICATION CONSTANTS
// Centralized constants for better maintainability
// ============================================================================

// GDPR Deletion Types
export const VALID_DELETION_TYPES = ['full_deletion', 'anonymization'] as const;
export type DeletionType = typeof VALID_DELETION_TYPES[number];

// GDPR Export Formats
export const VALID_EXPORT_FORMATS = ['json', 'readable', 'simple'] as const;
export type ExportFormat = typeof VALID_EXPORT_FORMATS[number];

// Task Actions
export const VALID_TASK_ACTIONS = ['mark_done', 'set_reminder', 'open_modal'] as const;
export type TaskAction = typeof VALID_TASK_ACTIONS[number];

// File Upload Limits
export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
} as const;

// API Response Messages
export const API_MESSAGES = {
  SUCCESS: {
    PROFILE_SAVED: 'Profile saved successfully',
    DOCUMENT_UPLOADED: 'Document uploaded successfully',
    EMAIL_SENT: 'Email sent successfully',
    TASK_UPDATED: 'Task updated successfully'
  },
  ERROR: {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error'
  }
} as const;

// Database Error Codes
export const DB_ERROR_CODES = {
  NO_ROWS_RETURNED: 'PGRST116',
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502'
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  GEMINI_RESPONSE: 7 * 24 * 60 * 60, // 7 days
  MUNICIPALITY_DATA: 24 * 60 * 60, // 1 day
  SCHOOL_DATA: 24 * 60 * 60, // 1 day
  USER_PROFILE: 5 * 60 // 5 minutes
} as const;

// Swiss-specific Constants
export const SWISS_CONSTANTS = {
  CANTONS: [
    'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
    'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
    'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'
  ],
  OFFICIAL_LANGUAGES: ['de', 'fr', 'it', 'rm'],
  POSTAL_CODE_PATTERN: /^[1-9]\d{3}$/
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+41|0)[1-9]\d{8}$/,
  SWISS_POSTAL_CODE: /^[1-9]\d{3}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
} as const;
