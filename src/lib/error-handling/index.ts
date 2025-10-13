// ============================================================================
// CENTRAL ERROR HANDLING STRATEGY
// Unified error handling across the entire application
// ============================================================================

import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // External service errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  GEMINI_API_ERROR = 'GEMINI_API_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  
  // File/Document errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Generic errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
  isOperational: boolean;
  timestamp: string;
  requestId?: string;
}

export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error creators
export const createError = {
  unauthorized: (message: string = 'Authentication required', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.UNAUTHORIZED, message, 401, true, details, requestId),
  
  forbidden: (message: string = 'Access denied', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.FORBIDDEN, message, 403, true, details, requestId),
  
  validation: (message: string = 'Validation failed', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.VALIDATION_ERROR, message, 400, true, details, requestId),
  
  notFound: (message: string = 'Resource not found', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.RECORD_NOT_FOUND, message, 404, true, details, requestId),
  
  database: (message: string = 'Database operation failed', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.DATABASE_ERROR, message, 500, true, details, requestId),
  
  externalApi: (service: string, message: string = 'External service error', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.EXTERNAL_API_ERROR, `${service}: ${message}`, 502, true, details, requestId),
  
  gemini: (message: string = 'AI service error', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.GEMINI_API_ERROR, message, 502, true, details, requestId),
  
  email: (message: string = 'Email service error', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.EMAIL_SERVICE_ERROR, message, 502, true, details, requestId),
  
  file: (message: string = 'File operation failed', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.UPLOAD_FAILED, message, 400, true, details, requestId),
  
  rateLimit: (message: string = 'Rate limit exceeded', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, true, details, requestId),
  
  internal: (message: string = 'Internal server error', details?: any, requestId?: string) =>
    new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, false, details, requestId)
};

// Error response formatter
export function formatErrorResponse(error: Error | CustomError, requestId?: string): NextResponse {
  let appError: AppError;

  if (error instanceof CustomError) {
    appError = {
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      timestamp: error.timestamp,
      requestId: error.requestId || requestId
    };
  } else {
    // Handle unexpected errors
    appError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      statusCode: 500,
      isOperational: false,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  // Log error using structured logging
  if (process.env.NODE_ENV === 'development' || appError.isOperational) {
    const { logger } = await import('@/lib/logging');
    logger.error('API Error', {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      requestId: appError.requestId
    });
  }

  return NextResponse.json(
    {
      error: appError.message,
      code: appError.code,
      timestamp: appError.timestamp,
      requestId: appError.requestId,
      ...(process.env.NODE_ENV === 'development' && { details: appError.details })
    },
    { status: appError.statusCode }
  );
}

// Async error handler wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}

// Error boundary for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>,
  requestId?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return formatErrorResponse(error as Error, requestId);
    }
  };
}

// Validation error formatter
export function formatValidationError(error: any): CustomError {
  if (error.name === 'ZodError') {
    const details = error.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    return createError.validation(
      'Validation failed',
      { validationErrors: details }
    );
  }
  
  return createError.validation(error.message || 'Validation failed');
}

// Database error formatter
export function formatDatabaseError(error: any): CustomError {
  const { DB_ERROR_CODES } = require('@/lib/constants');
  
  if (error.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
    return createError.validation('Record already exists', { constraint: error.constraint });
  }
  
  if (error.code === DB_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
    return createError.validation('Referenced record not found', { constraint: error.constraint });
  }
  
  if (error.code === DB_ERROR_CODES.NOT_NULL_VIOLATION) {
    return createError.validation('Required field is missing', { column: error.column });
  }
  
  return createError.database('Database operation failed', { 
    code: error.code,
    message: error.message 
  });
}

// External API error formatter
export function formatExternalApiError(service: string, error: any): CustomError {
  if (error.status === 401) {
    return createError.externalApi(service, 'Authentication failed', { status: error.status });
  }
  
  if (error.status === 403) {
    return createError.externalApi(service, 'Access forbidden', { status: error.status });
  }
  
  if (error.status === 429) {
    return createError.rateLimit('Rate limit exceeded for external service', { service, status: error.status });
  }
  
  if (error.status >= 500) {
    return createError.externalApi(service, 'Service unavailable', { status: error.status });
  }
  
  return createError.externalApi(service, 'External service error', { 
    status: error.status,
    message: error.message 
  });
}
