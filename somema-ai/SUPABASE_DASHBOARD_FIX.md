# Fix Supabase Dashboard Auth Configuration Error

## 🚨 Current Issue
You're getting "Failed to retrieve auth configuration" and "failed to retrieve GoTrue config" errors in your Supabase dashboard.

## 🔧 Troubleshooting Steps

### Step 1: Clear Browser Cache and Cookies

1. **Clear your browser cache completely**
2. **Clear Supabase-related cookies**
3. **Try in incognito/private mode**
4. **Try a different browser** (Chrome, Firefox, Safari)

### Step 2: Check Project Status

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Check if your project is active** and not paused
3. **Look for any maintenance notices**
4. **Verify project is not in a suspended state**

### Step 3: Alternative Access Methods

#### Method 1: Direct URL Access
Try accessing these URLs directly:
- `https://supabase.com/dashboard/project/yfmypikqgegvookjzvyv/auth/url-configuration`
- `https://supabase.com/dashboard/project/yfmypikqgegvookjzvyv/settings/auth`

#### Method 2: Use Supabase CLI
If dashboard doesn't work, use the CLI:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref yfmypikqgegvookjzvyv

# Check auth settings
supabase auth list
```

### Step 4: Check Project Permissions

1. **Verify you have admin access** to the project
2. **Check if you're the project owner**
3. **Contact your organization admin** if you don't have permissions

### Step 5: Temporary Workaround

If dashboard is completely broken, you can update settings via API:

```bash
# Get your service role key from Vercel env
vercel env ls | grep SUPABASE_SERVICE_ROLE_KEY

# Use curl to update auth settings
curl -X PUT \
  'https://yfmypikqgegvookjzvyv.supabase.co/auth/v1/admin/generate_link' \
  -H 'apikey: YOUR_SERVICE_ROLE_KEY' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "signup",
    "email": "test@example.com",
    "options": {
      "redirect_to": "https://quely.ai/auth/callback"
    }
  }'
```

### Step 6: Contact Supabase Support

If none of the above work:

1. **Go to [Supabase Support](https://supabase.com/support)**
2. **Create a new ticket**
3. **Include your project reference**: `yfmypikqgegvookjzvyv`
4. **Describe the "Failed to retrieve auth configuration" error**

## 🔍 Common Causes

1. **Browser cache/cookies** corrupted
2. **Project temporarily unavailable** due to maintenance
3. **Permission issues** with your account
4. **Supabase service outage** (check [status page](https://status.supabase.com/))

## ⏰ Quick Fixes to Try

### Fix 1: Refresh and Retry
- **Hard refresh** the page (Ctrl+F5 or Cmd+Shift+R)
- **Wait 5 minutes** and try again
- **Try different browsers**

### Fix 2: Check Supabase Status
- Visit [Supabase Status Page](https://status.supabase.com/)
- Check if there are any ongoing issues

### Fix 3: Project Restart
- Go to **Settings** → **General**
- Look for **Restart Project** option
- This can sometimes fix dashboard issues

## 📞 Alternative Solutions

### Option 1: Use Supabase CLI
```bash
# Install and configure Supabase CLI
npm install -g supabase
supabase login
supabase link --project-ref yfmypikqgegvookjzvyv

# Check auth configuration
supabase auth list
```

### Option 2: Direct API Access
Use the Supabase API directly to update settings:

```javascript
// Example: Update auth settings via API
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://yfmypikqgegvookjzvyv.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
)

// Update auth settings
const { data, error } = await supabase.auth.admin.updateUserById(
  'user-id',
  { user_metadata: { site_url: 'https://quely.ai' } }
)
```

## 🎯 Expected Result

After fixing the dashboard issue:
1. **Access Authentication settings** normally
2. **Update Site URL** to `https://quely.ai`
3. **Add redirect URLs** for production
4. **Test Google OAuth** on production

## 📋 Next Steps

1. **Try clearing browser cache** first
2. **Check Supabase status page**
3. **Try different browsers**
4. **Use Supabase CLI** as alternative
5. **Contact Supabase support** if persistent

The dashboard error is likely temporary and should resolve with browser cache clearing or waiting a few minutes. 