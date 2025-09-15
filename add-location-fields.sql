-- Add location fields to user_profiles table
-- This migration adds city, state, and country columns for business location information

-- Add location columns to user_profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'city') THEN
        ALTER TABLE user_profiles ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'state') THEN
        ALTER TABLE user_profiles ADD COLUMN state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'country') THEN
        ALTER TABLE user_profiles ADD COLUMN country TEXT;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.city IS 'City where the business is located';
COMMENT ON COLUMN user_profiles.state IS 'State/Province where the business is located';
COMMENT ON COLUMN user_profiles.country IS 'Country where the business is located';

-- Show the updated table structure
SELECT 'Location fields added to user_profiles table' as migration_status;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('city', 'state', 'country')
ORDER BY column_name;
