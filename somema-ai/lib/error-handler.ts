import { NextRequest, NextResponse } from 'next/server';

/**
 * Comprehensive error handling utilities
 */

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  userId?: string;
}

export interface SanitizedError {
  error: string;
  code: string;
  requestId?: string;
  timestamp: string;
}

/**
 * Error codes for different types of errors
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_INVALID_SIGNATURE: 'PAYMENT_INVALID_SIGNATURE',
  PAYMENT_AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',
  
  // Credit errors
  CREDITS_INSUFFICIENT: 'CREDITS_INSUFFICIENT',
  CREDITS_DEDUCTION_FAILED: 'CREDITS_DEDUCTION_FAILED',
  
  // File upload errors
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  
  // External API errors
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  RAZORPAY_API_ERROR: 'RAZORPAY_API_ERROR',
  
  // General errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  BAD_REQUEST: 'BAD_REQUEST'
} as const;

/**
 * Error messages that are safe to expose to clients
 */
export const CLIENT_ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_REQUIRED]: 'Authentication required',
  [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Invalid or expired token',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Token has expired',
  [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  
  [ERROR_CODES.VALIDATION_FAILED]: 'Validation failed',
  [ERROR_CODES.VALIDATION_INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.VALIDATION_MISSING_FIELD]: 'Required field is missing',
  
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed',
  [ERROR_CODES.PAYMENT_INVALID_SIGNATURE]: 'Invalid payment signature',
  [ERROR_CODES.PAYMENT_AMOUNT_MISMATCH]: 'Payment amount mismatch',
  
  [ERROR_CODES.CREDITS_INSUFFICIENT]: 'Insufficient credits',
  [ERROR_CODES.CREDITS_DEDUCTION_FAILED]: 'Credit deduction failed',
  
  [ERROR_CODES.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ERROR_CODES.FILE_INVALID_TYPE]: 'Invalid file type',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size too large',
  
  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
  [ERROR_CODES.DATABASE_CONNECTION_FAILED]: 'Database connection failed',
  
  [ERROR_CODES.EXTERNAL_API_ERROR]: 'External service error',
  [ERROR_CODES.OPENAI_API_ERROR]: 'AI service temporarily unavailable',
  [ERROR_CODES.RAZORPAY_API_ERROR]: 'Payment service temporarily unavailable',
  
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.FORBIDDEN]: 'Access forbidden',
  [ERROR_CODES.BAD_REQUEST]: 'Bad request'
} as const;

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize error message for client consumption
 */
export function sanitizeErrorMessage(
  error: any,
  errorCode: string,
  requestId?: string
): SanitizedError {
  const timestamp = new Date().toISOString();
  
  // Get safe error message
  const safeMessage = CLIENT_ERROR_MESSAGES[errorCode as keyof typeof CLIENT_ERROR_MESSAGES] || 
                     CLIENT_ERROR_MESSAGES[ERROR_CODES.INTERNAL_SERVER_ERROR];
  
  return {
    error: safeMessage,
    code: errorCode,
    requestId,
    timestamp
  };
}

/**
 * Log error details for debugging (server-side only)
 */
export function logError(
  error: any,
  errorCode: string,
  requestId: string,
  userId?: string,
  additionalContext?: any
): void {
  const errorDetails: ErrorDetails = {
    code: errorCode,
    message: error?.message || 'Unknown error',
    details: {
      stack: error?.stack,
      name: error?.name,
      ...additionalContext
    },
    timestamp: new Date().toISOString(),
    requestId,
    userId
  };
  
  // Log to console (in production, use proper logging service)
  console.error('🚨 Error Details:', errorDetails);
  
  // You could also send to external logging service
  // sendToLoggingService(errorDetails);
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  errorCode: string,
  statusCode: number = 500,
  requestId?: string,
  additionalData?: any
): NextResponse {
  const sanitizedError = sanitizeErrorMessage(null, errorCode, requestId);
  
  const response = NextResponse.json({
    ...sanitizedError,
    ...additionalData
  }, { status: statusCode });
  
  // Add request ID to response headers
  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }
  
  return response;
}

/**
 * Handle and wrap errors in try-catch blocks
 */
export function handleError(
  error: any,
  errorCode: string,
  requestId: string,
  userId?: string,
  statusCode: number = 500
): NextResponse {
  // Log the error
  logError(error, errorCode, requestId, userId);
  
  // Return sanitized error response
  return createErrorResponse(errorCode, statusCode, requestId);
}

/**
 * Validate error code
 */
export function isValidErrorCode(code: string): boolean {
  return Object.values(ERROR_CODES).includes(code as any);
}

/**
 * Get appropriate HTTP status code for error
 */
export function getStatusCodeForError(errorCode: string): number {
  const statusMap: Record<string, number> = {
    [ERROR_CODES.AUTH_REQUIRED]: 401,
    [ERROR_CODES.AUTH_INVALID_TOKEN]: 401,
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 401,
    [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
    
    [ERROR_CODES.VALIDATION_FAILED]: 400,
    [ERROR_CODES.VALIDATION_INVALID_INPUT]: 400,
    [ERROR_CODES.VALIDATION_MISSING_FIELD]: 400,
    
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
    
    [ERROR_CODES.PAYMENT_FAILED]: 400,
    [ERROR_CODES.PAYMENT_INVALID_SIGNATURE]: 400,
    [ERROR_CODES.PAYMENT_AMOUNT_MISMATCH]: 400,
    
    [ERROR_CODES.CREDITS_INSUFFICIENT]: 402,
    [ERROR_CODES.CREDITS_DEDUCTION_FAILED]: 500,
    
    [ERROR_CODES.FILE_UPLOAD_FAILED]: 400,
    [ERROR_CODES.FILE_INVALID_TYPE]: 400,
    [ERROR_CODES.FILE_TOO_LARGE]: 413,
    
    [ERROR_CODES.DATABASE_ERROR]: 500,
    [ERROR_CODES.DATABASE_CONNECTION_FAILED]: 503,
    
    [ERROR_CODES.EXTERNAL_API_ERROR]: 502,
    [ERROR_CODES.OPENAI_API_ERROR]: 502,
    [ERROR_CODES.RAZORPAY_API_ERROR]: 502,
    
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
    [ERROR_CODES.NOT_FOUND]: 404,
    [ERROR_CODES.FORBIDDEN]: 403,
    [ERROR_CODES.BAD_REQUEST]: 400
  };
  
  return statusMap[errorCode] || 500;
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorCode: string = ERROR_CODES.INTERNAL_SERVER_ERROR
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      const requestId = generateRequestId();
      return handleError(error, errorCode, requestId);
    }
  };
}

/**
 * Validate and sanitize user input
 */
export function sanitizeUserInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeUserInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Check if error is a known error type
 */
export function isKnownError(error: any): boolean {
  return error && typeof error === 'object' && 'code' in error;
}

/**
 * Extract error code from error object
 */
export function extractErrorCode(error: any): string {
  if (isKnownError(error)) {
    return error.code;
  }
  
  // Try to determine error type from error message or name
  if (error?.message?.includes('validation')) {
    return ERROR_CODES.VALIDATION_FAILED;
  }
  
  if (error?.message?.includes('unauthorized') || error?.message?.includes('token')) {
    return ERROR_CODES.AUTH_INVALID_TOKEN;
  }
  
  if (error?.message?.includes('rate limit')) {
    return ERROR_CODES.RATE_LIMIT_EXCEEDED;
  }
  
  if (error?.message?.includes('payment')) {
    return ERROR_CODES.PAYMENT_FAILED;
  }
  
  if (error?.message?.includes('credit')) {
    return ERROR_CODES.CREDITS_INSUFFICIENT;
  }
  
  return ERROR_CODES.INTERNAL_SERVER_ERROR;
}
