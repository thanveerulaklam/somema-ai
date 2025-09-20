-- Add UPI AutoPay support to existing payment schema
-- This script adds the necessary fields to track UPI AutoPay mandates and payment methods

-- Add UPI AutoPay fields to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('card', 'upi-autopay', 'one-time'));
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS upi_mandate_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mandate_status TEXT CHECK (mandate_status IN ('created', 'active', 'paused', 'cancelled', 'expired'));

-- Add UPI AutoPay fields to payment_orders table
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('card', 'upi-autopay', 'one-time'));
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS upi_mandate_id TEXT;

-- Add UPI AutoPay fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT DEFAULT 'upi-autopay' CHECK (preferred_payment_method IN ('upi-autopay', 'card', 'one-time'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS upi_mandate_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_method ON subscriptions(payment_method);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mandate_status ON subscriptions(mandate_status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_payment_method ON payment_orders(payment_method);

-- Add comments for documentation
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method used for subscription: card, upi-autopay, or one-time';
COMMENT ON COLUMN subscriptions.upi_mandate_id IS 'Razorpay UPI mandate ID for AutoPay subscriptions';
COMMENT ON COLUMN subscriptions.mandate_status IS 'Status of UPI mandate: created, active, paused, cancelled, expired';
COMMENT ON COLUMN payment_orders.payment_method IS 'Payment method used for order: card, upi-autopay, or one-time';
COMMENT ON COLUMN payment_orders.upi_mandate_id IS 'Razorpay UPI mandate ID for AutoPay orders';
COMMENT ON COLUMN user_profiles.preferred_payment_method IS 'User preferred payment method: upi-autopay, card, or one-time';
COMMENT ON COLUMN user_profiles.upi_mandate_id IS 'Active UPI mandate ID for the user';

-- Update existing records to have default values
UPDATE subscriptions SET payment_method = 'card' WHERE payment_method IS NULL;
UPDATE payment_orders SET payment_method = 'card' WHERE payment_method IS NULL;
UPDATE user_profiles SET preferred_payment_method = 'upi-autopay' WHERE preferred_payment_method IS NULL;
