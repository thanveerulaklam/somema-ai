-- Add enhanced_image_url column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS enhanced_image_url TEXT;

-- Add index for better performance when querying enhanced images
CREATE INDEX IF NOT EXISTS idx_posts_enhanced_image_url ON posts(enhanced_image_url) WHERE enhanced_image_url IS NOT NULL;

-- Add index for user_id + enhanced_image_url queries
CREATE INDEX IF NOT EXISTS idx_posts_user_enhanced ON posts(user_id, enhanced_image_url) WHERE enhanced_image_url IS NOT NULL;
