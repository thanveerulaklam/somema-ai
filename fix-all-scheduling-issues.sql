-- Fix All Scheduling Issues
-- Run this in your Supabase SQL editor to fix the 500 error

-- 1. Ensure scheduled_for column exists in posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- 2. Remove any incorrect scheduled_time column if it exists
ALTER TABLE posts 
DROP COLUMN IF EXISTS scheduled_time;

-- 3. Ensure meta_credentials column exists in user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS meta_credentials JSONB DEFAULT '{}';

-- 4. Add missing columns to posts table if they don't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS meta_post_id TEXT,
ADD COLUMN IF NOT EXISTS meta_post_ids JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meta_error TEXT,
ADD COLUMN IF NOT EXISTS meta_errors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posts_meta_post_id ON posts(meta_post_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_meta_credentials ON user_profiles USING GIN(meta_credentials);

-- 6. Add comments for documentation
COMMENT ON COLUMN posts.scheduled_for IS 'When the post is scheduled to be published';
COMMENT ON COLUMN posts.meta_post_id IS 'Meta platform post ID for single platform posts';
COMMENT ON COLUMN posts.meta_post_ids IS 'Meta platform post IDs for multi-platform posts (JSON with facebook/instagram keys)';
COMMENT ON COLUMN posts.meta_error IS 'Error message for failed Meta API calls';
COMMENT ON COLUMN posts.meta_errors IS 'Error messages for failed Meta API calls (JSON with platform-specific errors)';
COMMENT ON COLUMN posts.posted_at IS 'When the post was actually published';
COMMENT ON COLUMN user_profiles.meta_credentials IS 'Stores Meta API access tokens and connected pages/accounts';

-- 7. Verify all columns exist
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('posts', 'user_profiles')
AND column_name IN ('scheduled_for', 'meta_credentials', 'meta_post_id', 'meta_error', 'posted_at')
ORDER BY table_name, column_name;

-- 8. Show all columns in posts table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- 9. Show all columns in user_profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position; 