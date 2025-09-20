# Fix Enhancement Credits Issue

## Problem
The image enhancement feature is failing with the error:
```
Could not find the function public.atomic_deduct_enhancement_credits(credits_to_deduct, user_uuid) in the schema cache
```

## Root Cause
The `atomic_deduct_enhancement_credits` database function is missing from the Supabase database, even though it exists in the schema files.

## Solution

### Step 1: Apply the Missing Function to Supabase

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Function to atomically deduct image enhancement credits
CREATE OR REPLACE FUNCTION atomic_deduct_enhancement_credits(
    user_uuid UUID,
    credits_to_deduct INTEGER DEFAULT 1
)
RETURNS TABLE(
    success BOOLEAN,
    new_credits INTEGER,
    current_credits INTEGER,
    error TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Lock the user's row to prevent race conditions
    SELECT image_enhancement_credits INTO current_balance
    FROM user_profiles 
    WHERE user_id = user_uuid
    FOR UPDATE;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 0, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if user has sufficient credits
    IF current_balance < credits_to_deduct THEN
        RETURN QUERY SELECT false, current_balance, current_balance, 'Insufficient credits'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance - credits_to_deduct;
    
    -- Update the credits
    UPDATE user_profiles 
    SET 
        image_enhancement_credits = new_balance,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Return success
    RETURN QUERY SELECT true, new_balance, current_balance, NULL::TEXT;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION atomic_deduct_enhancement_credits(UUID, INTEGER) TO authenticated;
```

### Step 2: Verify the Fix

After applying the SQL, the image enhancement feature should work correctly. The function will:
1. Check if the user has sufficient enhancement credits
2. Atomically deduct the credits to prevent race conditions
3. Return the new credit balance

### Step 3: Test the Feature

1. Go to the posts editor
2. Try to enhance an image
3. The feature should now work without the "Invalid or expired token" error

## Alternative: Quick Fix (Temporary)

If you need a quick temporary fix while applying the SQL, you can modify the `credit-utils.ts` file to use a simpler credit deduction method, but this is not recommended for production as it doesn't prevent race conditions.

## Files Modified
- `somema-ai/app/posts/editor/page.tsx` - Fixed authentication token issue
- `somema-ai/atomic-credit-functions.sql` - Contains the function definition
- `somema-ai/lib/credit-utils.ts` - Uses the function for credit deduction

## Status
- ✅ Authentication issue fixed
- ⏳ Database function needs to be applied
- ⏳ Testing required after SQL application
