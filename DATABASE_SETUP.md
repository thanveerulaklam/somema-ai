# Database Setup Guide

## Issue
Posts are being saved to localStorage instead of the database because the database schema hasn't been set up yet.

## Solution

### Step 1: Set up your Supabase Database

1. **Go to your Supabase project dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the database schema**
   - Copy the contents of `supabase-schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the schema

### Step 2: Verify the Setup

1. **Check if tables were created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `posts`
     - `media`
     - `user_profiles`

2. **Check the posts table structure**
   - Click on the `posts` table
   - Verify it has these columns:
     - `id` (UUID, Primary Key)
     - `user_id` (UUID, Foreign Key)
     - `caption` (Text)
     - `hashtags` (Text Array)
     - `platform` (Text)
     - `status` (Text)
     - `text_elements` (JSONB)
     - `media_url` (Text)
     - `created_at` (Timestamp)
     - And other columns...

### Step 3: Test the Setup

1. **Create a new post** from the AI generation page
2. **Check if it appears** in the posts listing page
3. **If it works**, posts will be saved to the database permanently

### Alternative: Quick Test

You can test if the database is working by visiting:
```
http://localhost:3004/api/test-db
```

This will show you:
- If you're authenticated
- How many posts exist in the database
- Recent posts data

### Troubleshooting

**If you see "Database schema needs to be updated":**
- Follow Step 1 above to run the schema

**If you see "Database connection issue":**
- Check your Supabase environment variables in `.env.local`
- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

**If posts still don't appear:**
- Check the browser console for error messages
- The posts might be saved to localStorage as a fallback

## Current Status

Until the database is set up, posts will be saved to localStorage and will persist in your browser. Once the database is properly configured, posts will be saved permanently to Supabase. 