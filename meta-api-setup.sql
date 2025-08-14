-- Add Meta API related fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS meta_credentials JSONB DEFAULT '{}';

-- Add Meta API related fields to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS meta_post_id TEXT,
ADD COLUMN IF NOT EXISTS meta_post_ids JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meta_error TEXT,
ADD COLUMN IF NOT EXISTS meta_errors JSONB DEFAULT '{}';

-- Create indexes for Meta API fields
CREATE INDEX IF NOT EXISTS idx_posts_meta_post_id ON posts(meta_post_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_meta_credentials ON user_profiles USING GIN(meta_credentials);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.meta_credentials IS 'Stores Meta API access tokens and connected pages/accounts';
COMMENT ON COLUMN posts.meta_post_id IS 'Meta platform post ID for single platform posts';
COMMENT ON COLUMN posts.meta_post_ids IS 'Meta platform post IDs for multi-platform posts (JSON with facebook/instagram keys)';
COMMENT ON COLUMN posts.meta_error IS 'Error message for failed Meta API calls';
COMMENT ON COLUMN posts.meta_errors IS 'Error messages for failed Meta API calls (JSON with platform-specific errors)'; 