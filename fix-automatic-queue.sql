-- Fix Automatic Queue System
-- Run this in your Supabase SQL Editor to ensure scheduled posts are automatically added to queue

-- First, check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_add_post_to_queue';

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_add_post_to_queue ON posts;
DROP FUNCTION IF EXISTS add_post_to_queue();

-- Create the function to automatically add posts to queue
CREATE OR REPLACE FUNCTION add_post_to_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add to queue if status is 'scheduled' and scheduled_for is set
    IF NEW.status = 'scheduled' AND NEW.scheduled_for IS NOT NULL THEN
        INSERT INTO post_queue (post_id, user_id, scheduled_for, priority)
        VALUES (NEW.id, NEW.user_id, NEW.scheduled_for, 0)
        ON CONFLICT (post_id) DO NOTHING; -- Prevent duplicates
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to automatically add posts to queue
CREATE TRIGGER trigger_add_post_to_queue
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION add_post_to_queue();

-- Test the trigger by checking if it exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_add_post_to_queue';

-- Add any existing scheduled posts that are not in the queue
INSERT INTO post_queue (post_id, user_id, scheduled_for, status)
SELECT id, user_id, scheduled_for, 'pending'
FROM posts 
WHERE status = 'scheduled' 
AND scheduled_for IS NOT NULL
AND id NOT IN (SELECT post_id FROM post_queue WHERE post_id IS NOT NULL);

-- Show the result
SELECT 'Trigger created successfully' as status;
