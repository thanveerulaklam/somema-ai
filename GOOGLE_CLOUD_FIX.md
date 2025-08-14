# Google Cloud Console Fix for Quely.ai

## 🚨 Current Issue
Google OAuth is still redirecting to `localhost:3000` even after updating Google Cloud Console.

## 🔧 Missing Redirect URIs

Your current Google Cloud Console configuration is missing some important URLs. Here's what you need to add:

### Step 1: Update Authorized JavaScript Origins

**Current (✅ Correct):**
```
https://www.quely.ai
https://quely.ai
```

**Add these missing ones:**
```
http://localhost:3000
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app
```

**Final list should be:**
```
http://localhost:3000
https://quely.ai
https://www.quely.ai
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app
```

### Step 2: Update Authorized Redirect URIs

**Current (❌ Missing some):**
```
https://quely.ai/auth/callback
https://yfmypikqgegvookjzvyv.supabase.co/auth/v1/callback
https://www.quely.ai/auth/callback
```

**Add these missing ones:**
```
http://localhost:3000/auth/callback
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback
```

**Final list should be:**
```
http://localhost:3000/auth/callback
https://quely.ai/auth/callback
https://www.quely.ai/auth/callback
https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback
https://yfmypikqgegvookjzvyv.supabase.co/auth/v1/callback
```

## 🔍 Why This Happens

The issue is that your app is trying to redirect to `localhost:3000` because:
1. The localhost redirect URI is missing from Google Cloud Console
2. Your app might be using a cached redirect URL
3. The Supabase configuration might still be pointing to localhost

## 🛠️ Additional Steps

### Step 3: Check Supabase Configuration

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **URL Configuration**
3. Update **Site URL** to: `https://quely.ai`
4. Add these **Redirect URLs**:
   ```
   https://quely.ai/auth/callback
   https://www.quely.ai/auth/callback
   https://somema-88nu4s0lj-thanveerulaklams-projects.vercel.app/auth/callback
   ```

### Step 4: Clear Browser Cache

1. **Clear your browser cache** completely
2. **Try in incognito/private mode**
3. **Wait 10-15 minutes** for Google's changes to propagate

### Step 5: Check Your App Code

Make sure your app isn't hardcoded to use localhost. Check these files:
- `app/auth/callback/route.ts`
- `lib/supabase.ts`
- Any hardcoded redirect URLs

## ⏰ Important Notes

- **Wait 10-15 minutes** after making changes
- **Clear browser cache** before testing
- **Test in incognito mode** to avoid cached redirects
- **Check browser console** for any error messages

## 🎯 Expected Result

After adding the missing redirect URIs:
1. Google OAuth should redirect to Google's consent screen
2. After authorization, it should redirect to `https://quely.ai`
3. No more localhost redirects

## 📞 If Still Not Working

1. **Check browser console** for specific error messages
2. **Verify all URLs are exactly as specified** (no typos)
3. **Ensure no local development servers are running**
4. **Try a different browser** to rule out cache issues 