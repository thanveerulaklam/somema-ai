# Production Google OAuth Fix Guide

## 🚨 Current Issue
Google OAuth is redirecting to `localhost:3000` instead of your production domain `quely.ai`.

## 🔧 Complete Fix Steps

### Step 1: Find Your Supabase Project Reference
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (e.g., `https://ytsdf...........supabase.co`)

### Step 2: Update Google Cloud Console

#### 2.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID for Somema
4. Click on it to edit

#### 2.2 Update Authorized JavaScript Origins
Add these URLs:
```
http://localhost:3000
https://quely.ai
https://www.quely.ai
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app
```

#### 2.3 Update Authorized Redirect URIs
Add these URLs (replace `your-project-ref` with your actual Supabase project reference):
```
http://localhost:3000/auth/callback
https://quely.ai/auth/callback
https://www.quely.ai/auth/callback
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback
https://ytsdf...........supabase.co/auth/v1/callback
```

### Step 3: Update Supabase Configuration

#### 3.1 Update Site URL
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Update **Site URL** to: `https://quely.ai`
4. Add **Redirect URLs**:
   - `https://quely.ai/auth/callback`
   - `https://www.quely.ai/auth/callback`
   - `https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback`

### Step 4: Update OAuth Consent Screen

#### 4.1 Go to OAuth Consent Screen
1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Update **App name** to: `Quely.ai` or `Somema.ai`
3. Update **App domain** to: `quely.ai`
4. Add **Authorized domains**: `quely.ai`

### Step 5: Test the Configuration

#### 5.1 Wait for Changes
- Google's changes can take 5-10 minutes to propagate
- Supabase changes are usually immediate

#### 5.2 Test Google Sign-in
1. Visit: `https://quely.ai`
2. Click "Sign in with Google"
3. Should redirect to Google's consent screen
4. After authorization, should redirect back to `quely.ai`

### Step 6: Troubleshooting

#### 6.1 If Still Redirecting to Localhost
- Check that you've added ALL the redirect URIs listed above
- Make sure you saved the changes in Google Cloud Console
- Wait 10-15 minutes for changes to propagate

#### 6.2 If Getting "Invalid Redirect URI" Error
- Double-check the exact URLs in Google Cloud Console
- Ensure no trailing slashes or typos
- Verify Supabase redirect URLs match exactly

#### 6.3 If Getting "OAuth provider not configured"
- Check that Google provider is enabled in Supabase
- Verify Client ID and Secret are correct in Supabase

### Step 7: Verify Environment Variables

Your Vercel environment variables are already configured correctly:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Step 8: Final Checklist

- [ ] Updated Google Cloud Console JavaScript origins
- [ ] Updated Google Cloud Console redirect URIs
- [ ] Updated Supabase Site URL
- [ ] Updated Supabase redirect URLs
- [ ] Updated OAuth consent screen app name
- [ ] Waited 10 minutes for changes to propagate
- [ ] Tested Google sign-in on production

## 🎉 Expected Result

After completing these steps, Google OAuth should:
1. Redirect to Google's consent screen
2. Show "Sign in to Quely.ai" (not the Supabase domain)
3. Redirect back to `https://quely.ai` after successful authentication
4. Work seamlessly in production

## 📞 Need Help?

If you're still having issues after following these steps:
1. Check the browser console for specific error messages
2. Verify all URLs are exactly as specified
3. Ensure no local development servers are running
4. Clear browser cache and try again 