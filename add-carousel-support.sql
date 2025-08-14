-- Migration to add carousel support to existing posts table
-- Add media_urls column for storing multiple images in carousel posts

-- Add the media_urls column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'media_urls'
    ) THEN
        ALTER TABLE posts ADD COLUMN media_urls JSONB DEFAULT '[]';
    END IF;
END $$;

-- Update existing posts to migrate single media_url to media_urls array
UPDATE posts 
SET media_urls = CASE 
    WHEN media_url IS NOT NULL AND media_url != '' 
    THEN jsonb_build_array(media_url)
    ELSE '[]'::jsonb
END
WHERE media_urls IS NULL OR media_urls = '[]'::jsonb;

-- Create index for better performance on media_urls queries
CREATE INDEX IF NOT EXISTS idx_posts_media_urls ON posts USING GIN (media_urls); 