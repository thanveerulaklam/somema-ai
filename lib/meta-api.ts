import { FacebookAdsApi } from 'facebook-nodejs-business-sdk'

export interface MetaCredentials {
  accessToken: string
  pageId?: string
  instagramBusinessAccountId?: string
}

export interface PostContent {
  caption: string
  hashtags: string[]
  mediaUrl?: string
  mediaUrls?: string[]
  scheduledTime?: string
  platform: 'facebook' | 'instagram' | 'both'
}

export interface PostResult {
  success: boolean
  postId?: string
  error?: string
  scheduledTime?: string
}

export class MetaAPIService {
  private accessToken: string
  private pageId?: string
  private instagramBusinessAccountId?: string
  private appId: string
  private appSecret: string

  constructor(credentials: MetaCredentials) {
    this.accessToken = credentials.accessToken
    this.pageId = credentials.pageId
    this.instagramBusinessAccountId = credentials.instagramBusinessAccountId
    this.appId = process.env.META_APP_ID || ''
    this.appSecret = process.env.META_APP_SECRET || ''
    
    // Initialize Facebook Ads API
    FacebookAdsApi.init(this.accessToken)
  }

  /**
   * Post content to Facebook
   */
  async postToFacebook(content: PostContent): Promise<PostResult> {
    try {
      if (!this.pageId) {
        throw new Error('Facebook Page ID is required')
      }

      // Get the page access token for the specific page
      const pageResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${this.accessToken}`)
      const pageData = await pageResponse.json()
      
      if (pageData.error) {
        throw new Error(pageData.error.message)
      }
      
      const selectedPage = pageData.data?.find((page: any) => page.id === this.pageId)
      if (!selectedPage) {
        throw new Error('Selected page not found')
      }
      
      const pageAccessToken = selectedPage.access_token
      
      const postData: any = {
        message: this.formatMessage(content.caption, content.hashtags),
        access_token: pageAccessToken
      }

      // Add media if provided
      if (content.mediaUrl) {
        // Check if it's a data URL and convert to public URL if needed
        let mediaUrl = content.mediaUrl
        if (mediaUrl.startsWith('data:')) {
          // For now, skip media posting if it's a data URL
          console.log('Skipping media posting - data URL not supported by Facebook API')
          return {
            success: false,
            error: 'Media posting with data URLs is not supported. Please use a public media URL.'
          }
        }

        // Determine if it's a video or image based on file extension
        const isVideo = /\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i.test(mediaUrl)
        
        if (isVideo) {
          // For videos, use the videos endpoint
          const payload = {
            file_url: mediaUrl,
            description: this.formatMessage(content.caption, content.hashtags),
            access_token: pageAccessToken
          }
          console.log('Facebook video post payload:', JSON.stringify(payload, null, 2))
          const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/videos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          })

          const mediaData = await mediaResponse.json()
          console.log('Facebook video post response:', JSON.stringify(mediaData, null, 2))
          
          if (mediaData.error) {
            console.error('Facebook video post error:', JSON.stringify(mediaData.error, null, 2))
            throw new Error(JSON.stringify(mediaData.error))
          }

          return {
            success: true,
            postId: mediaData.id,
            scheduledTime: content.scheduledTime
          }
        } else {
        // For images, use the photos endpoint
        const payload = {
            url: mediaUrl,
          message: this.formatMessage(content.caption, content.hashtags),
          access_token: pageAccessToken
        }
        console.log('Facebook photo post payload:', JSON.stringify(payload, null, 2))
        const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })

        const mediaData = await mediaResponse.json()
        console.log('Facebook photo post response:', JSON.stringify(mediaData, null, 2))
        
        if (mediaData.error) {
          console.error('Facebook photo post error:', JSON.stringify(mediaData.error, null, 2))
          throw new Error(JSON.stringify(mediaData.error))
        }

        return {
          success: true,
          postId: mediaData.id,
          scheduledTime: content.scheduledTime
          }
        }
      } else {
        // For text-only posts, use the feed endpoint
        console.log('Facebook feed post payload:', JSON.stringify(postData, null, 2))
        const response = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/feed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        })

        const data = await response.json()
        console.log('Facebook feed post response:', JSON.stringify(data, null, 2))
        
        if (data.error) {
          console.error('Facebook feed post error:', JSON.stringify(data.error, null, 2))
          throw new Error(JSON.stringify(data.error))
        }
      
      return {
        success: true,
          postId: data.id,
        scheduledTime: content.scheduledTime
        }
      }
    } catch (error: any) {
      console.error('Facebook posting error:', error)
      return {
        success: false,
        error: error.message || 'Failed to post to Facebook'
      }
    }
  }

  /**
   * Post content to Instagram
   */
  async postToInstagram(content: PostContent): Promise<PostResult> {
    try {
      console.log('=== INSTAGRAM POSTING START ===')
      console.log('Instagram Business Account ID:', this.instagramBusinessAccountId)
      console.log('Page ID:', this.pageId)
      console.log('Content:', { caption: content.caption, hashtags: content.hashtags, mediaUrl: content.mediaUrl })
      
      if (!this.instagramBusinessAccountId) {
        throw new Error('Instagram Business Account ID is required')
      }

      // Get the page access token for Instagram posting
      console.log('Fetching page access token...')
      const pageResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${this.accessToken}`)
      const pageData = await pageResponse.json()
      
      console.log('Page data response:', JSON.stringify(pageData, null, 2))
      
      if (pageData.error) {
        console.error('Page data error:', pageData.error)
        throw new Error(pageData.error.message)
      }
      
      const selectedPage = pageData.data?.find((page: any) => page.id === this.pageId)
      console.log('Selected page:', selectedPage)
      
      if (!selectedPage) {
        console.error('Selected page not found. Available pages:', pageData.data)
        throw new Error('Selected page not found')
      }
      
      const pageAccessToken = selectedPage.access_token
      console.log('Page access token obtained:', pageAccessToken ? 'YES' : 'NO')

      const postData: any = {
        caption: this.formatMessage(content.caption, content.hashtags),
        access_token: pageAccessToken
      }

      // Add media if provided
      if (content.mediaUrl) {
        console.log('Adding media to post data...')
        postData.media_type = 'IMAGE'
        postData.image_url = content.mediaUrl
      }

      // Schedule post if time is provided
      if (content.scheduledTime) {
        console.log('Adding scheduling to post data...')
        postData.published = false
        postData.scheduled_publish_time = Math.floor(new Date(content.scheduledTime).getTime() / 1000)
      }

      console.log('Final post data:', JSON.stringify(postData, null, 2))
      console.log('Making Instagram media API call to:', `https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`)

      const response = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      })

      console.log('Instagram media API response status:', response.status)
      const data = await response.json()
      console.log('Instagram media API response data:', JSON.stringify(data, null, 2))

      if (data.error) {
        console.error('Instagram media API error:', data.error)
        throw new Error(data.error.message)
      }

      // If media was created successfully, publish it
      if (data.id) {
        console.log('Media created successfully with ID:', data.id)
        console.log('Publishing media...')
        
        const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media_publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: data.id,
            access_token: pageAccessToken
          })
        })

        console.log('Instagram publish API response status:', publishResponse.status)
        const publishData = await publishResponse.json()
        console.log('Instagram publish API response data:', JSON.stringify(publishData, null, 2))

        if (publishData.error) {
          console.error('Instagram publish API error:', publishData.error)
          throw new Error(publishData.error.message)
        }

        console.log('=== INSTAGRAM POSTING SUCCESS ===')
        return {
          success: true,
          postId: publishData.id,
          scheduledTime: content.scheduledTime
        }
      }

      console.log('No media ID returned, treating as text-only post')
      return {
        success: true,
        postId: data.id,
        scheduledTime: content.scheduledTime
      }
    } catch (error: any) {
      console.error('=== INSTAGRAM POSTING ERROR ===')
      console.error('Instagram posting error:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      return {
        success: false,
        error: error.message || 'Failed to post to Instagram'
      }
    }
  }

  /**
   * Post to both Facebook and Instagram
   */
  async postToBoth(content: PostContent): Promise<{ facebook: PostResult; instagram: PostResult }> {
    const [facebookResult, instagramResult] = await Promise.all([
      this.postToFacebook(content),
      this.postToInstagram(content)
    ])

    return {
      facebook: facebookResult,
      instagram: instagramResult
    }
  }

  /**
   * Get user's Facebook pages
   */
  async getFacebookPages(): Promise<Array<{ id: string; name: string; access_token: string }>> {
    try {
      console.log('Fetching Facebook pages with token:', this.accessToken.substring(0, 20) + '...')
      
      const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${this.accessToken}`)
      const data = await response.json()
      
      console.log('Facebook pages API response:', data)
      
      if (data.error) {
        console.error('Facebook pages API error:', data.error)
        throw new Error(data.error.message)
      }

      console.log('Found pages:', data.data?.length || 0)
      return data.data || []
    } catch (error: any) {
      console.error('Error fetching Facebook pages:', error)
      throw error
    }
  }

  /**
   * Get Instagram business accounts for a page
   */
  async getInstagramAccounts(pageId: string): Promise<Array<{ id: string; username: string; name: string }>> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      if (data.instagram_business_account) {
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v18.0/${data.instagram_business_account.id}?fields=id,username,name&access_token=${this.accessToken}`
        )
        const instagramData = await instagramResponse.json()
        
        if (instagramData.error) {
          throw new Error(instagramData.error.message)
        }

        return [instagramData]
      }

      return []
    } catch (error: any) {
      console.error('Error fetching Instagram accounts:', error)
      throw error
    }
  }



  /**
   * Format message with hashtags
   */
  private formatMessage(caption: string, hashtags: string[]): string {
    const hashtagString = hashtags.map(tag => `#${tag}`).join(' ')
    return `${caption}\n\n${hashtagString}`
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${this.accessToken}`)
      const data = await response.json()
      
      if (data.error) {
        return { valid: false, error: data.error.message }
      }

      return { valid: true }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }
}

/**
 * Utility function to create Meta API service instance
 */
export function createMetaAPIService(credentials: MetaCredentials): MetaAPIService {
  return new MetaAPIService(credentials)
} 