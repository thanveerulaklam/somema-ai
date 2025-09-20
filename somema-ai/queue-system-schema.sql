-- Queue System Database Schema
-- Run this in your Supabase SQL editor

-- Create post_queue table for managing post processing queue
CREATE TABLE IF NOT EXISTS post_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create queue_processing_logs table for monitoring
CREATE TABLE IF NOT EXISTS queue_processing_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    queue_id UUID REFERENCES post_queue(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT,
    error_details JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_queue_status ON post_queue(status);
CREATE INDEX IF NOT EXISTS idx_post_queue_scheduled_for ON post_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_post_queue_priority ON post_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_post_queue_user_id ON post_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_logs_queue_id ON queue_processing_logs(queue_id);

-- Create function to automatically add posts to queue when scheduled
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

-- Create trigger to automatically add posts to queue
DROP TRIGGER IF EXISTS trigger_add_post_to_queue ON posts;
CREATE TRIGGER trigger_add_post_to_queue
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION add_post_to_queue();

-- Create function to update queue status
CREATE OR REPLACE FUNCTION update_queue_status(
    queue_id UUID,
    new_status TEXT,
    error_message TEXT DEFAULT NULL,
    processing_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update queue status
    UPDATE post_queue 
    SET 
        status = new_status,
        last_error = error_message,
        updated_at = NOW(),
        processing_started_at = CASE 
            WHEN new_status = 'processing' THEN NOW()
            ELSE processing_started_at
        END,
        completed_at = CASE 
            WHEN new_status IN ('completed', 'failed') THEN NOW()
            ELSE completed_at
        END
    WHERE id = queue_id;
    
    -- Log the status change
    INSERT INTO queue_processing_logs (queue_id, status, message, processing_time_ms)
    VALUES (queue_id, new_status, error_message, processing_time_ms);
END;
$$ LANGUAGE plpgsql;

-- Create function to get next batch of posts to process
CREATE OR REPLACE FUNCTION get_next_posts_to_process(batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
    queue_id UUID,
    post_id UUID,
    user_id UUID,
    scheduled_for TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pq.id as queue_id,
        pq.post_id,
        pq.user_id,
        pq.scheduled_for
    FROM post_queue pq
    WHERE pq.status = 'pending'
        AND pq.scheduled_for <= NOW()
        AND pq.attempts < pq.max_attempts
    ORDER BY pq.priority DESC, pq.scheduled_for ASC
    LIMIT batch_size;
END;
$$ LANGUAGE plpgsql;

-- Create function to retry failed posts
CREATE OR REPLACE FUNCTION retry_failed_posts()
RETURNS INTEGER AS $$
DECLARE
    retry_count INTEGER;
BEGIN
    -- Reset failed posts to pending if they haven't exceeded max attempts
    UPDATE post_queue 
    SET 
        status = 'retrying',
        attempts = attempts + 1,
        updated_at = NOW()
    WHERE status = 'failed' 
        AND attempts < max_attempts
        AND updated_at < NOW() - INTERVAL '5 minutes'; -- Wait 5 minutes before retry
    
    GET DIAGNOSTICS retry_count = ROW_COUNT;
    
    -- Log retry attempts
    INSERT INTO queue_processing_logs (queue_id, status, message)
    SELECT id, 'retrying', 'Post retry attempt ' || (attempts + 1)
    FROM post_queue 
    WHERE status = 'retrying' AND attempts > 0;
    
    RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE post_queue IS 'Queue for managing scheduled post processing';
COMMENT ON TABLE queue_processing_logs IS 'Logs for monitoring queue processing';
COMMENT ON FUNCTION add_post_to_queue() IS 'Automatically adds scheduled posts to processing queue';
COMMENT ON FUNCTION get_next_posts_to_process(INTEGER) IS 'Gets next batch of posts ready for processing';
COMMENT ON FUNCTION retry_failed_posts() IS 'Retries failed posts that havent exceeded max attempts';
