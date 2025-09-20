-- Simple Fix for Scheduling Issues
-- This script adds the missing columns without any errors

-- 1. Add scheduled_for column to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- 2. Add meta_credentials column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS meta_credentials JSONB DEFAULT '{}';

-- 3. Add missing columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS meta_post_id TEXT,
ADD COLUMN IF NOT EXISTS meta_post_ids JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meta_error TEXT,
ADD COLUMN IF NOT EXISTS meta_errors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posts_meta_post_id ON posts(meta_post_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_meta_credentials ON user_profiles USING GIN(meta_credentials);

-- 5. Verify the columns were added successfully
SELECT 'Posts table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

SELECT 'User profiles table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 6. Check specifically for the required columns
SELECT 'Required columns check:' as info;
SELECT 
    table_name,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('posts', 'user_profiles')
AND column_name IN ('scheduled_for', 'meta_credentials', 'meta_post_id', 'meta_error', 'posted_at')
ORDER BY table_name, column_name; 