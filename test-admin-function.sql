-- Test the admin function directly
-- Run this in Supabase SQL Editor

-- 1. Test if the function exists and works
SELECT get_user_admin_info('7c12a35b-353c-43ff-808b-f1c574df69e0');

-- 2. Check if your admin role exists
SELECT * FROM admin_roles WHERE user_id = '7c12a35b-353c-43ff-808b-f1c574df69e0';

-- 3. Check function permissions
SELECT 
    p.proname as function_name,
    p.proacl as permissions,
    r.rolname as role_name
FROM pg_proc p
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'get_user_admin_info';

-- 4. Test RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_roles';
