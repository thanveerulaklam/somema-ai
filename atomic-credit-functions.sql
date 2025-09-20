-- Atomic credit operations to prevent race conditions
-- These functions ensure that credit checks and deductions happen atomically

-- Function to atomically deduct post generation credits
CREATE OR REPLACE FUNCTION atomic_deduct_post_credits(
    user_uuid UUID,
    credits_to_deduct INTEGER DEFAULT 1
)
RETURNS TABLE(
    success BOOLEAN,
    new_credits INTEGER,
    current_credits INTEGER,
    error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Lock the user's row to prevent race conditions
    SELECT post_generation_credits INTO current_balance
    FROM user_profiles 
    WHERE user_id = user_uuid
    FOR UPDATE;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if user has sufficient credits
    IF current_balance < credits_to_deduct THEN
        RETURN QUERY SELECT false, current_balance, current_balance, 'Insufficient credits'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance - credits_to_deduct;
    
    -- Update the credits
    UPDATE user_profiles 
    SET 
        post_generation_credits = new_balance,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Return success
    RETURN QUERY SELECT true, new_balance, current_balance, NULL::TEXT;
END;
$$;

-- Function to atomically deduct image enhancement credits
CREATE OR REPLACE FUNCTION atomic_deduct_enhancement_credits(
    user_uuid UUID,
    credits_to_deduct INTEGER DEFAULT 1
)
RETURNS TABLE(
    success BOOLEAN,
    new_credits INTEGER,
    current_credits INTEGER,
    error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Lock the user's row to prevent race conditions
    SELECT image_enhancement_credits INTO current_balance
    FROM user_profiles 
    WHERE user_id = user_uuid
    FOR UPDATE;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if user has sufficient credits
    IF current_balance < credits_to_deduct THEN
        RETURN QUERY SELECT false, current_balance, current_balance, 'Insufficient credits'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance - credits_to_deduct;
    
    -- Update the credits
    UPDATE user_profiles 
    SET 
        image_enhancement_credits = new_balance,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Return success
    RETURN QUERY SELECT true, new_balance, current_balance, NULL::TEXT;
END;
$$;

-- Function to get user admin info with proper security
CREATE OR REPLACE FUNCTION get_user_admin_info(user_uuid UUID)
RETURNS TABLE(
    is_admin BOOLEAN,
    is_active BOOLEAN,
    role TEXT,
    permissions JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user exists in admin_users table
    RETURN QUERY
    SELECT 
        au.is_admin,
        au.is_active,
        au.role,
        au.permissions
    FROM admin_users au
    WHERE au.user_id = user_uuid
    AND au.is_active = true;
    
    -- If no admin record found, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, NULL::TEXT, NULL::JSONB;
    END IF;
END;
$$;

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    role TEXT DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users table
CREATE POLICY "Only service role can access admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_admin ON admin_users(is_admin);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Create trigger to update updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION atomic_deduct_post_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_deduct_enhancement_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_admin_info(UUID) TO authenticated;
