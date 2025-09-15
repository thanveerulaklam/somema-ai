-- Verification script for Supabase security fixes
-- Run this in Supabase SQL Editor to verify the fixes are working

-- 1. Check that the problematic views no longer exist
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('admin_users', 'admin_dashboard_data');

-- Expected: No rows should be returned (views should be dropped)

-- 2. Check that the secure functions exist
SELECT 
    proname as function_name,
    prokind as function_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname IN ('get_admin_users', 'get_admin_dashboard_data')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Expected: 2 rows showing both functions exist with security_definer = true

-- 3. Check function permissions (simplified)
SELECT 
    proname as function_name,
    proacl as permissions
FROM pg_proc 
WHERE proname IN ('get_admin_users', 'get_admin_dashboard_data')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Test the functions (this will show if they work for the current user)
-- Note: These will only work if you have admin privileges

-- Test get_admin_users function
SELECT 'Testing get_admin_users function...' as test_step;
SELECT * FROM get_admin_users() LIMIT 1;

-- Test get_admin_dashboard_data function  
SELECT 'Testing get_admin_dashboard_data function...' as test_step;
SELECT * FROM get_admin_dashboard_data() LIMIT 1;

-- 5. Check admin_roles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check if there are any admin users set up
SELECT 
    COUNT(*) as total_admin_roles,
    COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as regular_admins,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_admins
FROM admin_roles;

-- 7. Summary
SELECT 
    'Security Fix Verification Complete' as status,
    'Views dropped: ' || (SELECT COUNT(*) = 0 FROM pg_views WHERE schemaname = 'public' AND viewname IN ('admin_users', 'admin_dashboard_data')) as views_dropped,
    'Functions created: ' || (SELECT COUNT(*) = 2 FROM pg_proc WHERE proname IN ('get_admin_users', 'get_admin_dashboard_data')) as functions_created,
    'Admin roles table: ' || (SELECT COUNT(*) > 0 FROM information_schema.tables WHERE table_name = 'admin_roles' AND table_schema = 'public') as admin_roles_exists;
