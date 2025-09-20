-- Fix Meta Credentials Column
-- Run this in your Supabase SQL editor to fix the 500 error

-- Add meta_credentials column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS meta_credentials JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_meta_credentials 
ON user_profiles USING GIN(meta_credentials);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.meta_credentials IS 'Stores Meta API access tokens and connected pages/accounts';

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'meta_credentials';

-- Show all columns in user_profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position; 