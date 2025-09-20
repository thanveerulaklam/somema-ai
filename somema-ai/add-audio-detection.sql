-- Add audio detection support to media table
-- This migration adds audio information to the metadata field for videos

-- Update existing videos to have audio detection metadata
UPDATE media 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"audioDetected": false, "audioChecked": false}'::jsonb
WHERE mime_type LIKE 'video/%';

-- Add a comment to document the audio detection feature
COMMENT ON COLUMN media.metadata IS 'JSON metadata including audio detection info for videos: {"audioDetected": boolean, "audioChecked": boolean}';
