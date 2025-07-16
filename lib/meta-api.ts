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
        let imageUrl = content.mediaUrl
        if (imageUrl.startsWith('data:image/')) {
          // For now, skip image posting if it's a data URL
          // TODO: Implement image upload to a public URL service
          console.log('Skipping image posting - data URL not supported by Facebook API')
          return {
            success: false,
            error: 'Image posting with data URLs is not supported. Please use a public image URL.'
          }
      }

        // For images, use the photos endpoint
        const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: imageUrl,
            message: this.formatMessage(content.caption, content.hashtags),
            access_token: pageAccessToken
          })
        })

        const mediaData = await mediaResponse.json()
        
        if (mediaData.error) {
          throw new Error(mediaData.error.message)
        }

        return {
          success: true,
          postId: mediaData.id,
          scheduledTime: content.scheduledTime
        }
      } else {
        // For text-only posts, use the feed endpoint
        const response = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/feed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        })

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error.message)
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
      if (!this.instagramBusinessAccountId) {
        throw new Error('Instagram Business Account ID is required')
      }

      const postData: any = {
        caption: this.formatMessage(content.caption, content.hashtags),
        access_token: this.accessToken
      }

      // Add media if provided
      if (content.mediaUrl) {
        postData.media_type = 'IMAGE'
        postData.image_url = content.mediaUrl
      }

      // Schedule post if time is provided
      if (content.scheduledTime) {
        postData.published = false
        postData.scheduled_publish_time = Math.floor(new Date(content.scheduledTime).getTime() / 1000)
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      // If media was created successfully, publish it
      if (data.id) {
        const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media_publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: data.id,
            access_token: this.accessToken
          })
        })

        const publishData = await publishResponse.json()

        if (publishData.error) {
          throw new Error(publishData.error.message)
        }

        return {
          success: true,
          postId: publishData.id,
          scheduledTime: content.scheduledTime
        }
      }

      return {
        success: true,
        postId: data.id,
        scheduledTime: content.scheduledTime
      }
    } catch (error: any) {
      console.error('Instagram posting error:', error)
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