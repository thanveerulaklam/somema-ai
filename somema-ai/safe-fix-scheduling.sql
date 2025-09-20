-- Safe Fix for Scheduling Issues
-- This script is safer and checks for existing data before making changes

-- 1. First, let's check what columns currently exist
SELECT 'Current posts table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

SELECT 'Current user_profiles table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Check if scheduled_time column exists and has data
SELECT 'Checking for scheduled_time column:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'scheduled_time'
        ) THEN 'scheduled_time column EXISTS'
        ELSE 'scheduled_time column does NOT exist'
    END as scheduled_time_status;

-- 3. If scheduled_time exists, check if it has any data
SELECT 'Checking for data in scheduled_time column:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'scheduled_time'
        ) THEN (
            SELECT COUNT(*)::text || ' rows have scheduled_time data'
            FROM posts 
            WHERE scheduled_time IS NOT NULL
        )
        ELSE 'scheduled_time column does not exist'
    END as scheduled_time_data_count;

-- 4. Check if scheduled_for column exists
SELECT 'Checking for scheduled_for column:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'scheduled_for'
        ) THEN 'scheduled_for column EXISTS'
        ELSE 'scheduled_for column does NOT exist'
    END as scheduled_for_status;

-- 5. Safe operations (only add columns, don't remove anything)
SELECT 'Adding missing columns safely:' as info;

-- Add scheduled_for if it doesn't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Add meta_credentials if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS meta_credentials JSONB DEFAULT '{}';

-- Add other missing columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS meta_post_id TEXT,
ADD COLUMN IF NOT EXISTS meta_post_ids JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meta_error TEXT,
ADD COLUMN IF NOT EXISTS meta_errors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE;

-- 6. Create indexes safely
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posts_meta_post_id ON posts(meta_post_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_meta_credentials ON user_profiles USING GIN(meta_credentials);

-- 7. Final verification
SELECT 'Final verification - all required columns:' as info;
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('posts', 'user_profiles')
AND column_name IN ('scheduled_for', 'meta_credentials', 'meta_post_id', 'meta_error', 'posted_at')
ORDER BY table_name, column_name;

-- 8. If scheduled_time exists and has data, show migration instructions
SELECT 'Migration instructions (if needed):' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'scheduled_time'
        ) AND EXISTS (
            SELECT 1 FROM posts WHERE scheduled_time IS NOT NULL
        ) THEN 'WARNING: scheduled_time column exists with data. You may need to migrate data manually.'
        ELSE 'No data migration needed.'
    END as migration_status; 