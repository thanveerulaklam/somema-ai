# AI Image Enhancement Credits System

## Overview

The AI Image Enhancement Credits system tracks and limits the number of AI-powered image enhancements a user can perform. This feature integrates with the existing subscription plans and payment system.

## Features

### 1. Credit Tracking
- Each user has `image_enhancement_credits` stored in the `users` table
- Credits are decremented after each successful image enhancement
- Users cannot enhance images when they have 0 credits remaining

### 2. Authentication & Security
- All enhancement requests require user authentication
- Credits are checked before processing any enhancement
- Users can only access their own credit balance

### 3. User Interface
- Dashboard displays current enhancement credits alongside generation count
- Success messages show remaining credits after each enhancement
- Error messages inform users when they're out of credits

## Database Schema

### Users Table
```sql
ALTER TABLE users 
ADD COLUMN image_enhancement_credits INTEGER DEFAULT 0;
```

### Default Credits by Plan
- **Free Plan**: 10 enhancement credits
- **Starter Plan**: 10 enhancement credits  
- **Growth Plan**: 30 enhancement credits
- **Creative Plan**: 50 enhancement credits
- **Pro Plan**: 100 enhancement credits

## API Endpoints

### 1. Enhance Image API
**Endpoint**: `POST /api/enhance-image`

**Authentication**: Required

**Credit Check**: 
- Verifies user has sufficient credits before processing
- Returns 402 status if no credits remaining
- Decrements credits after successful enhancement

**Response**:
```json
{
  "success": true,
  "enhancedImageUrl": "https://...",
  "creditsRemaining": 9
}
```

### 2. User Credits API
**Endpoint**: `GET /api/user/credits`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "credits": {
    "imageEnhancements": 10,
    "postGenerations": 100
  },
  "subscription": "free"
}
```

## Frontend Integration

### Dashboard Display
- Shows enhancement credits in the header alongside generation count
- Orange badge with image icon and credit count
- Updates automatically after each enhancement

### Success Messages
- Monthly/Weekly content generators show success message with remaining credits
- Messages auto-clear after 3 seconds
- Format: "Image enhanced successfully! X enhancement credits remaining."

### Error Handling
- Shows clear error message when user runs out of credits
- Suggests upgrading plan or purchasing more credits
- Prevents enhancement button from working when credits = 0

## Migration

### Running the Migration
1. Execute the SQL migration:
```bash
node run-enhancement-credits-migration.js
```

2. Or run the SQL directly in Supabase:
```sql
-- Run add-enhancement-credits.sql
```

### Verification
- Check that `users` table has `image_enhancement_credits` column
- Verify existing users have default credits (10 for free plan)
- Test enhancement API with authenticated user

## Payment Integration

### Top-up Purchases
- Users can purchase additional enhancement credits
- Available packages: 15, 50, 100 credits
- Credits are added to existing balance

### Subscription Plans
- Each plan includes a set number of enhancement credits
- Credits reset monthly with subscription renewal
- Pro plan includes 100 credits per month

## Error Codes

- **401**: Authentication required
- **402**: No enhancement credits remaining
- **500**: Server error or credit update failure

## Future Enhancements

1. **Credit History**: Track when credits were used
2. **Credit Expiry**: Set expiration dates for purchased credits
3. **Bulk Operations**: Allow multiple enhancements with single credit check
4. **Admin Panel**: Allow admins to adjust user credits
5. **Analytics**: Track enhancement usage patterns
