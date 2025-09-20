-- =====================================================
-- CONSOLIDATED DATABASE SCHEMA FOR SOMEMA.AI
-- =====================================================
-- This file consolidates all database migrations and schema changes
-- Run this file to set up the complete database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    caption TEXT,
    hashtags TEXT[],
    platform TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    media_url TEXT,
    media_urls JSONB DEFAULT '[]', -- Array of image URLs for carousel posts
    text_elements JSONB DEFAULT '{}',
    text_styles JSONB DEFAULT '{}',
    business_context TEXT,
    theme TEXT,
    content_type TEXT,
    custom_prompt TEXT,
    engagement_data JSONB DEFAULT '{}',
    page_id TEXT, -- Facebook page ID
    meta_post_id TEXT, -- Meta post ID
    meta_post_ids JSONB DEFAULT '{}', -- For multiple platforms
    meta_error TEXT, -- Error message if posting failed
    meta_errors JSONB DEFAULT '{}', -- For multiple platforms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    business_name TEXT,
    business_type TEXT,
    industry TEXT,
    brand_tone TEXT,
    target_audience TEXT,
    social_links JSONB DEFAULT '{}',
    notifications JSONB DEFAULT '{}',
    -- Subscription fields
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'growth', 'scale')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'paused', 'expired')),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    -- Credit fields
    post_generation_credits INTEGER DEFAULT 15,
    image_enhancement_credits INTEGER DEFAULT 3,
    media_storage_limit BIGINT DEFAULT 50, -- 50 images
    -- Meta/Facebook integration
    meta_credentials JSONB DEFAULT '{}',
    -- Location fields
    city TEXT,
    state TEXT,
    country TEXT,
    -- Additional fields
    niche TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generation_logs table
CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('single', 'weekly', 'monthly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAYMENT TABLES
-- =====================================================

-- Create payment_orders table
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'cancelled')),
    payment_id TEXT,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one-time')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id TEXT UNIQUE NOT NULL,
    order_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    tax_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'failed', 'refunded')),
    payment_method TEXT,
    payment_type TEXT DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'topup')),
    payment_data JSONB DEFAULT '{}',
    tax_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_subscription_id TEXT UNIQUE,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused', 'expired')),
    current_start_date TIMESTAMP WITH TIME ZONE,
    current_end_date TIMESTAMP WITH TIME ZONE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create top_ups table
CREATE TABLE IF NOT EXISTS top_ups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    top_up_type TEXT NOT NULL,
    credits_added INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADMIN TABLES
-- =====================================================

-- Create admin_users table
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Media table indexes
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);

-- Payment table indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_top_ups_user_id ON top_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_top_ups_status ON top_ups(status);

-- Admin table indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_admin ON admin_users(is_admin);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Media table policies
CREATE POLICY "Users can view their own media" ON media
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON media
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON media
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media
    FOR DELETE USING (auth.uid() = user_id);

-- Posts table policies
CREATE POLICY "Users can view their own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- User profiles table policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Generation logs table policies
CREATE POLICY "Users can view their own generation logs" ON generation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generation logs" ON generation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment table policies
CREATE POLICY "Users can view their own payment orders" ON payment_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment orders" ON payment_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment orders" ON payment_orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own top ups" ON top_ups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own top ups" ON top_ups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own top ups" ON top_ups
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin users table policies (service role only)
CREATE POLICY "Only service role can access admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ATOMIC CREDIT FUNCTIONS
-- =====================================================

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

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION atomic_deduct_post_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_deduct_enhancement_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_admin_info(UUID) TO authenticated;

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert a sample admin user (replace with actual user ID)
-- INSERT INTO admin_users (user_id, is_admin, is_active, role) 
-- VALUES ('your-admin-user-id-here', true, true, 'super_admin')
-- ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Database schema setup completed successfully!';
    RAISE NOTICE 'All tables, indexes, policies, and functions have been created.';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '1. Set up your admin user in the admin_users table';
    RAISE NOTICE '2. Configure your environment variables';
    RAISE NOTICE '3. Test the application thoroughly';
END $$;
