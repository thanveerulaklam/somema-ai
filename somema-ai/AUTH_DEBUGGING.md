# Authentication Debugging Guide

## Common Issues and Solutions

### 1. "Authentication failed" Error

**Symptoms:**
- User gets redirected to login page with "Authentication failed" error
- Console shows OAuth errors
- Server logs show authentication callback failures

**Solutions:**

#### A. Check Google OAuth Configuration

1. **Verify Supabase Google Provider Settings:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Ensure Google provider is enabled
   - Check that Client ID and Client Secret are correctly entered

2. **Verify Google Cloud Console Settings:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Check that redirect URIs include:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)
     - `https://your-project-ref.supabase.co/auth/v1/callback`

3. **Test OAuth Configuration:**
   ```bash
   node test-google-oauth.js
   ```

#### B. Check Environment Variables

1. **Verify .env.local file exists and contains:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Test environment variables:**
   ```bash
   node test-auth-flow.js
   ```

#### C. Check Next.js 15 Compatibility

1. **Verify cookies() API usage:**
   - All `cookies()` calls should be awaited
   - Server-side Supabase client should use proper cookie handling

2. **Check for hydration errors:**
   - Ensure no `Math.random()` or similar functions in components
   - Use `useId()` hook for generating unique IDs

### 2. Hydration Mismatch Errors

**Symptoms:**
- Console shows hydration mismatch warnings
- Different HTML on server vs client

**Solutions:**

1. **Fix Input Component IDs:**
   - Use `useId()` hook instead of `Math.random()`
   - Ensure consistent ID generation

2. **Check for Dynamic Content:**
   - Avoid `Date.now()`, `Math.random()` in components
   - Use stable values for server/client rendering

### 3. "Invalid redirect URI" Error

**Symptoms:**
- Google OAuth returns "Invalid redirect URI" error
- Authentication fails at Google consent screen

**Solutions:**

1. **Update Google Cloud Console:**
   - Add all required redirect URIs
   - Include both development and production URLs
   - Add Supabase callback URL

2. **Check Supabase Settings:**
   - Verify redirect URL in Supabase Google provider settings
   - Ensure it matches your application URL

### 4. Session Management Issues

**Symptoms:**
- User gets logged out unexpectedly
   - Session tokens not persisting
   - Authentication state inconsistent

**Solutions:**

1. **Check Cookie Settings:**
   - Ensure cookies are being set properly
   - Verify cookie domain and path settings

2. **Test Session Handling:**
   ```bash
   node test-auth-flow.js
   ```

## Step-by-Step Debugging Process

### Step 1: Environment Check
```bash
# Check if environment variables are loaded
node -e "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')"
```

### Step 2: Supabase Connection Test
```bash
# Test basic Supabase connection
node test-auth-flow.js
```

### Step 3: OAuth Configuration Test
```bash
# Test Google OAuth setup
node test-google-oauth.js
```

### Step 4: Development Server Test
```bash
# Start development server
npm run dev

# Check browser console for errors
# Monitor server logs for authentication events
```

### Step 5: Manual OAuth Test
1. Visit `http://localhost:3000`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Check if redirected to dashboard/onboarding

## Common Error Messages and Solutions

### "OAuth provider not configured"
- **Solution:** Enable Google provider in Supabase Dashboard

### "Client ID not found"
- **Solution:** Verify Google OAuth credentials in Supabase

### "redirect_uri_mismatch"
- **Solution:** Update redirect URIs in Google Cloud Console

### "access_denied"
- **Solution:** User denied consent, try again

### "state_mismatch"
- **Solution:** Usually handled automatically, check for browser extensions interfering

## Production Deployment Checklist

1. **Environment Variables:**
   - Set all required environment variables in production
   - Use production Supabase project

2. **Google OAuth:**
   - Update redirect URIs to production domain
   - Verify production OAuth credentials

3. **HTTPS:**
   - Ensure production uses HTTPS
   - Update all URLs to use HTTPS

4. **Domain Configuration:**
   - Update Supabase site URL settings
   - Configure custom domain if needed

## Monitoring and Logs

### Server Logs
Monitor these logs for authentication events:
- OAuth callback requests
- Session creation/destruction
- Database queries for user profiles

### Browser Console
Check for:
- JavaScript errors during OAuth flow
- Network request failures
- Hydration mismatches

### Supabase Dashboard
Monitor:
- Authentication events
- User sessions
- OAuth provider status

## Getting Help

If issues persist:

1. **Check the logs:** Look for specific error messages
2. **Test step by step:** Use the test scripts provided
3. **Verify configuration:** Follow the setup guides
4. **Check documentation:** Review Supabase and Next.js docs
5. **Create minimal reproduction:** Isolate the issue

## Quick Fixes

### Reset OAuth Configuration
1. Disable Google provider in Supabase
2. Re-enable with correct credentials
3. Test OAuth flow

### Clear Browser Data
1. Clear cookies and local storage
2. Try incognito/private browsing
3. Test authentication flow

### Restart Development Server
```bash
# Stop server and restart
npm run dev
```

This debugging guide should help resolve most authentication issues. If problems persist, check the specific error messages and follow the corresponding solutions. 