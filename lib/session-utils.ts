import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SessionInfo {
  user: any;
  session: any;
  isValid: boolean;
  needsRefresh: boolean;
  expiresAt: number;
}

export interface TokenRefreshResult {
  success: boolean;
  newToken?: string;
  newRefreshToken?: string;
  error?: string;
  user?: any;
}

/**
 * Enhanced session management utilities
 */

/**
 * Validate and refresh JWT token if needed
 */
export async function validateAndRefreshToken(token: string): Promise<TokenRefreshResult> {
  try {
    // First, try to get user with current token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (!userError && userData.user) {
      // Token is valid, return user data
      return {
        success: true,
        user: userData.user
      };
    }
    
    // Token is invalid, try to refresh
    return await refreshToken(token);
    
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      success: false,
      error: 'Token validation failed'
    };
  }
}

/**
 * Refresh JWT token using refresh token
 */
async function refreshToken(token: string): Promise<TokenRefreshResult> {
  try {
    // Extract refresh token from the token (this is a simplified approach)
    // In a real implementation, you'd store refresh tokens separately
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: token
    });
    
    if (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
    
    return {
      success: true,
      newToken: data.session?.access_token,
      newRefreshToken: data.session?.refresh_token,
      user: data.user
    };
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: 'Token refresh failed'
    };
  }
}

/**
 * Get session info from request headers
 */
export function getSessionFromRequest(request: NextRequest): {
  token: string | null;
  sessionInfo: SessionInfo | null;
} {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { token: null, sessionInfo: null };
  }
  
  const token = authHeader.substring(7);
  
  // Basic token validation
  if (!token || token.length < 10) {
    return { token: null, sessionInfo: null };
  }
  
  return { token, sessionInfo: null };
}

/**
 * Create secure session response
 */
export function createSessionResponse(
  user: any,
  token: string,
  refreshToken?: string
): NextResponse {
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      // Don't expose sensitive user data
    }
  });
  
  // Set secure HTTP-only cookies for session management
  if (refreshToken) {
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });
  }
  
  return response;
}

/**
 * Clear session cookies
 */
export function clearSessionCookies(): NextResponse {
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
  
  return response;
}

/**
 * Validate session and return user info
 */
export async function validateSession(request: NextRequest): Promise<{
  isValid: boolean;
  user?: any;
  error?: string;
  needsRefresh?: boolean;
}> {
  try {
    const { token } = getSessionFromRequest(request);
    
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }
    
    const result = await validateAndRefreshToken(token);
    
    if (!result.success) {
      return { isValid: false, error: result.error };
    }
    
    return {
      isValid: true,
      user: result.user,
      needsRefresh: !!result.newToken
    };
    
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, error: 'Session validation failed' };
  }
}

/**
 * Check if user session is active and valid
 */
export async function isSessionActive(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('Session activity check error:', error);
    return false;
  }
}

/**
 * Log user activity for security monitoring
 */
export async function logUserActivity(
  userId: string,
  action: string,
  details: any = {},
  request?: NextRequest
): Promise<void> {
  try {
    const activityLog = {
      user_id: userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
      user_agent: request?.headers.get('user-agent') || 'unknown'
    };
    
    // Log to console (in production, use proper logging service)
    console.log('🔍 User Activity:', activityLog);
    
    // You could also store this in a database table for audit purposes
    // await supabase.from('user_activity_logs').insert(activityLog);
    
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

/**
 * Rate limiting for session operations
 */
const sessionRateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkSessionRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `session_${identifier}`;
  
  let rateLimitData = sessionRateLimit.get(key);
  
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = { count: 0, resetTime: now + windowMs };
  }
  
  if (rateLimitData.count >= maxRequests) {
    const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  rateLimitData.count++;
  sessionRateLimit.set(key, rateLimitData);
  
  return { allowed: true };
}

/**
 * Secure token generation for internal use
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Validate token format
 */
export function isValidTokenFormat(token: string): boolean {
  // Basic JWT format validation
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  return jwtPattern.test(token);
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return now >= expiry;
}
