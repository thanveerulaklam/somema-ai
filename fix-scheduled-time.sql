-- Fix Scheduled Time Column Issue
-- Run this in your Supabase SQL editor to fix the 500 error

-- Add scheduled_for column if it doesn't exist (should already exist)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Remove scheduled_time column if it exists (wrong name)
ALTER TABLE posts 
DROP COLUMN IF EXISTS scheduled_time;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for 
ON posts(scheduled_for);

-- Add comment for documentation
COMMENT ON COLUMN posts.scheduled_for IS 'When the post is scheduled to be published';

-- Verify the correct column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name = 'scheduled_for';

-- Show all columns in posts table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position; 