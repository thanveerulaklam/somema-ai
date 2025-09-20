-- Fix the admin function to ensure it works correctly
-- Run this in Supabase SQL Editor

-- 1. Drop and recreate the function with proper return format
DROP FUNCTION IF EXISTS get_user_admin_info(UUID);

CREATE OR REPLACE FUNCTION get_user_admin_info(user_uuid UUID)
RETURNS TABLE(
    is_admin BOOLEAN,
    role TEXT,
    permissions JSONB,
    is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has admin role
    IF EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = user_uuid 
        AND ar.is_active = true
        AND ar.role IN ('super_admin', 'admin')
    ) THEN
        -- Return admin info
        RETURN QUERY
        SELECT 
            true as is_admin,
            ar.role,
            ar.permissions,
            ar.is_active
        FROM admin_roles ar
        WHERE ar.user_id = user_uuid 
        AND ar.is_active = true
        AND ar.role IN ('super_admin', 'admin')
        LIMIT 1;
    ELSE
        -- Return non-admin info
        RETURN QUERY SELECT false, 'user', '{}'::jsonb, false;
    END IF;
END;
$$;

-- 2. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_admin_info(UUID) TO anon, authenticated;

-- 3. Verify your admin role exists
SELECT 'Your admin role:' as status, 
       user_id, role, is_active, permissions
FROM admin_roles 
WHERE user_id = '7c12a35b-353c-43ff-808b-f1c574df69e0';

-- 4. Test the function
SELECT 'Function test result:' as test, * FROM get_user_admin_info('7c12a35b-353c-43ff-808b-f1c574df69e0');
