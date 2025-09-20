# Supabase Configuration Fix for Production

## 🚨 Root Cause
Your Supabase project is still configured to redirect to `localhost:3000` instead of your production domain `quely.ai`.

## 🔧 Fix Steps

### Step 1: Update Supabase Site URL

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Select your project** (yfmypikqgegvookjzvyv)
3. **Navigate to**: Authentication → URL Configuration
4. **Update Site URL** to: `https://quely.ai`
5. **Add Redirect URLs**:
   ```
   https://quely.ai/auth/callback
   https://www.quely.ai/auth/callback
   https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### Step 2: Check Google Provider Settings

1. **In Supabase Dashboard**, go to **Authentication** → **Providers**
2. **Find Google** in the list
3. **Click on Google** to edit
4. **Verify Client ID** matches your Google Cloud Console
5. **Verify Client Secret** is correct
6. **Make sure Google provider is enabled**

### Step 3: Update Environment Variables

Check your Vercel environment variables:

```bash
vercel env ls
```

Make sure these are set correctly:
- `NEXT_PUBLIC_SUPABASE_URL=https://yfmypikqgegvookjzvyv.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`
- `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`

### Step 4: Redeploy to Vercel

After updating Supabase settings:

```bash
vercel --prod
```

### Step 5: Test the Fix

1. **Wait 5-10 minutes** for changes to propagate
2. **Clear browser cache**
3. **Visit**: `https://quely.ai`
4. **Try Google sign-in**
5. **Should redirect to**: `https://quely.ai/auth/callback`

## 🔍 Why This Happens

The issue occurs because:
1. **Supabase Site URL** is still set to localhost
2. **Supabase redirect URLs** don't include production URLs
3. **Environment variables** might be pointing to development settings

## 📋 Complete Checklist

- [ ] Updated Supabase Site URL to `https://quely.ai`
- [ ] Added production redirect URLs to Supabase
- [ ] Verified Google provider settings in Supabase
- [ ] Checked Vercel environment variables
- [ ] Redeployed to Vercel
- [ ] Cleared browser cache
- [ ] Tested in incognito mode

## 🎯 Expected Result

After fixing:
1. **Google OAuth** should redirect to Google's consent screen
2. **After authorization**, should redirect to `https://quely.ai/auth/callback`
3. **No more localhost redirects**

## 📞 If Still Not Working

1. **Check Supabase logs** for authentication errors
2. **Verify Google Cloud Console** has all redirect URIs
3. **Test with hardcoded redirect URL** temporarily
4. **Check browser console** for specific error messages

## 🚀 Quick Test

Add this temporary debug code to see what's happening:

```javascript
const handleGoogleLogin = async () => {
  console.log('Current origin:', window.location.origin)
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  setLoading(true)
  setError('')

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      throw error
    }
  } catch (error: any) {
    console.error('Login error:', error)
    setError(error.message)
    setLoading(false)
  }
}
``` 