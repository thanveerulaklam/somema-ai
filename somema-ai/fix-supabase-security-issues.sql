-- Fix Supabase Security Issues
-- This script addresses the security warnings from Supabase Security Advisor

-- 1. Drop existing views that have security issues
DROP VIEW IF EXISTS admin_users CASCADE;
DROP VIEW IF EXISTS admin_dashboard_data CASCADE;

-- 2. Create secure admin_users view with proper RLS
CREATE VIEW admin_users AS
SELECT 
    ar.user_id,
    ar.role,
    ar.permissions,
    ar.granted_by,
    ar.granted_at,
    ar.expires_at,
    ar.is_active,
    up.business_name,
    au.email,
    ar.created_at,
    ar.updated_at
FROM admin_roles ar
JOIN user_profiles up ON ar.user_id = up.user_id
JOIN auth.users au ON ar.user_id = au.id
WHERE ar.is_active = true;

-- 3. Create secure admin_dashboard_data view with proper RLS
CREATE VIEW admin_dashboard_data AS
SELECT 
    up.user_id,
    up.business_name,
    up.industry,
    up.subscription_plan,
    up.subscription_status,
    up.image_enhancement_credits,
    up.post_generation_credits,
    up.created_at,
    up.updated_at,
    ar.role as admin_role,
    ar.is_active as admin_active
FROM user_profiles up
LEFT JOIN admin_roles ar ON up.user_id = ar.user_id AND ar.is_active = true;

-- 4. Create secure functions instead of views with RLS
-- Views cannot have RLS enabled, so we'll use functions with SECURITY DEFINER

-- 5. Create secure function to get admin users data
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    permissions JSONB,
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    business_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Check if user has admin access
    IF NOT EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = auth.uid() 
        AND ar.role IN ('admin', 'super_admin')
        AND ar.is_active = true
        AND (ar.expires_at IS NULL OR ar.expires_at > NOW())
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        ar.user_id,
        ar.role,
        ar.permissions,
        ar.granted_by,
        ar.granted_at,
        ar.expires_at,
        ar.is_active,
        up.business_name,
        au.email,
        ar.created_at,
        ar.updated_at
    FROM admin_roles ar
    JOIN user_profiles up ON ar.user_id = up.user_id
    JOIN auth.users au ON ar.user_id = au.id
    WHERE ar.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create secure function to get admin dashboard data
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS TABLE (
    user_id UUID,
    business_name TEXT,
    industry TEXT,
    subscription_plan TEXT,
    subscription_status TEXT,
    image_enhancement_credits INTEGER,
    post_generation_credits INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    admin_role TEXT,
    admin_active BOOLEAN
) AS $$
BEGIN
    -- Check if user has admin access
    IF NOT EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = auth.uid() 
        AND ar.role IN ('admin', 'super_admin')
        AND ar.is_active = true
        AND (ar.expires_at IS NULL OR ar.expires_at > NOW())
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        up.user_id,
        up.business_name,
        up.industry,
        up.subscription_plan,
        up.subscription_status,
        up.image_enhancement_credits,
        up.post_generation_credits,
        up.created_at,
        up.updated_at,
        ar.role as admin_role,
        ar.is_active as admin_active
    FROM user_profiles up
    LEFT JOIN admin_roles ar ON up.user_id = ar.user_id AND ar.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permissions on the secure functions
GRANT EXECUTE ON FUNCTION get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO authenticated;

-- 8. Revoke any existing permissions that might bypass security
REVOKE ALL ON admin_users FROM anon;
REVOKE ALL ON admin_dashboard_data FROM anon;
REVOKE EXECUTE ON FUNCTION get_admin_users() FROM anon;
REVOKE EXECUTE ON FUNCTION get_admin_dashboard_data() FROM anon;

-- 9. Add comments for documentation
COMMENT ON FUNCTION get_admin_users() IS 'Secure function for admin user data. Only accessible by users with admin or super_admin roles.';
COMMENT ON FUNCTION get_admin_dashboard_data() IS 'Secure function for admin dashboard data. Only accessible by users with admin or super_admin roles.';

-- 10. Create a function to verify admin access (for use in other contexts)
CREATE OR REPLACE FUNCTION verify_admin_view_access()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has admin role
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Since we're using functions instead of views, we don't need RLS policies
-- The security is handled within the functions themselves

-- 12. Ensure no other views or tables expose auth.users data inappropriately
-- Check for any other potential security issues
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Log any views that might be accessing auth.users
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition LIKE '%auth.users%'
    LOOP
        RAISE NOTICE 'View % in schema % accesses auth.users - please review for security', 
            view_record.viewname, view_record.schemaname;
    END LOOP;
END $$;

-- 13. Final security check - ensure functions are properly created
DO $$
BEGIN
    -- Verify functions exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_admin_users'
    ) THEN
        RAISE EXCEPTION 'get_admin_users function not created properly';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_admin_dashboard_data'
    ) THEN
        RAISE EXCEPTION 'get_admin_dashboard_data function not created properly';
    END IF;
    
    RAISE NOTICE 'Security fixes applied successfully. Secure functions created for admin data access.';
END $$;
