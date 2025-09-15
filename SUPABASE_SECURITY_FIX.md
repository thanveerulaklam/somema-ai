# Supabase Security Issues - Resolution Guide

## Overview
This document addresses the security warnings received from Supabase Security Advisor regarding exposed auth.users data and SECURITY DEFINER views.

## Issues Identified

### 1. Exposed Auth Users (Critical)
- **Entity**: `public.admin_users`
- **Issue**: View exposes `auth.users` data to anon or authenticated roles
- **Risk**: Unauthorized access to sensitive user authentication data

### 2. Security Definer Views (High)
- **Entities**: `public.admin_users` and `public.admin_dashboard_data`
- **Issue**: Views defined with SECURITY DEFINER property
- **Risk**: Views enforce permissions of creator rather than querying user

## Resolution Applied

### 1. Function-Based Security (Replacing Views)
Since PostgreSQL doesn't support RLS on views, we replaced the problematic views with secure functions:

```sql
-- Secure function for admin users data
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
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
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

-- Secure function for admin dashboard data
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
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
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
```

### 2. Access Control Implementation
The functions include built-in access control that checks admin privileges before returning data:

```sql
-- Grant execute permissions only to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO authenticated;

-- Revoke anonymous access
REVOKE EXECUTE ON FUNCTION get_admin_users() FROM anon;
REVOKE EXECUTE ON FUNCTION get_admin_dashboard_data() FROM anon;
```

### 3. Access Control Function
Created a verification function for additional security:

```sql
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
```

### 4. Permission Management
- Revoked anonymous access to both views
- Granted SELECT permissions only to authenticated users
- RLS policies handle actual access control

## Security Improvements

### Before Fix
- ❌ Views exposed auth.users data to all authenticated users
- ❌ SECURITY DEFINER bypassed user-level permissions
- ❌ No access control on sensitive admin data

### After Fix
- ✅ Functions with built-in access control restrict data to admin users only
- ✅ SECURITY DEFINER used appropriately in functions (not views)
- ✅ Anonymous access completely blocked
- ✅ Multi-layer security with verification function
- ✅ Proper audit trail through admin_roles table

## Testing

### Manual Testing
1. Run the security test script:
   ```bash
   node test-security-fixes.js
   ```

2. Verify in Supabase Dashboard:
   - Check Security Advisor for resolved warnings
   - Test anonymous access (should be blocked)
   - Test authenticated non-admin access (should be blocked)
   - Test admin access (should work)

### Expected Results
- ✅ Anonymous users cannot access admin functions
- ✅ Regular authenticated users cannot access admin functions
- ✅ Only users with admin/super_admin roles can access functions
- ✅ Service role can still access for administrative purposes

## Deployment Steps

1. **Apply the security fix**:
   ```bash
   # Run the SQL script in Supabase SQL Editor
   psql -f fix-supabase-security-issues.sql
   ```

2. **Test the fixes**:
   ```bash
   node test-security-fixes.js
   ```

3. **Verify in Supabase Dashboard**:
   - Go to Security Advisor
   - Check that warnings are resolved
   - Test access patterns

4. **Monitor**:
   - Check Security Advisor weekly
   - Monitor admin access logs
   - Review any new security warnings

## Maintenance

### Regular Checks
- Weekly Security Advisor review
- Monthly admin access audit
- Quarterly security policy review

### Adding New Admin Data Access
When creating new admin data access, always:
1. Use functions instead of views: `CREATE OR REPLACE FUNCTION get_admin_data()`
2. Include access control: Check admin roles before returning data
3. Use SECURITY DEFINER appropriately in functions
4. Test with anonymous and non-admin users
5. Document in this file

## Contact
For questions about these security fixes, refer to the Supabase documentation on Row Level Security and contact the development team.

## References
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
