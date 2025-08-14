# Instagram API Setup for Indian Businesses

## Overview

This setup is optimized for Indian businesses that primarily use Instagram for their social media presence. The system now uses Instagram API directly instead of Facebook Graph API for better performance and reliability.

## Key Features

✅ **Instagram-First Design**: Optimized for businesses that focus on Instagram  
✅ **Direct Instagram API**: Uses Instagram API endpoints directly  
✅ **Simplified UI**: Instagram-focused interface  
✅ **Better Error Handling**: Detailed logging for troubleshooting  
✅ **Scheduling Support**: Schedule posts for optimal timing  

## Setup Requirements

### 1. Instagram Business Account
- Convert your Instagram account to a Business account
- Link it to a Facebook Page (required for API access)

### 2. Facebook Developer App
- Create a Facebook Developer account
- Create a new app in Facebook Developer Console
- Add Instagram Basic Display or Instagram Graph API product

### 3. Required Permissions
For Instagram posting, you need these permissions:
- `instagram_content_publish` - Post content to Instagram
- `instagram_basic` - Read basic Instagram account info
- `pages_show_list` - Access Facebook pages

## Environment Variables

Add these to your `.env.local` file:

```env
# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id

# Facebook App Configuration (for OAuth)
META_APP_ID=your_facebook_app_id
META_APP_SECRET=your_facebook_app_secret
```

## Getting Your Instagram Credentials

### Step 1: Facebook Developer Console
1. Go to [Facebook Developer Console](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add "Instagram Basic Display" or "Instagram Graph API" product

### Step 2: Get Access Token
1. Use Facebook Login to get user access token
2. Exchange for Instagram access token
3. Get Instagram Business Account ID

### Step 3: Test Integration
Run the test script to verify everything works:

```bash
node test-instagram-api.js
```

## API Endpoints

### Post to Instagram
```
POST /api/meta/post
{
  "caption": "Your post caption",
  "hashtags": ["hashtag1", "hashtag2"],
  "mediaUrl": "https://example.com/image.jpg",
  "platform": "instagram",
  "selectedPageId": "your_page_id"
}
```

### Get Account Info
```
GET /api/instagram/account
```

### Get Recent Media
```
GET /api/instagram/media?limit=10
```

## Error Handling

The system provides detailed logging for troubleshooting:

- **Token Validation**: Checks if Instagram access token is valid
- **Account Verification**: Ensures Instagram Business Account is connected
- **Media Upload**: Handles image upload and validation
- **Post Publishing**: Manages the two-step posting process

## Common Issues & Solutions

### 1. "No Instagram Business Account Connected"
**Solution**: Link your Instagram account to a Facebook Page

### 2. "Missing instagram_content_publish Permission"
**Solution**: Add the permission to your Facebook app and reconnect

### 3. "Invalid Access Token"
**Solution**: Refresh your Instagram access token

### 4. "Media Upload Failed"
**Solution**: Ensure image URL is publicly accessible

## Testing

Use the provided test script to verify your setup:

```bash
# Set environment variables
export INSTAGRAM_ACCESS_TOKEN="your_token"
export INSTAGRAM_BUSINESS_ACCOUNT_ID="your_account_id"

# Run test
node test-instagram-api.js
```

## Benefits for Indian Businesses

1. **Instagram-Focused**: No need for Facebook page if you only use Instagram
2. **Better Performance**: Direct API calls to Instagram
3. **Simplified Setup**: Less complex than Facebook Graph API
4. **Local Optimization**: Designed for Indian market preferences
5. **Cost Effective**: No additional Facebook page requirements

## Support

For issues with Instagram API integration:
1. Check the detailed logs in your application
2. Verify your Instagram Business Account setup
3. Ensure all required permissions are granted
4. Test with the provided test script

---

**Note**: This setup is specifically optimized for Indian businesses that primarily use Instagram for their social media marketing. 