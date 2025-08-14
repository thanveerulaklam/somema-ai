# Fixing "Feature unavailable" Error for New Users

## Problem
New users are getting "Feature unavailable" error when trying to connect their Meta accounts, even though the app was approved.

## Root Cause Analysis
Based on our testing, the issue is caused by:

1. **❌ Facebook Login product is missing** from your app
2. **❌ OAuth redirect URIs are not properly configured**
3. **⚠️ App might still be in development mode**

## Solution Steps

### Step 1: Add Facebook Login Product

1. **Go to Facebook Developer Console**
   - Visit: https://developers.facebook.com/apps/
   - Select your app: **Quely**

2. **Add Facebook Login Product**
   - In your app dashboard, click **"Add Product"**
   - Find **"Facebook Login"** and click **"Set Up"**
   - This is **REQUIRED** for OAuth to work

3. **Configure Facebook Login Settings**
   - Go to **Facebook Login > Settings**
   - Add these **Valid OAuth Redirect URIs**:
     ```
     https://www.quely.ai/api/meta/oauth
     http://localhost:3000/api/meta/oauth
     ```
   - Save changes

### Step 2: Check App Mode

1. **Verify App Mode**
   - In your app dashboard, check the **App Mode** section
   - If it shows **"Development"**, you need to switch to **"Live"**
   - Development mode only allows developers and test users

2. **Switch to Live Mode** (if needed)
   - Click **"Switch Mode"** button
   - Confirm the switch to Live mode
   - This allows all users to access your app

### Step 3: Verify Permissions

1. **Check App Review Status**
   - Go to **App Review > Permissions and Features**
   - Ensure all required permissions are **"Approved"**:
     - `pages_manage_posts` ✅
     - `pages_read_engagement` ✅
     - `pages_show_list` ✅
     - `instagram_basic` ✅
     - `instagram_content_publish` ✅

2. **Verify Permission Status**
   - All permissions should show **"Approved"** status
   - If any show "In Review" or "Rejected", contact Meta support

### Step 4: Test the Fix

1. **Clear Browser Cache**
   - Clear all browser cache and cookies
   - Try in incognito/private browsing mode

2. **Test with New User**
   - Try connecting with a different Meta account
   - The OAuth flow should now work without "Feature unavailable"

3. **Verify OAuth Flow**
   - Should redirect to Facebook login
   - Should show permission dialog
   - Should successfully connect accounts

## Expected Results

After completing these steps:

✅ **Facebook Login product** will be available  
✅ **OAuth redirect URIs** will be properly configured  
✅ **App will be in Live mode** (if it wasn't already)  
✅ **New users can connect** without "Feature unavailable" error  

## Troubleshooting

### If "Feature unavailable" persists:

1. **Wait 24-48 hours** after making changes
2. **Check app status** in Facebook Developer Console
3. **Verify all permissions** are approved
4. **Test with different browsers** and devices
5. **Contact Meta support** if issue persists

### Common Issues:

- **App still in development mode** → Switch to Live mode
- **Missing Facebook Login product** → Add the product
- **Incorrect redirect URIs** → Update OAuth redirect URIs
- **Permissions not approved** → Wait for app review completion

## Verification Commands

Run these commands to verify the fix:

```bash
# Test OAuth URL
curl -I "https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=https%3A%2F%2Fwww.quely.ai%2Fapi%2Fmeta%2Foauth&scope=pages_show_list&response_type=code"

# Should return 302 redirect to Facebook login (not "Feature unavailable")
```

## Next Steps

1. **Complete the steps above**
2. **Test with a new user account**
3. **Monitor for any remaining issues**
4. **Update this document** with results

---

**Note**: The "Feature unavailable" error typically indicates that the Facebook Login product is missing or the app is in development mode. Adding the Facebook Login product and ensuring the app is in Live mode should resolve this issue. 