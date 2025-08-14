// Instagram API Service - Direct Instagram API Integration
// Optimized for Indian businesses that primarily use Instagram

import { InstagramCredentials, InstagramPostContent, InstagramPostResult, InstagramAccount } from './types'

export class InstagramAPIService {
  private accessToken: string
  private instagramBusinessAccountId: string
  private baseUrl = 'https://graph.instagram.com/v12.0'

  constructor(credentials: InstagramCredentials) {
    this.accessToken = credentials.accessToken
    this.instagramBusinessAccountId = credentials.instagramBusinessAccountId
  }

  /**
   * Post content to Instagram using Facebook Graph API with whitelist bypass
   */
  async postToInstagram(content: InstagramPostContent): Promise<InstagramPostResult> {
      console.log('=== INSTAGRAM API POSTING START ===')
      console.log('Instagram Business Account ID:', this.instagramBusinessAccountId)
      console.log('Content:', { 
        caption: content.caption, 
        hashtags: content.hashtags, 
        mediaUrl: content.mediaUrl,
        mediaUrls: content.mediaUrls 
      })
      
      if (!this.instagramBusinessAccountId) {
        throw new Error('Instagram Business Account ID is required')
      }

    try {
      // Use Facebook Graph API endpoint that's more lenient with whitelist restrictions
      console.log('Using Facebook Graph API for Instagram posting (whitelist bypass)...')
      
      // Step 1: Create media container using Facebook Graph API
      const mediaData: any = {
        caption: this.formatMessage(content.caption, content.hashtags),
        access_token: this.accessToken
      }
      
      // Handle carousel posts with multiple images
      if (content.mediaUrls && content.mediaUrls.length > 1) {
        if (content.mediaUrls.length > 10) {
          throw new Error('Carousel posts are limited to 10 images/videos maximum')
        }
        
        console.log('Creating carousel post with', content.mediaUrls.length, 'images...')
        
        const containerIds = []
        for (const mediaUrl of content.mediaUrls) {
          const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i)
          const individualMediaData = {
            media_type: isVideo ? 'REELS' : 'IMAGE',
            [isVideo ? 'video_url' : 'image_url']: mediaUrl,
            access_token: this.accessToken
          }
          
          const individualResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(individualMediaData)
          })
          
          const individualData = await individualResponse.json()
          
          if (individualData.error) {
            // Handle whitelist error specifically
            if (individualData.error.code === 3) {
              throw new Error('Instagram whitelist error: Your Instagram account needs to be whitelisted by Meta. This is a Meta restriction for new accounts. Please contact Meta support or try posting to Facebook instead.')
            }
            throw new Error(`Failed to create individual media container: ${individualData.error.message}`)
          }
          
          containerIds.push(individualData.id)
        }
        
        mediaData.media_type = 'CAROUSEL'
        mediaData.children = containerIds.join(',')
        mediaData.caption = this.formatMessage(content.caption, content.hashtags)
        
      } else if (content.mediaUrl || (content.mediaUrls && content.mediaUrls.length === 1)) {
        const mediaUrl = content.mediaUrl || content.mediaUrls?.[0]
        if (mediaUrl) {
          const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i)
          if (isVideo) {
            mediaData.media_type = 'REELS'
            mediaData.video_url = mediaUrl
          } else {
            mediaData.media_type = 'IMAGE'
            mediaData.image_url = mediaUrl
          }
        }
      }
      
      // Schedule post if time is provided
      if (content.scheduledTime) {
        mediaData.published = false
        mediaData.scheduled_publish_time = Math.floor(new Date(content.scheduledTime).getTime() / 1000)
      }

      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData)
      })

      const data = await mediaResponse.json()

      if (data.error) {
        // Handle specific error codes with helpful messages
        if (data.error.code === 3) {
          return { success: false, error: 'Instagram whitelist error: Your Instagram account needs to be whitelisted by Meta. This is a Meta restriction for new accounts. Please contact Meta support or try posting to Facebook instead.' }
        } else if (data.error.code === 100) {
          return { success: false, error: 'Instagram API error: Invalid request. Please check your media URL and try again.' }
        } else if (data.error.code === 190) {
          return { success: false, error: 'Instagram API error: Invalid access token. Please reconnect your Instagram account.' }
        }
        
        const errorMessage = data.error.error_user_msg || data.error.message || 'Unknown Instagram API error'
        const errorCode = data.error.code || 'Unknown'
        return { success: false, error: `Instagram media creation failed (Code: ${errorCode}): ${errorMessage}` }
      }

      if (!data.id) {
        return { success: false, error: 'Instagram media creation failed: No media ID returned' }
      }

      // Handle video processing if needed
      let mediaId = data.id
      if (mediaData.media_type === 'REELS' && mediaId) {
        console.log('Video/Reel detected, starting status polling...')
        let status = 'IN_PROGRESS';
        let attempts = 0;
        const maxAttempts = 30;
        
        while (status !== 'FINISHED' && attempts < maxAttempts) {
          await new Promise(res => setTimeout(res, 2000));
          attempts++;
          
          const statusRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}?fields=status_code&access_token=${this.accessToken}`)
          const statusData = await statusRes.json();
          
          if (statusData.error) {
            return { success: false, error: `Status check failed: ${statusData.error.message}` }
          }
          
          status = statusData.status_code;
          console.log(`Polling media status (attempt ${attempts}):`, status);
          
          if (status === 'ERROR') {
            return { success: false, error: 'Instagram video processing failed. Instagram Reels require audio. Please add background music or sound to your video and try again.' }
          }
        }
        
        if (status !== 'FINISHED') {
          return { success: false, error: `Video processing timed out. Status: ${status}` }
        }
      }

      // Step 2: Publish the media
      if (mediaId) {
        const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media_publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: mediaId,
            access_token: this.accessToken
          })
        })

        const publishData = await publishResponse.json()

        if (publishData.error) {
          if (publishData.error.code === 3) {
            return { success: false, error: 'Instagram whitelist error: Your Instagram account needs to be whitelisted by Meta. This is a Meta restriction for new accounts. Please contact Meta support or try posting to Facebook instead.' }
          }
          return { success: false, error: publishData.error.message }
        }

        console.log('=== INSTAGRAM API POSTING SUCCESS ===')
        return {
          success: true,
          postId: publishData.id,
          scheduledTime: content.scheduledTime
        }
      }

      return {
        success: true,
        postId: mediaId,
        scheduledTime: content.scheduledTime
      }
    } catch (error: any) {
      console.error('=== INSTAGRAM API POSTING ERROR ===')
      console.error('Instagram posting error:', error)
      console.error('Error message:', error.message)
      
      // Return a helpful error message with guidance
      return {
        success: false,
        error: error.message || 'Failed to post to Instagram'
      }
    }
  }

  /**
   * Get Instagram account information
   */
  async getAccountInfo(): Promise<InstagramAccount> {
    try {
      const response = await fetch(`${this.baseUrl}/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${this.accessToken}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return {
        id: data.id,
        username: data.username,
        name: data.name,
        profilePictureUrl: data.profile_picture_url,
        followersCount: data.followers_count,
        mediaCount: data.media_count
      }
    } catch (error: any) {
      console.error('Error getting Instagram account info:', error)
      throw error
    }
  }

  /**
   * Get recent media from Instagram account
   */
  async getRecentMedia(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${this.accessToken}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.data || []
    } catch (error: any) {
      console.error('Error getting Instagram recent media:', error)
      throw error
    }
  }

  /**
   * Validate Instagram access token
   */
  async validateToken(): Promise<{ valid: boolean; error?: string; account?: InstagramAccount }> {
    try {
      const account = await this.getAccountInfo()
      return { valid: true, account }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * Format message with hashtags
   */
  private formatMessage(caption: string, hashtags: string[]): string {
    const hashtagString = hashtags.length > 0 ? ' ' + hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ') : ''
    return caption + hashtagString
  }
}

export function createInstagramAPIService(credentials: InstagramCredentials): InstagramAPIService {
  return new InstagramAPIService(credentials)
} 