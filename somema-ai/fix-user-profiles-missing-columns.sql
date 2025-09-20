-- Fix missing columns in user_profiles table
-- This script adds the missing email and phone columns that are needed for subscription creation

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add UPI AutoPay support columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT DEFAULT 'upi-autopay' CHECK (preferred_payment_method IN ('upi-autopay', 'card', 'one-time'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS upi_mandate_id TEXT;

-- Update existing records to populate email from auth.users
UPDATE user_profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE user_profiles.user_id = auth.users.id 
AND user_profiles.email IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.email IS 'User email address for subscription notifications';
COMMENT ON COLUMN user_profiles.phone IS 'User phone number for UPI AutoPay notifications';
COMMENT ON COLUMN user_profiles.preferred_payment_method IS 'User preferred payment method: upi-autopay, card, or one-time';
COMMENT ON COLUMN user_profiles.upi_mandate_id IS 'Active UPI mandate ID for the user';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('email', 'phone', 'full_name', 'preferred_payment_method', 'upi_mandate_id')
ORDER BY column_name;
