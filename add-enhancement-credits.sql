-- Add enhancement credits column to users table
-- This ensures the users table has the image_enhancement_credits column

-- First, ensure the users table exists with the correct structure
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    business_name TEXT,
    niche TEXT,
    tone TEXT,
    audience TEXT,
    image_enhancement_credits INTEGER DEFAULT 0,
    post_generation_credits INTEGER DEFAULT 0,
    subscription_plan TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    razorpay_subscription_id TEXT,
    billing_cycle TEXT DEFAULT 'monthly',
    media_storage_limit BIGINT DEFAULT 500000000, -- 500MB in bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the image_enhancement_credits column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS image_enhancement_credits INTEGER DEFAULT 0;

-- Add the post_generation_credits column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS post_generation_credits INTEGER DEFAULT 0;

-- Add subscription-related columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS media_storage_limit BIGINT DEFAULT 500000000;

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can delete their own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_enhancement_credits ON users(image_enhancement_credits);

-- Set default credits for existing users (if they don't have any)
UPDATE users 
SET image_enhancement_credits = 10 
WHERE image_enhancement_credits IS NULL OR image_enhancement_credits = 0;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'image_enhancement_credits';
