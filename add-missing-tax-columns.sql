-- Add Missing Tax Support Columns
-- Run this in your Supabase SQL Editor

-- Add missing columns to payment_orders table
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_export BOOLEAN DEFAULT false;

-- Add missing columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_export BOOLEAN DEFAULT false;

-- Add missing columns to top_ups table
ALTER TABLE top_ups 
ADD COLUMN IF NOT EXISTS tax_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_export BOOLEAN DEFAULT false;

-- Update existing records to set total_amount = amount (no tax for existing records)
UPDATE payment_orders SET total_amount = amount WHERE total_amount = 0;
UPDATE payments SET total_amount = amount WHERE total_amount = 0;
UPDATE top_ups SET total_amount = amount WHERE total_amount = 0;
