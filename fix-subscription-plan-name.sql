-- Fix subscription plan name in user_profiles table
-- Replace the Razorpay subscription ID with the actual plan name

-- First, let's see what's currently in the database
SELECT user_id, subscription_plan, subscription_status, razorpay_subscription_id 
FROM user_profiles 
WHERE subscription_plan LIKE 'RHnaHoJhMPX4n5%' OR razorpay_subscription_id = 'RHnaHoJhMPX4n5';

-- Update the subscription_plan to 'starter' (most likely plan based on the pattern)
UPDATE user_profiles 
SET subscription_plan = 'starter'
WHERE razorpay_subscription_id = 'RHnaHoJhMPX4n5' 
   OR subscription_plan = 'RHnaHoJhMPX4n5';

-- Verify the update
SELECT user_id, subscription_plan, subscription_status, razorpay_subscription_id 
FROM user_profiles 
WHERE razorpay_subscription_id = 'RHnaHoJhMPX4n5';
