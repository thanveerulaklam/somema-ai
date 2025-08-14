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

-- 5. Verify RLS is enabled on both tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'generation_logs')
AND schemaname = 'public';

-- 6. List all policies for these tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'generation_logs')
AND schemaname = 'public'; 