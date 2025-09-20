-- Fix existing users with zero post generation credits
-- This migration ensures all existing users on the free plan get their default credits

-- Update existing users in user_profiles table who have zero post generation credits
-- Only update users who are on the free plan and have 0 credits
UPDATE user_profiles 
SET 
    post_generation_credits = 15,
    image_enhancement_credits = 3,
    media_storage_limit = 50,
    updated_at = NOW()
WHERE 
    (post_generation_credits IS NULL OR post_generation_credits = 0)
    AND (subscription_plan = 'free' OR subscription_plan IS NULL)
    AND user_id IS NOT NULL;

-- Also update any users in the auth.users table (legacy users table) if it exists
-- Check if the table exists first
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Update users table if it exists
        UPDATE users 
        SET 
            post_generation_credits = 15,
            image_enhancement_credits = 3,
            updated_at = NOW()
        WHERE 
            (post_generation_credits IS NULL OR post_generation_credits = 0)
            AND (subscription_plan = 'free' OR subscription_plan IS NULL)
            AND id IS NOT NULL;
    END IF;
END $$;

-- Verify the fix
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN post_generation_credits = 0 THEN 1 END) as users_with_zero_credits,
    COUNT(CASE WHEN post_generation_credits = 15 THEN 1 END) as users_with_default_credits
FROM user_profiles
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN post_generation_credits = 0 THEN 1 END) as users_with_zero_credits,
    COUNT(CASE WHEN post_generation_credits = 15 THEN 1 END) as users_with_default_credits
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');
