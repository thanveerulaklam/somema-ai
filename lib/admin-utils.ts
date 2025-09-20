import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cache for admin checks to prevent excessive database calls
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Validate UUID format to prevent injection attacks
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if a user is an admin (has admin or super_admin role)
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format for admin check:', userId);
      return false;
    }

    // Check cache first
    const cached = adminCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🔍 Using cached admin check for user:', userId, 'Result:', cached.isAdmin);
      return cached.isAdmin;
    }

    console.log('🔍 Checking admin access for user:', userId);
    
    // Check if user has admin role in the database
    const { data: adminInfo, error: adminError } = await supabase
      .rpc('get_user_admin_info', { user_uuid: userId });

    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      // Cache negative result to prevent repeated failed queries
      adminCache.set(userId, { isAdmin: false, timestamp: Date.now() });
      return false;
    }

    // The function returns an array, so we need to check the first element
    if (!adminInfo || !Array.isArray(adminInfo) || adminInfo.length === 0) {
      console.log('ℹ️ No admin info found for user:', userId);
      // Cache negative result
      adminCache.set(userId, { isAdmin: false, timestamp: Date.now() });
      return false;
    }

    const adminData = adminInfo[0];
    
    // Additional validation of admin data
    if (typeof adminData.is_admin !== 'boolean' || typeof adminData.is_active !== 'boolean') {
      console.error('❌ Invalid admin data structure:', adminData);
      adminCache.set(userId, { isAdmin: false, timestamp: Date.now() });
      return false;
    }

    const isAdmin = adminData.is_admin && adminData.is_active;
    
    console.log('✅ Admin check result:', {
      userId,
      isAdmin,
      role: adminData.role,
      isActive: adminData.is_active
    });
    
    // Cache the result
    adminCache.set(userId, { isAdmin, timestamp: Date.now() });
    
    return isAdmin;
  } catch (error) {
    console.error('❌ Error checking admin access:', error);
    // Cache negative result on error
    adminCache.set(userId, { isAdmin: false, timestamp: Date.now() });
    return false;
  }
}

/**
 * Check if a user should bypass credit limits (admin users)
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user should bypass credits, false otherwise
 */
export async function shouldBypassCredits(userId: string): Promise<boolean> {
  return await isAdminUser(userId)
}

/**
 * Get admin user info for logging purposes
 * @param userId - The user ID to check
 * @returns Promise<object> - Admin info object
 */
export async function getAdminInfo(userId: string): Promise<{
  isAdmin: boolean
  role?: string
  permissions?: any
}> {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format for admin info check:', userId);
      return { isAdmin: false };
    }

    const { data: adminInfo, error: adminError } = await supabase
      .rpc('get_user_admin_info', { user_uuid: userId });

    if (adminError || !adminInfo || !Array.isArray(adminInfo) || adminInfo.length === 0) {
      return { isAdmin: false };
    }

    const adminData = adminInfo[0];
    
    // Validate admin data structure
    if (typeof adminData.is_admin !== 'boolean' || typeof adminData.is_active !== 'boolean') {
      console.error('❌ Invalid admin data structure:', adminData);
      return { isAdmin: false };
    }

    return {
      isAdmin: adminData.is_admin && adminData.is_active,
      role: adminData.role,
      permissions: adminData.permissions
    };
  } catch (error) {
    console.error('Error getting admin info:', error);
    return { isAdmin: false };
  }
}

/**
 * Clear admin cache (useful for testing or when admin status changes)
 * @param userId - Optional user ID to clear specific cache entry
 */
export function clearAdminCache(userId?: string): void {
  if (userId) {
    adminCache.delete(userId);
    console.log('🧹 Cleared admin cache for user:', userId);
  } else {
    adminCache.clear();
    console.log('🧹 Cleared all admin cache');
  }
}

/**
 * Add audit log for admin actions
 * @param userId - The user ID performing the action
 * @param action - The action being performed
 * @param details - Additional details about the action
 */
export async function logAdminAction(
  userId: string,
  action: string,
  details: any = {}
): Promise<void> {
  try {
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format for admin action log:', userId);
      return;
    }

    // In a production environment, you would log this to a proper audit system
    console.log('📝 Admin Action Log:', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: 'unknown' // You might want to pass this from the request
    });

    // You could also store this in a database table for audit purposes
    // await supabase.from('admin_audit_logs').insert({
    //   user_id: userId,
    //   action,
    //   details,
    //   timestamp: new Date().toISOString()
    // });

  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}
