-- Add proper admin security to Somema AI
-- This replaces the insecure business name check with proper role-based access control

-- 1. Add admin_roles table for role management
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')) DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add role column to user_profiles (for backward compatibility)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 3. Create admin_invitations table for secure admin onboarding
CREATE TABLE IF NOT EXISTS admin_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create admin_audit_logs table for tracking all admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert default super admin (you'll need to update this with your actual user ID)
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
INSERT INTO admin_roles (user_id, role, permissions, granted_by) 
VALUES (
    '7c12a35b-353c-43ff-808b-f1c574df69e0', -- Your actual user ID
    'super_admin',
    '{"users": ["read", "write", "delete"], "analytics": ["read", "export"], "system": ["read", "write"]}',
    '7c12a35b-353c-43ff-808b-f1c574df69e0' -- Your actual user ID
) ON CONFLICT (user_id) DO NOTHING;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON admin_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for admin_roles
CREATE POLICY "Users can view their own role" ON admin_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only super admins can manage roles" ON admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- 9. Create RLS policies for admin_invitations
CREATE POLICY "Only admins can view invitations" ON admin_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only super admins can create invitations" ON admin_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- 10. Create RLS policies for admin_audit_logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can insert audit logs" ON admin_audit_logs
    FOR INSERT WITH CHECK (true);

-- 11. Create function to check admin access
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = user_uuid 
        AND role IN ('admin', 'super_admin')
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to check super admin access
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = user_uuid 
        AND role = 'super_admin'
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT permissions FROM admin_roles 
        WHERE user_id = user_uuid 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    action_name TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id TEXT DEFAULT NULL,
    action_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_audit_logs (
        admin_user_id, 
        action, 
        resource_type, 
        resource_id, 
        details
    ) VALUES (
        auth.uid(),
        action_name,
        resource_type,
        resource_id,
        action_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create trigger to update updated_at timestamp
CREATE TRIGGER update_admin_roles_updated_at 
    BEFORE UPDATE ON admin_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_invitations TO authenticated;
GRANT SELECT ON admin_audit_logs TO authenticated;
GRANT INSERT ON admin_audit_logs TO authenticated;

-- 17. Create view for admin users (for easier querying)
CREATE OR REPLACE VIEW admin_users AS
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

-- 18. Insert sample admin invitation (you can delete this after setup)
-- INSERT INTO admin_invitations (email, role, invited_by, invitation_token, expires_at)
-- VALUES (
--     'admin@yourdomain.com',
--     'admin',
--     '7c12a35b-353c-43ff-808b-f1c574df69e0', -- Your actual user ID
--     gen_random_uuid()::text,
--     NOW() + INTERVAL '7 days'
-- );

-- 19. Create function to accept admin invitation
CREATE OR REPLACE FUNCTION accept_admin_invitation(
    invitation_token TEXT,
    accepting_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record 
    FROM admin_invitations 
    WHERE invitation_token = accept_admin_invitation.invitation_token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update invitation status
    UPDATE admin_invitations 
    SET status = 'accepted', accepted_at = NOW(), accepted_by = accepting_user_id
    WHERE id = invitation_record.id;
    
    -- Create admin role for the user
    INSERT INTO admin_roles (user_id, role, permissions, granted_by)
    VALUES (accepting_user_id, invitation_record.role, '{}', invitation_record.invited_by)
    ON CONFLICT (user_id) DO UPDATE SET
        role = invitation_record.role,
        permissions = '{}',
        granted_by = invitation_record.invited_by,
        updated_at = NOW();
    
    -- Log the action
    PERFORM log_admin_action(
        'admin_invitation_accepted',
        'admin_invitation',
        invitation_record.id::text,
        jsonb_build_object('invited_email', invitation_record.email, 'role', invitation_record.role)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Create function to revoke admin access
CREATE OR REPLACE FUNCTION revoke_admin_access(
    target_user_id UUID,
    reason TEXT DEFAULT 'Admin access revoked'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is super admin
    IF NOT is_super_admin() THEN
        RETURN FALSE;
    END IF;
    
    -- Deactivate admin role
    UPDATE admin_roles 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Log the action
    PERFORM log_admin_action(
        'admin_access_revoked',
        'admin_role',
        target_user_id::text,
        jsonb_build_object('target_user_id', target_user_id, 'reason', reason)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. Create function to grant admin access
CREATE OR REPLACE FUNCTION grant_admin_access(
    target_user_id UUID,
    role_type TEXT DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is super admin
    IF NOT is_super_admin() THEN
        RETURN FALSE;
    END IF;
    
    -- Validate role type
    IF role_type NOT IN ('admin', 'super_admin') THEN
        RETURN FALSE;
    END IF;
    
    -- Grant admin access
    INSERT INTO admin_roles (user_id, role, permissions, granted_by, expires_at)
    VALUES (target_user_id, role_type, permissions, auth.uid(), expires_at)
    ON CONFLICT (user_id) DO UPDATE SET
        role = role_type,
        permissions = permissions,
        granted_by = auth.uid(),
        expires_at = expires_at,
        is_active = true,
        updated_at = NOW();
    
    -- Log the action
    PERFORM log_admin_action(
        'admin_access_granted',
        'admin_role',
        target_user_id::text,
        jsonb_build_object('target_user_id', target_user_id, 'role', role_type, 'permissions', permissions)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Create function to check specific permissions
CREATE OR REPLACE FUNCTION has_permission(
    permission_name TEXT,
    resource_type TEXT DEFAULT NULL,
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    -- Super admins have all permissions
    IF is_super_admin(user_uuid) THEN
        RETURN TRUE;
    END IF;
    
    -- Get user permissions
    user_permissions := get_user_permissions(user_uuid);
    
    -- Check if user has the required permission
    IF resource_type IS NOT NULL THEN
        RETURN user_permissions ? resource_type AND 
               user_permissions->resource_type ? permission_name;
    ELSE
        RETURN user_permissions ? permission_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 23. Create admin dashboard access function
CREATE OR REPLACE FUNCTION can_access_admin_dashboard(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_admin(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 24. Create user management access function
CREATE OR REPLACE FUNCTION can_manage_users(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_permission('write', 'users', user_uuid) OR is_super_admin(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25. Create analytics access function
CREATE OR REPLACE FUNCTION can_access_analytics(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_permission('read', 'analytics', user_uuid) OR is_super_admin(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 26. Update existing user_profiles to have 'user' role by default
UPDATE user_profiles SET role = 'user' WHERE role IS NULL;

-- 27. Create index on user_profiles role column
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- 28. Create function to get admin statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_admins', (SELECT COUNT(*) FROM admin_roles WHERE is_active = true),
        'super_admins', (SELECT COUNT(*) FROM admin_roles WHERE role = 'super_admin' AND is_active = true),
        'regular_admins', (SELECT COUNT(*) FROM admin_roles WHERE role = 'admin' AND is_active = true),
        'pending_invitations', (SELECT COUNT(*) FROM admin_invitations WHERE status = 'pending'),
        'recent_audit_logs', (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours')
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 29. Create function to get user's admin info
CREATE OR REPLACE FUNCTION get_user_admin_info(user_uuid UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
    admin_info JSONB;
BEGIN
    SELECT jsonb_build_object(
        'is_admin', is_admin(user_uuid),
        'is_super_admin', is_super_admin(user_uuid),
        'role', ar.role,
        'permissions', ar.permissions,
        'granted_by', ar.granted_by,
        'granted_at', ar.granted_at,
        'expires_at', ar.expires_at,
        'is_active', ar.is_active
    ) INTO admin_info
    FROM admin_roles ar
    WHERE ar.user_id = user_uuid AND ar.is_active = true;
    
    RETURN COALESCE(admin_info, '{"is_admin": false, "is_super_admin": false}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30. Final security check - ensure no users can modify their own admin status
CREATE POLICY "Users cannot modify their own admin role" ON admin_roles
    FOR UPDATE USING (user_id != auth.uid());

-- 31. Create function to validate admin session
CREATE OR REPLACE FUNCTION validate_admin_session(user_uuid UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
    session_info JSONB;
BEGIN
    -- Check if user exists and is active
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RETURN jsonb_build_object('valid', false, 'error', 'User not found');
    END IF;
    
    -- Get admin info
    session_info := get_user_admin_info(user_uuid);
    
    -- Add validation timestamp
    session_info := session_info || jsonb_build_object(
        'validated_at', NOW(),
        'session_valid', session_info->>'is_admin' = 'true'
    );
    
    RETURN session_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 32. Create view for admin dashboard data
CREATE OR REPLACE VIEW admin_dashboard_data AS
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

-- 33. Grant permissions on the view
GRANT SELECT ON admin_dashboard_data TO authenticated;

-- 34. Create function to check if user can access specific admin feature
CREATE OR REPLACE FUNCTION can_access_admin_feature(
    feature_name TEXT,
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
    CASE feature_name
        WHEN 'dashboard' THEN
            RETURN can_access_admin_dashboard(user_uuid);
        WHEN 'users' THEN
            RETURN can_manage_users(user_uuid);
        WHEN 'analytics' THEN
            RETURN can_access_analytics(user_uuid);
        WHEN 'system' THEN
            RETURN is_super_admin(user_uuid);
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 35. Final security summary
COMMENT ON SCHEMA public IS 'Admin security system implemented. Users must have proper admin roles to access admin features.';
COMMENT ON TABLE admin_roles IS 'Central table for managing admin access. Only super admins can modify this table.';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all admin actions. Cannot be modified by users.';
COMMENT ON TABLE admin_invitations IS 'Secure admin invitation system. Only super admins can create invitations.';

-- 36. Create function to get admin activity summary
CREATE OR REPLACE FUNCTION get_admin_activity_summary(days_back INTEGER DEFAULT 7)
RETURNS JSONB AS $$
DECLARE
    activity_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_actions', (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at > NOW() - (days_back || ' days')::INTERVAL),
        'unique_admins', (SELECT COUNT(DISTINCT admin_user_id) FROM admin_audit_logs WHERE created_at > NOW() - (days_back || ' days')::INTERVAL),
        'top_actions', (
            SELECT jsonb_agg(action_counts)
            FROM (
                SELECT jsonb_build_object('action', action, 'count', COUNT(*)) as action_counts
                FROM admin_audit_logs 
                WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
                GROUP BY action 
                ORDER BY COUNT(*) DESC 
                LIMIT 5
            ) action_summary
        ),
        'recent_activity', (
            SELECT jsonb_agg(recent_logs)
            FROM (
                SELECT jsonb_build_object(
                    'admin_user_id', al.admin_user_id,
                    'action', al.action,
                    'created_at', al.created_at
                ) as recent_logs
                FROM admin_audit_logs al
                WHERE al.created_at > NOW() - (days_back || ' days')::INTERVAL
                ORDER BY al.created_at DESC
                LIMIT 10
            ) recent_summary
        )
    ) INTO activity_summary;
    
    RETURN activity_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 37. Create function to check admin health
CREATE OR REPLACE FUNCTION check_admin_system_health()
RETURNS JSONB AS $$
DECLARE
    health_status JSONB;
BEGIN
    SELECT jsonb_build_object(
        'database_healthy', true,
        'admin_roles_count', (SELECT COUNT(*) FROM admin_roles WHERE is_active = true),
        'pending_invitations', (SELECT COUNT(*) FROM admin_invitations WHERE status = 'pending'),
        'audit_logs_count', (SELECT COUNT(*) FROM admin_audit_logs),
        'last_audit_log', (SELECT MAX(created_at) FROM admin_audit_logs),
        'system_status', 'secure'
    ) INTO health_status;
    
    RETURN health_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 38. Final setup instructions
DO $$
BEGIN
    RAISE NOTICE 'Admin security system setup complete!';
    RAISE NOTICE 'IMPORTANT: Update YOUR_USER_ID_HERE in the script with your actual user ID';
    RAISE NOTICE 'Then run: SELECT grant_admin_access(YOUR_USER_ID_HERE, ''super_admin'');';
    RAISE NOTICE 'This will make you a super admin with full access';
END $$;
