# Fix RLS Security Issues

## Problem
Supabase Security Advisor has identified that Row Level Security (RLS) is disabled on two public tables:
- `public.users`
- `public.generation_logs`

This is a security vulnerability that needs to be addressed.

## Solution

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor (left sidebar)
3. Click on "New query"

### Step 2: Run the Fix Script
Copy and paste the following SQL script into the SQL Editor:

```sql
-- Fix RLS Security Issues
-- This script addresses the Supabase Security Advisor warnings about RLS being disabled

-- 1. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- 3. Enable RLS on generation_logs table
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for generation_logs table
CREATE POLICY "Users can view their own generation logs" ON generation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generation logs" ON generation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation logs" ON generation_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generation logs" ON generation_logs
    FOR DELETE USING (auth.uid() = user_id);
```

### Step 3: Execute the Script
1. Click the "Run" button in the SQL Editor
2. Wait for the script to complete successfully

### Step 4: Verify the Fix
1. Go back to the Security Advisor in your Supabase dashboard
2. Click "Rerun linter" to refresh the analysis
3. The RLS errors should now be resolved

## What This Fix Does

1. **Enables RLS**: Turns on Row Level Security on both tables
2. **Creates Policies**: Establishes security policies that ensure users can only access their own data
3. **Maintains Functionality**: Your app will continue to work as before, but now with proper security

## Security Benefits

- Users can only see and modify their own data
- Prevents unauthorized access to other users' information
- Complies with Supabase security best practices
- Protects sensitive user data

## Testing After Fix

After applying the fix, test your application to ensure:
1. Users can still log in and access their data
2. Generation logs are still being created properly
3. All existing functionality continues to work

If you encounter any issues, the policies can be temporarily disabled or modified as needed. 