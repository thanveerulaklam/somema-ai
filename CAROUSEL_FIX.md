# Carousel Posts Fix

## Problem
When carousel posts were generated monthly/weekly, only the first image was being posted to Instagram, even though the preview showed all images. The issue was in multiple areas:

1. **Database Schema**: Only had `media_url` field for single images
2. **Generation APIs**: Created carousel data but didn't save it properly
3. **Editor**: Only displayed first image from carousel
4. **Posting Logic**: Only sent first image to Instagram API

## Solution

### 1. Database Schema Update
- Added `media_urls` JSONB field to posts table to store multiple image URLs
- Created migration script: `add-carousel-support.sql`
- Added index for better performance

### 2. Generation APIs Updated
- **Monthly Content API**: Now saves `mediaUrls` array with all selected images
- **Weekly Content API**: Now saves `mediaUrls` array with all selected images
- **Save Scheduled Posts API**: Handles carousel data properly

### 3. Posts Page Updated
- Updated Post interface to include `media_urls?: string[]`
- Enhanced display to show carousel indicator (badge with image count)
- Shows first image with count badge for carousel posts

### 4. Editor Updated
- Updated PostData interface to include `imageUrls?: string[]`
- Enhanced preview to show carousel indicator
- Updated save functionality to handle carousel data
- Updated posting to pass carousel data to API

### 5. Instagram API Enhanced
- Updated InstagramPostContent interface to include `mediaUrls?: string[]`
- Enhanced posting logic to handle carousel posts using `CAROUSEL_ALBUM` media type
- Properly formats carousel data for Instagram API

### 6. Meta API Updated
- Updated PostContent interface to include `mediaUrls?: string[]`
- Enhanced posting to handle carousel data

## Files Modified

### Database
- `supabase-schema.sql` - Added media_urls field
- `add-carousel-support.sql` - Migration script

### APIs
- `app/api/generate-monthly-content/route.ts` - Save carousel data
- `app/api/generate-weekly-content/route.ts` - Save carousel data
- `app/api/save-scheduled-posts/route.ts` - Handle carousel data
- `app/api/meta/post/route.ts` - Pass carousel data to Instagram API

### Components
- `app/posts/page.tsx` - Display carousel posts with indicators
- `app/posts/editor/page.tsx` - Handle carousel editing and posting
- `components/MetaPosting.tsx` - Pass carousel data to API

### Libraries
- `lib/instagram-api.ts` - Handle carousel posting to Instagram
- `lib/meta-api.ts` - Updated interfaces for carousel support

## Migration Steps

1. **Run Database Migration**:
   ```sql
   -- Execute in Supabase SQL Editor
   ALTER TABLE posts ADD COLUMN media_urls JSONB DEFAULT '[]';
   
   UPDATE posts 
   SET media_urls = CASE 
       WHEN media_url IS NOT NULL AND media_url != '' 
       THEN jsonb_build_array(media_url)
       ELSE '[]'::jsonb
   END
   WHERE media_urls IS NULL OR media_urls = '[]'::jsonb;
   
   CREATE INDEX IF NOT EXISTS idx_posts_media_urls ON posts USING GIN (media_urls);
   ```

2. **Deploy Updated Code**: All the API and component changes are ready

3. **Test Carousel Functionality**:
   - Generate monthly/weekly content with multiple images
   - Verify carousel posts show all images in preview
   - Test posting carousel posts to Instagram

## Benefits

- ✅ Carousel posts now display all images in preview
- ✅ Carousel posts post all images to Instagram
- ✅ Backward compatibility with single image posts
- ✅ Enhanced UI with carousel indicators
- ✅ Proper carousel support in editor

## Testing

To test the carousel functionality:

1. Generate monthly/weekly content with multiple images
2. Check that all images are shown in the preview
3. Edit a carousel post and verify all images are displayed
4. Post a carousel post and verify all images are posted to Instagram

The fix ensures that carousel posts work end-to-end from generation through posting. 