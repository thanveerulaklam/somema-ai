# Debug OAuth Production Issue

## 🚨 Problem Analysis

Your local development works but production fails. This is likely due to:

1. **Environment-specific redirect URLs**
2. **Missing production redirect URIs in Google Cloud Console**
3. **Supabase configuration mismatch**

## 🔍 Root Cause

The issue is in your `redirectTo` URL:

```javascript
redirectTo: `${window.location.origin}/auth/callback`
```

- **Local**: `window.location.origin` = `http://localhost:3000`
- **Production**: `window.location.origin` = `https://quely.ai`

But your Google Cloud Console might not have all the necessary redirect URIs.

## 🛠️ Fix Steps

### Step 1: Verify Google Cloud Console Configuration

**Authorized JavaScript Origins** should include:
```
http://localhost:3000
https://quely.ai
https://www.quely.ai
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app
```

**Authorized Redirect URIs** should include:
```
http://localhost:3000/auth/callback
https://quely.ai/auth/callback
https://www.quely.ai/auth/callback
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback
https://yfmypikqgegvookjzvyv.supabase.co/auth/v1/callback
```

### Step 2: Check Supabase Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL** should be: `https://quely.ai`
3. **Redirect URLs** should include:
   ```
   https://quely.ai/auth/callback
   https://www.quely.ai/auth/callback
   https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback
   ```

### Step 3: Debug Production Environment

Add this temporary debug code to see what's happening:

```javascript
const handleGoogleLogin = async () => {
  console.log('Current origin:', window.location.origin)
  console.log('Redirect URL:', `${window.location.origin}/auth/callback`)
  
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

### Step 4: Check Browser Console

1. Open `https://quely.ai` in production
2. Open browser developer tools (F12)
3. Go to **Console** tab
4. Try Google sign-in
5. Look for error messages

### Step 5: Test with Hardcoded URL

Temporarily test with a hardcoded redirect URL:

```javascript
redirectTo: 'https://quely.ai/auth/callback'
```

## 🎯 Expected Behavior

After fixing:
1. **Local**: Should redirect to `http://localhost:3000/auth/callback`
2. **Production**: Should redirect to `https://quely.ai/auth/callback`
3. **Both**: Should work without errors

## 📞 Common Issues

### Issue 1: "Invalid redirect URI"
- **Solution**: Add the exact redirect URI to Google Cloud Console

### Issue 2: "OAuth provider not configured"
- **Solution**: Check Supabase Google provider settings

### Issue 3: "Client ID not found"
- **Solution**: Verify Client ID in Supabase matches Google Cloud Console

## 🔧 Quick Test

1. **Clear browser cache**
2. **Try in incognito mode**
3. **Wait 10 minutes** after making Google Cloud Console changes
4. **Check browser console** for specific error messages

## 📋 Checklist

- [ ] All redirect URIs added to Google Cloud Console
- [ ] Supabase Site URL set to `https://quely.ai`
- [ ] Supabase redirect URLs include production URLs
- [ ] Browser cache cleared
- [ ] Tested in incognito mode
- [ ] Waited 10+ minutes for changes to propagate 