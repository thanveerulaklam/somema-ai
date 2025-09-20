# Meta API Integration Guide

This document explains how to set up and use the Meta API integration for posting to Facebook and Instagram from Somema.ai.

## Overview

The Meta API integration allows users to:
- Connect their Facebook and Instagram accounts
- Post content directly to Facebook Pages and Instagram Business accounts
- Schedule posts for future publication
- Post to multiple platforms simultaneously

## Features

### 1. Account Connection
- Connect Facebook accounts and retrieve associated pages
- Automatically detect Instagram Business accounts linked to Facebook pages
- Store access tokens securely in the database
- Validate tokens and handle token expiration

### 2. Content Posting
- Post text content with hashtags
- Attach media (images) to posts
- Support for Facebook Pages and Instagram Business accounts
- Cross-platform posting (Facebook + Instagram simultaneously)

### 3. Scheduling
- Schedule posts for future publication
- Immediate posting option
- Time zone handling

## Setup Instructions

### 1. Create a Meta App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" and select "Business" type
3. Fill in your app details:
   - App Name: `Somema.ai`
   - App Contact Email: Your email
   - Business Account: Select your business account

### 2. Add Facebook Login Product

1. In your app dashboard, click "Add Product"
2. Add "Facebook Login" product
3. Configure OAuth redirect URIs:
   - Add `http://localhost:3000/auth/callback` for development
   - Add your production domain for production

### 3. Configure App Settings

1. Go to Settings > Basic
2. Copy your App ID and App Secret
3. Add these to your `.env.local` file:
   ```env
   META_APP_ID=your_app_id_here
   META_APP_SECRET=your_app_secret_here
   ```

### 4. Set Up Permissions

1. Go to App Review > Permissions and Features
2. Request the following permissions:
   - `pages_manage_posts` - For posting to Facebook Pages
   - `instagram_basic` - For accessing Instagram accounts
   - `instagram_content_publish` - For posting to Instagram

### 5. Generate Access Token

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Request the permissions listed above
4. Generate the access token
5. Copy the token (it will be used in the app)

## Database Schema

The integration adds the following fields to the database:

### user_profiles table
- `meta_credentials` (JSONB): Stores access tokens and connected pages

### posts table
- `meta_post_id` (TEXT): Meta platform post ID for single platform posts
- `meta_post_ids` (JSONB): Meta platform post IDs for multi-platform posts
- `meta_error` (TEXT): Error message for failed Meta API calls
- `meta_errors` (JSONB): Error messages for platform-specific failures

## API Endpoints

### POST /api/meta/connect
Connects a Meta account and retrieves Facebook pages.

**Request Body:**
```json
{
  "accessToken": "your_meta_access_token"
}
```

**Response:**
```json
{
  "success": true,
  "pages": [
    {
      "id": "page_id",
      "name": "Page Name",
      "access_token": "page_access_token",
      "instagram_accounts": [
        {
          "id": "instagram_account_id",
          "username": "instagram_username",
          "name": "Instagram Account Name"
        }
      ]
    }
  ]
}
```

### POST /api/meta/post
Posts content to Meta platforms.

**Request Body:**
```json
{
  "caption": "Your post caption",
  "hashtags": ["tag1", "tag2"],
  "mediaUrl": "https://example.com/image.jpg",
  "scheduledTime": "2024-01-01T12:00:00Z",
  "platform": "both",
  "postId": "optional_post_id"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "facebook": {
      "success": true,
      "postId": "facebook_post_id"
    },
    "instagram": {
      "success": true,
      "postId": "instagram_post_id"
    }
  }
}
```

## Usage in the App

### 1. Connect Meta Account

1. Go to Settings > Social Media Connections
2. Enter your Meta access token
3. Click "Connect Account"
4. The app will retrieve your Facebook pages and Instagram accounts

### 2. Post Content

1. Create or edit a post in the Post Editor
2. Scroll down to the "Post to Meta Platforms" section
3. Select your target platform(s)
4. Choose a Facebook page
5. Optionally schedule the post
6. Click "Post Now" or "Schedule Post"

## Components

### MetaConnection
Located in `src/components/MetaConnection.tsx`
- Handles Meta account connection
- Displays connected pages and Instagram accounts
- Provides token validation

### MetaPosting
Located in `src/components/MetaPosting.tsx`
- Interface for posting content to Meta platforms
- Platform selection (Facebook, Instagram, Both)
- Scheduling functionality
- Post preview

## Service Layer

### MetaAPIService
Located in `src/lib/meta-api.ts`
- Core API integration logic
- Handles Facebook and Instagram posting
- Token validation and management
- Error handling

## Error Handling

The integration includes comprehensive error handling:

1. **Token Validation**: Checks if access tokens are valid
2. **Permission Errors**: Handles missing permissions gracefully
3. **Rate Limiting**: Respects Meta API rate limits
4. **Network Errors**: Retries failed requests
5. **Platform-Specific Errors**: Handles Facebook vs Instagram errors separately

## Security Considerations

1. **Access Tokens**: Stored encrypted in the database
2. **User Authentication**: All API calls require user authentication
3. **Permission Scoping**: Only requests necessary permissions
4. **Token Refresh**: Handles token expiration gracefully

## Troubleshooting

### Common Issues

1. **"Invalid access token"**
   - Token may have expired
   - Regenerate token in Graph API Explorer
   - Check if permissions are still granted

2. **"No Facebook pages found"**
   - User may not have any Facebook pages
   - Check if user is admin of any pages
   - Verify page permissions

3. **"Instagram posting failed"**
   - Instagram account may not be a Business account
   - Check if Instagram account is connected to Facebook page
   - Verify Instagram permissions

4. **"Rate limit exceeded"**
   - Wait before making more requests
   - Implement exponential backoff
   - Check Meta API documentation for limits

### Debug Mode

Enable debug logging by setting:
```env
DEBUG_META_API=true
```

This will log all API requests and responses to the console.

## Future Enhancements

1. **Token Refresh**: Automatic token refresh before expiration
2. **Analytics**: Track post performance and engagement
3. **Content Templates**: Pre-defined post templates
4. **Bulk Posting**: Post to multiple pages simultaneously
5. **Story Support**: Post to Instagram Stories
6. **Video Support**: Upload and post videos

## Support

For issues with the Meta API integration:
1. Check the Meta API documentation
2. Verify your app permissions
3. Test with Graph API Explorer
4. Check the application logs
5. Contact support with error details 