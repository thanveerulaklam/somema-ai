# User Testing Guide - Enhanced Page Discovery

## Overview

This guide helps you test the enhanced page discovery solution with different types of user accounts to verify it works correctly for both regular users and developers.

## Test Account Types

### 1. **Regular User Account**
- **Characteristics**: Limited Business Manager access
- **Expected OAuth Flow**: No "Businesses" section
- **Expected Results**: Direct pages only, enhanced discovery methods
- **User Guidance**: Should see explanation about limitations

### 2. **Developer Account**
- **Characteristics**: Full Business Manager access
- **Expected OAuth Flow**: "Businesses" section visible
- **Expected Results**: All pages including Business Manager
- **User Guidance**: Full access, no limitations

### 3. **Business Manager Account**
- **Characteristics**: Multiple businesses, many pages
- **Expected OAuth Flow**: "Businesses" section with multiple businesses
- **Expected Results**: All business pages and Instagram accounts
- **User Guidance**: Optimal performance

## Testing Steps

### Step 1: Get Access Tokens

#### Option A: From Your App's OAuth Flow
1. **For Regular User**:
   - Use a regular Facebook account (not a developer account)
   - Go to your app's settings page
   - Click "Connect Meta Account"
   - Complete OAuth flow
   - Copy access token from database/logs

2. **For Developer User**:
   - Use a Facebook developer account
   - Follow same OAuth flow
   - Copy access token

3. **For Business Manager User**:
   - Use an account with Business Manager access
   - Follow same OAuth flow
   - Copy access token

#### Option B: From Graph API Explorer
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Add required permissions:
   ```
   pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,instagram_basic,instagram_content_publish,business_management
   ```
4. Generate access token
5. Copy the token

### Step 2: Run Enhanced Discovery Test

```bash
# Test with Regular User
export TEST_ACCESS_TOKEN="regular_user_token_here"
node test-enhanced-discovery.js

# Test with Developer User
export TEST_ACCESS_TOKEN="developer_user_token_here"
node test-enhanced-discovery.js

# Test with Business Manager User
export TEST_ACCESS_TOKEN="business_manager_token_here"
node test-enhanced-discovery.js
```

### Step 3: Expected Results

#### Regular User Account Results
```
=== TESTING ENHANCED PAGE DISCOVERY ===

1. Testing user info and type detection...
✅ User info: John Doe (123456789)

2. Testing enhanced page discovery...
   Testing direct pages...
   ✅ Direct pages: 3 found
      1. My Personal Page (123456789) - Personal Blog
      2. Small Business (987654321) - Local Business
      3. Hobby Page (555666777) - Entertainment

   Testing Business Manager access...
   ℹ️  Business Manager: Not accessible (normal for regular users)
   ℹ️  Error: (#200) Requires extended permission: business_management

   Testing user accounts edge...
   ✅ User accounts edge: 3 pages found

3. Testing Instagram discovery...
   Testing Instagram for page: My Personal Page
   ✅ Instagram accounts: 1 found
      - Business Account: 123456789

4. Determining user type...
   👤 User type: regular
   📊 Business Manager access: No
   📊 Direct pages: 3

   💡 Regular User Guidance:
   - This is normal for regular user accounts
   - Business Manager pages may not be visible
   - Enhanced discovery will find maximum possible pages
   - Consider Business Manager setup for full access

   ⚠️  Limited Page Access:
   - You have fewer than 5 pages visible
   - This is typical for regular user accounts
   - The enhanced discovery will help find additional pages
```

#### Developer Account Results
```
=== TESTING ENHANCED PAGE DISCOVERY ===

1. Testing user info and type detection...
✅ User info: Developer Name (123456789)

2. Testing enhanced page discovery...
   Testing direct pages...
   ✅ Direct pages: 8 found
      1. Company Page (123456789) - Company
      2. Product Page (987654321) - Product/Service
      3. Marketing Page (555666777) - Brand
      ...

   Testing Business Manager access...
   ✅ Business Manager: 2 businesses found
      1. My Company (111222333)
      2. Client Business (444555666)

   Testing user accounts edge...
   ✅ User accounts edge: 8 pages found

3. Testing Instagram discovery...
   Testing Instagram for page: Company Page
   ✅ Instagram accounts: 2 found
      - Business Account: 123456789
      - Connected Account: 987654321

4. Determining user type...
   👤 User type: developer
   📊 Business Manager access: Yes
   📊 Direct pages: 8

   💡 Developer User:
   - You have full Business Manager access
   - All pages should be discoverable
   - Enhanced discovery will work optimally
```

### Step 4: Manual OAuth Testing

#### Test OAuth Flow for Each User Type

1. **Regular User OAuth Flow**:
   - Should see: "Choose the Pages you want Quely to access"
   - Should NOT see: "Choose the Businesses you want Quely to access"
   - Should see: "Choose the Instagram accounts you want Quely to access"

2. **Developer User OAuth Flow**:
   - Should see: "Choose the Pages you want Quely to access"
   - Should see: "Choose the Businesses you want Quely to access"
   - Should see: "Choose the Instagram accounts you want Quely to access"

3. **Business Manager User OAuth Flow**:
   - Should see multiple businesses in the "Businesses" section
   - Should see all pages from all businesses
   - Should see all Instagram accounts

### Step 5: Settings Page Testing

#### Check User Guidance Display

1. **Regular User with < 5 pages**:
   - Should see yellow warning box
   - Should explain limited access is normal
   - Should provide guidance about Business Manager

2. **Developer User**:
   - Should NOT see warning box
   - Should see all pages normally
   - Should have full functionality

3. **Business Manager User**:
   - Should see all business pages
   - Should have optimal performance
   - Should see comprehensive page list

### Step 6: Debug Button Testing

#### Use Debug Button for Each User Type

1. **Click "Debug Pages"** in settings
2. **Check debug output** for:
   - All discovery methods working
   - Correct page counts
   - User type detection
   - Instagram account discovery

#### Expected Debug Output

**Regular User Debug**:
```
Summary:
- Stored pages: 3
- Connected accounts: 2
- Total methods tested: 4
- Successful methods: 3
- Total pages found: 3

Method Results:
direct_me_accounts: ✅ 3 pages
business_manager: ❌ 0 pages (normal for regular users)
user_accounts_edge: ✅ 3 pages
meta_api_service: ✅ 3 pages
```

**Developer User Debug**:
```
Summary:
- Stored pages: 8
- Connected accounts: 5
- Total methods tested: 4
- Successful methods: 4
- Total pages found: 8

Method Results:
direct_me_accounts: ✅ 8 pages
business_manager: ✅ 2 businesses, 8 pages
user_accounts_edge: ✅ 8 pages
meta_api_service: ✅ 8 pages
```

## Success Criteria

### ✅ **Regular User Success**
- [ ] OAuth flow completes without "Businesses" section
- [ ] All directly managed pages are discovered
- [ ] Enhanced discovery finds maximum possible pages
- [ ] User guidance is displayed appropriately
- [ ] Debug output shows correct limitations

### ✅ **Developer User Success**
- [ ] OAuth flow shows "Businesses" section
- [ ] All pages including Business Manager are discovered
- [ ] Full Instagram account access
- [ ] No user guidance warnings
- [ ] Debug output shows full access

### ✅ **Business Manager User Success**
- [ ] Multiple businesses visible in OAuth
- [ ] All business pages discovered
- [ ] All Instagram accounts found
- [ ] Optimal performance
- [ ] Comprehensive debug output

## Troubleshooting

### Common Issues

1. **"No pages found" for Regular User**:
   - Check if user has any pages
   - Verify page permissions
   - Check access token validity

2. **"Business Manager not accessible"**:
   - This is normal for regular users
   - Enhanced discovery will still work
   - Check user guidance is displayed

3. **"Limited page access" warning**:
   - This is expected for regular users
   - Verify guidance text is helpful
   - Check Business Manager setup instructions

4. **"OAuth flow different than expected"**:
   - Check user account type
   - Verify Meta app permissions
   - Test with different account types

## Reporting Results

When testing, report:

1. **User Type**: Regular/Developer/Business Manager
2. **Pages Discovered**: Number and types
3. **Instagram Accounts**: Number found
4. **User Guidance**: Appropriate for user type
5. **Debug Output**: All methods working
6. **Issues Found**: Any problems encountered

## Next Steps

After successful testing:

1. **Deploy to Production**
2. **Monitor User Feedback**
3. **Track Success Metrics**
4. **Optimize Based on Results**
