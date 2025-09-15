-- Quick fix for admin access
-- Run this in Supabase SQL Editor

-- 1. Make sure admin_roles table exists
CREATE TABLE IF NOT EXISTS admin_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
    permissions JSONB NOT NULL DEFAULT '{}',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert your super admin role
INSERT INTO admin_roles (user_id, role, permissions, granted_by, is_active) 
VALUES (
    '7c12a35b-353c-43ff-808b-f1c574df69e0',
    'super_admin',
    '{"users": ["read", "write", "delete"], "analytics": ["read", "export"], "system": ["read", "write"]}',
    '7c12a35b-353c-43ff-808b-f1c574df69e0',
    true
) ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. Drop existing function first, then create the admin function
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
    RETURN QUERY
    SELECT 
        ar.role IN ('super_admin', 'admin') as is_admin,
        ar.role,
        ar.permissions,
        ar.is_active
    FROM admin_roles ar
    WHERE ar.user_id = user_uuid 
    AND ar.is_active = true;
    
    -- If no admin role found, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'user', '{}'::jsonb, false;
    END IF;
END;
$$;

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON admin_roles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_admin_info(UUID) TO anon, authenticated;

-- 5. Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy
DROP POLICY IF EXISTS "Admin roles are viewable by authenticated users" ON admin_roles;
CREATE POLICY "Admin roles are viewable by authenticated users" ON admin_roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Verify the setup
SELECT 'Setup complete! Your admin role:' as status, 
       user_id, role, is_active 
FROM admin_roles 
WHERE user_id = '7c12a35b-353c-43ff-808b-f1c574df69e0';
