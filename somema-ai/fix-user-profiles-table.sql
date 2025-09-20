-- Fix user_profiles table to ensure all required columns exist
-- Run this if you get "column does not exist" errors

-- Add customer_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'customer_type') THEN
        ALTER TABLE user_profiles ADD COLUMN customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business'));
    END IF;
END $$;

-- Add business_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'business_name') THEN
        ALTER TABLE user_profiles ADD COLUMN business_name TEXT;
    END IF;
END $$;

-- Add gst_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'gst_number') THEN
        ALTER TABLE user_profiles ADD COLUMN gst_number TEXT;
    END IF;
END $$;

-- Add business_address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'business_address') THEN
        ALTER TABLE user_profiles ADD COLUMN business_address JSONB;
    END IF;
END $$;

-- Add billing_address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'billing_address') THEN
        ALTER TABLE user_profiles ADD COLUMN billing_address JSONB;
    END IF;
END $$;

-- Add invoice_email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'invoice_email') THEN
        ALTER TABLE user_profiles ADD COLUMN invoice_email TEXT;
    END IF;
END $$;

-- Add auto_invoice column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'auto_invoice') THEN
        ALTER TABLE user_profiles ADD COLUMN auto_invoice BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create the update trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
