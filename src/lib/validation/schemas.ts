// ============================================================================
// VALIDATION SCHEMAS
// Central validation using Zod for all API inputs
// ============================================================================

import { z } from 'zod';

// Common validation patterns
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format');
export const urlSchema = z.string().url('Invalid URL format');

// Document-related schemas
export const DocumentDownloadSchema = z.object({
  documentId: uuidSchema,
  userId: uuidSchema
});

export const DocumentUploadSchema = z.object({
  file: z.instanceof(File, 'File is required'),
  category: z.string().optional(),
  description: z.string().optional()
});

// User profile schemas
export const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: emailSchema,
  phone: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  lastResidenceCountry: z.string().optional(),
  hasChildren: z.boolean().optional(),
  municipality: z.string().optional(),
  canton: z.string().optional(),
  postalCode: z.string().optional()
});

// Task-related schemas
export const TaskActionSchema = z.object({
  taskId: uuidSchema,
  action: z.enum(['mark_done', 'set_reminder', 'open_modal']),
  reminderTime: z.string().optional()
});

// Email schemas
export const EmailTestSchema = z.object({
  recipient: emailSchema,
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required')
});

// Municipality/School schemas
export const MunicipalitySearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  limit: z.number().min(1).max(50).optional().default(10)
});

export const SchoolEmailSchema = z.object({
  municipality: z.string().min(1, 'Municipality is required'),
  canton: z.string().min(1, 'Canton is required'),
  userEmail: emailSchema.optional(),
  childrenAges: z.array(z.number()).optional()
});

// GDPR schemas
export const GDPRExportSchema = z.object({
  format: z.enum(['json', 'readable', 'simple']).optional().default('readable')
});

export const GDPRDeleteSchema = z.object({
  confirmation: z.literal('DELETE_MY_ACCOUNT'),
  verificationToken: z.string().optional()
});

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params = Object.fromEntries(searchParams.entries());
  return validateInput(schema, params);
}

export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return validateInput(schema, body);
}
