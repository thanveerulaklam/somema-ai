# Testing Guide - Page Discovery Fix

## Prerequisites

1. **Meta App Setup**
   - Ensure your Meta app is properly configured
   - Verify all required permissions are active
   - Check that your app is in the correct mode (Development/Live)

2. **Environment Variables**
   ```bash
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_REDIRECT_URI=https://your-domain.com/api/meta/oauth
   ```

## Testing Steps

### Step 1: Test Current Permissions

First, let's verify your current permissions work:

```bash
# Get an access token from your app (you'll need to do this manually)
# Then set it as an environment variable
export TEST_ACCESS_TOKEN="your_access_token_here"

# Run the permission test
node test-current-permissions.js
```

**Expected Output:**
```
=== TESTING CURRENT PERMISSIONS ===
1. Testing user info...
✅ User info: John Doe (123456789)

2. Testing pages list...
✅ Pages list: 5 pages found
   1. My Business Page (123456789)
   2. Another Page (987654321)
   ...

3. Testing business manager...
✅ Business manager: 2 businesses found
   1. My Business (111222333)
   2. Another Business (444555666)

4. Testing Instagram accounts for My Business Page...
✅ Instagram accounts for My Business Page:
   - Business Account: 123456789
   - Connected Account: 987654321

5. Testing Meta API Service...
✅ Meta API Service: 5 pages found
   First 3 pages:
   1. My Business Page (123456789)
   2. Another Page (987654321)
   3. Third Page (555666777)
```

### Step 2: Test Page Discovery

```bash
# Run the page discovery test
node test-page-discovery.js
```

**Expected Output:**
```
=== TESTING PAGE DISCOVERY IMPROVEMENTS ===
Testing Facebook pages discovery...
✅ Found 5 Facebook pages

Testing Instagram account discovery...
Testing page: My Business Page (123456789)
✅ Found 2 Instagram accounts
  - mybusiness (123456789)
  - mybusiness_connected (987654321)

Testing page: Another Page (987654321)
✅ Found 1 Instagram accounts
  - anotherpage (555666777)

=== TEST COMPLETE ===
📊 Total pages: 5
📊 Pages with Instagram: 3
```

### Step 3: Manual OAuth Flow Test

1. **Start OAuth Flow**
   - Go to your app's settings page
   - Click "Connect Meta Account"
   - You should be redirected to Facebook OAuth

2. **Check OAuth URL**
   - Verify the OAuth URL includes the correct scope:
   ```
   https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI&scope=pages_manage_posts%2Cpages_read_engagement%2Cpages_show_list%2Cpages_read_user_content%2Cpages_manage_metadata%2Cinstagram_basic%2Cinstagram_content_publish%2Cbusiness_management
   ```

3. **Complete OAuth**
   - Log in with a test account that has multiple pages
   - Grant all requested permissions
   - You should be redirected back to your app

4. **Check Results**
   - Verify all pages are displayed in settings
   - Check that Instagram accounts are shown for each page
   - Use the "Debug Pages" button to see detailed results

### Step 4: Debug Testing

1. **Use Debug Button**
   - In settings, click "Debug Pages"
   - Check the debug output for:
     - All discovery methods working
     - Correct page counts
     - Instagram account discovery

2. **Check Console Logs**
   - Open browser developer tools
   - Look for detailed logging in the console
   - Verify no errors in the OAuth flow

### Step 5: Edge Case Testing

1. **Test with Many Pages**
   - Use an account with >100 pages
   - Verify pagination works correctly
   - Check that all pages are discovered

2. **Test Business Manager**
   - Use an account with Business Manager pages
   - Verify business pages are included
   - Check page access tokens

3. **Test Multiple Instagram Accounts**
   - Use pages with multiple Instagram accounts
   - Verify all accounts are discovered
   - Check both business and connected accounts

## Troubleshooting

### Common Issues

1. **"No pages found"**
   - Check if user has any pages
   - Verify `pages_show_list` permission is granted
   - Check access token validity

2. **"Missing Instagram accounts"**
   - Verify pages have Instagram accounts connected
   - Check `instagram_basic` permission
   - Look for errors in Instagram API calls

3. **"Pagination not working"**
   - Check if user has >100 pages
   - Verify paging.next URLs are being followed
   - Check for API rate limiting

4. **"Business Manager pages missing"**
   - Verify `business_management` permission
   - Check if user has Business Manager access
   - Look for business API errors

### Debug Commands

```bash
# Test specific API endpoints
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN"

# Test business manager
curl "https://graph.facebook.com/v18.0/me/businesses?access_token=YOUR_TOKEN"

# Test Instagram accounts
curl "https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account,connected_instagram_account&access_token=YOUR_TOKEN"
```

## Success Criteria

✅ **All tests pass**
✅ **All pages discovered** (including Business Manager)
✅ **All Instagram accounts found**
✅ **Pagination works** for >100 pages
✅ **Debug output shows** all methods working
✅ **No errors** in console logs
✅ **OAuth flow completes** successfully

## Reporting Issues

If you encounter issues:

1. **Collect Debug Information**
   - Run debug button in settings
   - Copy console logs
   - Note any error messages

2. **Check Permissions**
   - Verify all required permissions are active
   - Check app review status
   - Confirm app mode (Development/Live)

3. **Test with Different Accounts**
   - Try with different user accounts
   - Test with various page configurations
   - Check Business Manager vs regular pages

## Next Steps

After successful testing:

1. **Deploy to Production**
2. **Monitor for Issues**
3. **Collect User Feedback**
4. **Optimize Performance** if needed
