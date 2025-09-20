# Page Discovery Fix - Comprehensive Solution

## Problem Summary
Users were experiencing missing Facebook pages and Instagram accounts during the OAuth flow. The app would show fewer pages than what was available to the user (e.g., 7 out of 10 pages, or 1 out of 4 pages).

**Additional Issue**: New users (non-developers) don't see the "Businesses" section in OAuth flow, limiting their access to Business Manager pages.

## Root Causes Identified

### 1. **Incomplete OAuth Scope**
- Original scope was too limited
- Missing permissions for business management and comprehensive page access

### 2. **No Pagination Support**
- `/me/accounts` endpoint was called without pagination
- Only first 100 pages were returned (Meta's default limit)

### 3. **Limited Page Discovery Methods**
- Only used `/me/accounts` endpoint
- Didn't check Business Manager pages
- Didn't use alternative discovery methods

### 4. **Incomplete Instagram Account Discovery**
- Only checked `instagram_business_account` field
- Missed `connected_instagram_account` and Instagram edge
- Didn't handle multiple Instagram accounts per page

### 5. **User Type Limitations**
- **Developer accounts**: See "Businesses" section → Full access to Business Manager
- **Regular user accounts**: No "Businesses" section → Limited to direct pages only

## Solutions Implemented

### 1. **Optimized OAuth Scope (Current Permissions)**
```typescript
// Current scope using only active permissions
const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,instagram_basic,instagram_content_publish,business_management'
```

**Current Active Permissions:**
- ✅ `pages_read_engagement` - Advanced access granted
- ✅ `pages_show_list` - Advanced access granted  
- ✅ `pages_manage_posts` - Advanced access granted
- ✅ `instagram_basic` - Advanced access granted
- ✅ `instagram_content_publish` - Advanced access granted
- ✅ `pages_read_user_content` - Standard access active
- ✅ `business_management` - Standard access active
- ✅ `pages_manage_metadata` - Standard access active

**These permissions are sufficient for comprehensive page discovery.**

### 2. **Enhanced Page Discovery for All User Types**

#### 2.1: Multi-Method Discovery System
```typescript
async function fetchAllPagesEnhanced(accessToken: string): Promise<any[]> {
  let allPages: any[] = []
  
  // Method 1: Direct pages from /me/accounts (always works)
  const directPages = await fetchAllPages(accessToken)
  allPages = allPages.concat(directPages)
  
  // Method 2: User accounts edge (alternative way to get pages)
  const userAccounts = await fetchUserAccounts(accessToken)
  allPages = mergeAndDeduplicate(allPages, userAccounts)
  
  // Method 3: Business Manager pages (may not work for regular users)
  const businessPages = await fetchBusinessPages(accessToken)
  allPages = mergeAndDeduplicate(allPages, businessPages)
  
  // Method 4: Instagram-based discovery
  const instagramPages = await discoverPagesViaInstagram(accessToken, allPages)
  allPages = allPages.concat(instagramPages)
  
  return allPages
}
```

#### 2.2: User Type Detection and Guidance
```typescript
// Analyze discovery results for user guidance
const hasBusinessPages = allPages.some(page => page.discovered_via === 'business_manager')
const userType = hasBusinessPages ? 'developer' : 'regular'

if (userType === 'regular' && allPages.length < 5) {
  console.log('ℹ️  Regular user with limited pages - this is normal')
  console.log('ℹ️  Business Manager pages may not be visible to regular users')
}
```

### 3. **Comprehensive Page Discovery with Pagination**

#### Method 1: Direct `/me/accounts` with Pagination
```typescript
async function fetchAllPages(accessToken: string): Promise<any[]> {
  let allPages: any[] = []
  let nextUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,category_list,tasks,access_token&access_token=${accessToken}&limit=100`
  
  while (nextUrl) {
    const response = await fetch(nextUrl)
    const data = await response.json()
    
    if (data.data && Array.isArray(data.data)) {
      allPages = allPages.concat(data.data)
    }
    
    nextUrl = data.paging?.next || null
  }
  
  return allPages
}
```

#### Method 2: Business Manager Pages
```typescript
async function fetchBusinessPages(accessToken: string): Promise<any[]> {
  // Get all business accounts
  const businessesResponse = await fetch(`https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${accessToken}`)
  const businessesData = await businessesResponse.json()
  
  // For each business, get all owned pages with pagination
  for (const business of businessesData.data) {
    let businessPagesUrl = `https://graph.facebook.com/v18.0/${business.id}/owned_pages?fields=id,name,category,category_list,tasks,access_token&access_token=${accessToken}&limit=100`
    
    while (businessPagesUrl) {
      const bizPagesResponse = await fetch(businessPagesUrl)
      const bizPagesData = await bizPagesResponse.json()
      
      if (bizPagesData.data && Array.isArray(bizPagesData.data)) {
        allBusinessPages = allBusinessPages.concat(bizPagesData.data)
      }
      
      businessPagesUrl = bizPagesData.paging?.next || null
    }
  }
}
```

#### Method 3: User Info with Accounts Edge
```typescript
const additionalPagesResponse = await fetch(
  `https://graph.facebook.com/v18.0/me?fields=accounts{id,name,category,category_list,tasks,access_token}&access_token=${accessToken}`
)
```

#### Method 4: Instagram-Based Discovery
```typescript
async function discoverPagesViaInstagram(accessToken: string, existingPages: any[]): Promise<any[]> {
  // For each existing page, check if it has Instagram accounts
  // Use Instagram connections to discover related pages
  // Work backwards from Instagram accounts to find connected pages
}
```

### 4. **Comprehensive Instagram Account Discovery**

#### Method 1: Instagram Business Account
```typescript
if (pageData.instagram_business_account) {
  const instagramDetailsResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageData.instagram_business_account.id}?fields=id,username,name&access_token=${pageAccessToken}`
  )
  const instagramDetails = await instagramDetailsResponse.json()
  instagramAccounts.push(instagramDetails)
}
```

#### Method 2: Connected Instagram Account
```typescript
if (pageData.connected_instagram_account && 
    (!pageData.instagram_business_account || 
     pageData.connected_instagram_account.id !== pageData.instagram_business_account.id)) {
  const connectedInstaResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageData.connected_instagram_account.id}?fields=id,username,name&access_token=${pageAccessToken}`
  )
  const connectedInstaDetails = await connectedInstaResponse.json()
  instagramAccounts.push(connectedInstaDetails)
}
```

#### Method 3: Instagram Edge
```typescript
const instagramEdgeResponse = await fetch(
  `https://graph.facebook.com/v18.0/${pageId}/instagram_accounts?fields=id,username,name&access_token=${pageAccessToken}`
)
const instagramEdgeData = await instagramEdgeResponse.json()

if (!instagramEdgeData.error && instagramEdgeData.data && Array.isArray(instagramEdgeData.data)) {
  for (const insta of instagramEdgeData.data) {
    if (!instagramAccounts.some(acc => acc.id === insta.id)) {
      instagramAccounts.push(insta)
    }
  }
}
```

### 5. **User Experience Improvements**

#### 5.1: User Guidance System
```typescript
// Post-OAuth analysis and guidance
function analyzeOAuthResults(pages: any[], userType: 'developer' | 'regular') {
  const hasBusinessAccess = pages.some(page => page.business_id)
  const missingBusinessPages = !hasBusinessAccess && userType === 'regular'
  
  return {
    discoveredPages: pages.length,
    hasBusinessAccess,
    missingBusinessPages,
    guidance: generateGuidance(userType, hasBusinessAccess)
  }
}
```

#### 5.2: UI Guidance for Regular Users
```typescript
// Show guidance for users with limited page access
{available.length < 5 && (
  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
    <p className="font-medium">Limited Page Access Detected</p>
    <p>You're seeing {available.length} pages. This is normal for regular user accounts. 
    Business Manager pages may not be visible. If you have more pages, consider:</p>
    <ul>
      <li>Connecting your Business Manager account</li>
      <li>Ensuring you're an admin of all your pages</li>
      <li>Checking page permissions in Facebook</li>
    </ul>
  </div>
)}
```

### 6. **Debug and Troubleshooting Tools**

#### Debug Endpoint
Created `/api/meta/debug-pages` endpoint that:
- Tests all page discovery methods
- Shows detailed results for each method
- Tests Instagram account discovery
- Provides comprehensive debugging information

#### Debug Button in UI
Added "Debug Pages" button in settings that:
- Runs comprehensive page discovery tests
- Shows results in user-friendly format
- Helps identify specific issues

## Files Modified

1. **`app/api/meta/oauth/route.ts`**
   - Optimized OAuth scope using current permissions
   - Enhanced page discovery with 4 methods
   - User type detection and guidance
   - Improved Instagram account discovery
   - Better error handling and logging

2. **`lib/meta-api.ts`**
   - Added pagination to `getFacebookPages()`
   - Enhanced `getInstagramAccounts()` with multiple discovery methods
   - Better error handling

3. **`app/api/meta/connect/route.ts`**
   - Improved fallback logic
   - Better error handling for API failures

4. **`app/api/meta/debug-pages/route.ts`**
   - New debug endpoint for troubleshooting
   - Tests all discovery methods
   - Provides detailed diagnostic information

5. **`components/MetaConnection.tsx`**
   - Added debug button
   - Enhanced debug output display
   - User guidance for regular users
   - Better user feedback

## Testing

### Manual Testing
1. Connect a Meta account with multiple pages
2. Verify all pages are discovered
3. Check Instagram accounts for each page
4. Use debug button to verify discovery methods
5. Test with both developer and regular user accounts

### Automated Testing
```bash
# Test current permissions
export TEST_ACCESS_TOKEN="your_token_here"
node test-current-permissions.js

# Test page discovery
node test-page-discovery.js

# Test enhanced discovery
node test-enhanced-discovery.js
```

## Expected Results

After these fixes:
- **All Facebook pages** should be discovered (not just first 100)
- **All Instagram accounts** should be found for each page
- **Business Manager pages** should be included for developers
- **Enhanced discovery** should work for regular users
- **User guidance** should help regular users understand limitations
- **Better error handling** and debugging capabilities
- **Comprehensive logging** for troubleshooting

## User Type Handling

### Developer Accounts
- ✅ Full Business Manager access
- ✅ All pages discoverable
- ✅ Complete Instagram account access
- ✅ Optimal discovery performance

### Regular User Accounts
- ✅ Enhanced discovery methods
- ✅ Maximum possible page discovery
- ✅ Clear guidance about limitations
- ✅ Fallback mechanisms for missing pages
- ✅ User education about Business Manager setup

## Permission Analysis

### ✅ **Sufficient for Page Discovery**
The current permissions are **sufficient** for comprehensive page and Instagram account discovery:

- `pages_show_list` - Lists all pages user manages
- `pages_read_engagement` - Reads page content and metadata
- `business_management` - Accesses Business Manager pages
- `instagram_basic` - Reads Instagram account info
- `instagram_content_publish` - Publishes to Instagram

### 💡 **Optional Additional Permissions**
These are not required for page discovery but may be useful for additional features:

- `pages_manage_instant_articles` - For Instant Articles
- `pages_manage_cta` - For Call-to-Action buttons
- `pages_manage_events` - For Events management
- `pages_manage_offers` - For Offers management

## Monitoring

Monitor the following metrics:
- Number of pages discovered vs expected
- Number of Instagram accounts found
- Success rate of each discovery method
- Error rates and types
- User type distribution (developer vs regular)
- User satisfaction with page discovery

## References

- [Instagram API with Facebook Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/)
- [Facebook Pages API](https://developers.facebook.com/docs/pages-api/)
- [Graph API](https://developers.facebook.com/docs/graph-api/)
- [Meta Developer Documentation](https://developers.facebook.com/docs/)
