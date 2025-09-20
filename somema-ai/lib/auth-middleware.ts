import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminUser } from './admin-utils';
import { validateSession, logUserActivity } from './session-utils';
import { createRequestMonitor } from './monitoring';
import { ERROR_CODES, createErrorResponse, generateRequestId } from './error-handler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Validates JWT token and returns user data
 */
export async function validateJWTToken(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { valid: false, user: null, error: error?.message || 'Invalid token' };
    }
    
    return { valid: true, user, error: null };
  } catch (error) {
    return { valid: false, user: null, error: 'Token validation failed' };
  }
}

/**
 * Middleware for regular API authentication
 */
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization header required' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const validation = await validateJWTToken(token);
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  return { user: validation.user, token };
}

/**
 * Middleware for admin-only routes
 */
export async function requireAdminAuth(request: NextRequest) {
  // First check regular authentication
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Return the error response
  }

  const { user } = authResult;
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    );
  }
  
  // Check if user is admin
  const isAdmin = await isAdminUser(user.id);
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return { user, isAdmin: true };
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  record.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count 
  };
}

/**
 * Get client IP for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Enhanced combined middleware for API routes with monitoring and error handling
 */
export async function apiMiddleware(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimit?: {
      maxRequests?: number;
      windowMs?: number;
    };
  } = {}
) {
  const requestId = generateRequestId();
  const { logger, metrics, performance } = createRequestMonitor(request);
  
  try {
    const { requireAuth: needsAuth = true, requireAdmin = false, rateLimit: rateLimitOptions } = options;

    // Rate limiting
    if (rateLimitOptions) {
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(
        clientIP,
        rateLimitOptions.maxRequests || 100,
        rateLimitOptions.windowMs || 15 * 60 * 1000
      );

      if (!rateLimitResult.allowed) {
        logger.warn('Rate limit exceeded', { clientIP, rateLimitResult });
        metrics.incrementCounter('rate_limit_exceeded', { endpoint: request.nextUrl.pathname });
        
        return createErrorResponse(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          429,
          requestId,
          { resetTime: rateLimitResult.resetTime }
        );
      }
    }

    // Authentication
    if (needsAuth) {
      if (requireAdmin) {
        const result = await requireAdminAuth(request);
        if (result instanceof NextResponse) {
          performance.end(true);
          return result;
        }
        
        // Log admin access
        if (result.user) {
          await logUserActivity(result.user.id, 'admin_access', {
            endpoint: request.nextUrl.pathname,
            method: request.method
          }, request);
        }
        
        performance.end(false);
        return result;
      } else {
        const result = await requireAuth(request);
        if (result instanceof NextResponse) {
          performance.end(true);
          return result;
        }
        
        // Log user activity
        if (result.user) {
          await logUserActivity(result.user.id, 'api_access', {
            endpoint: request.nextUrl.pathname,
            method: request.method
          }, request);
        }
        
        performance.end(false);
        return result;
      }
    }

    performance.end(false);
    return { user: null };
    
  } catch (error: any) {
    logger.error('API middleware error', { error: error?.message || 'Unknown error', stack: error?.stack });
    performance.end(true);
    
    return createErrorResponse(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      500,
      requestId
    );
  }
}
