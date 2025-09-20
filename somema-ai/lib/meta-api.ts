import { FacebookAdsApi } from 'facebook-nodejs-business-sdk'
import { createClient } from '@supabase/supabase-js'

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
  skipped?: boolean
}

export class MetaAPIService {
  private accessToken: string
  private pageId?: string
  private instagramBusinessAccountId?: string
  private appId: string
  private appSecret: string
  private supabase: any

  constructor(credentials: MetaCredentials) {
    this.accessToken = credentials.accessToken
    this.pageId = credentials.pageId
    this.instagramBusinessAccountId = credentials.instagramBusinessAccountId
    this.appId = process.env.META_APP_ID || ''
    this.appSecret = process.env.META_APP_SECRET || ''
    
    // Initialize Facebook Ads API
    FacebookAdsApi.init(this.accessToken)
    
    // Initialize Supabase client for media uploads
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Validate and convert data URLs to public URLs
   */
  private async validateAndConvertMediaUrl(mediaUrl: string): Promise<string> {
    if (!mediaUrl) return mediaUrl
    
    // If it's already a public URL, return as is
    if (mediaUrl.startsWith('http') && !mediaUrl.startsWith('data:')) {
      return mediaUrl
    }
    
    // If it's a data URL, convert to public URL
    if (mediaUrl.startsWith('data:')) {
      console.log('Converting data URL to public URL...')
      try {
        // Convert data URL to blob
        const response = await fetch(mediaUrl)
        const blob = await response.blob()
        
        // Upload to Supabase storage
        const fileExt = blob.type.includes('video') ? 'mp4' : 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `media/converted/${fileName}`
        
        const { error: uploadError } = await this.supabase.storage
          .from('media')
          .upload(filePath, blob)
        
        if (uploadError) {
          console.error('Failed to upload converted media:', uploadError)
          throw new Error('Failed to convert data URL to public URL')
        }
        
        // Get public URL
        const { data: { publicUrl } } = this.supabase.storage
          .from('media')
          .getPublicUrl(filePath)
        
        console.log('Data URL converted to public URL:', publicUrl)
        return publicUrl
      } catch (error) {
        console.error('Error converting data URL:', error)
        throw new Error('Failed to convert data URL to public URL')
      }
    }
    
    // If it's a blob URL, this should not happen in server-side code
    if (mediaUrl.startsWith('blob:')) {
      throw new Error('Blob URLs are not supported in server-side posting. Please use public URLs.')
    }
    
    return mediaUrl
  }

  /**
   * Validate and convert all media URLs in post content
   */
  private async validatePostContent(content: PostContent): Promise<PostContent> {
    const validatedContent = { ...content }
    
    // Validate single media URL
    if (content.mediaUrl) {
      validatedContent.mediaUrl = await this.validateAndConvertMediaUrl(content.mediaUrl)
    }
    
    // Validate media URLs array
    if (content.mediaUrls && content.mediaUrls.length > 0) {
      const validatedUrls = []
      for (const url of content.mediaUrls) {
        const validatedUrl = await this.validateAndConvertMediaUrl(url)
        validatedUrls.push(validatedUrl)
      }
      validatedContent.mediaUrls = validatedUrls
    }
    
    return validatedContent
  }

  /**
   * Post content to Facebook
   */
  async postToFacebook(content: PostContent): Promise<PostResult> {
    try {
      if (!this.pageId) {
        throw new Error('Facebook Page ID is required')
      }

      // Validate and convert media URLs
      const validatedContent = await this.validatePostContent(content)
      console.log('Validated Facebook post content:', validatedContent)

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
        message: this.formatMessage(validatedContent.caption, validatedContent.hashtags),
        access_token: pageAccessToken
      }

      // Add media if provided
      if (validatedContent.mediaUrls && validatedContent.mediaUrls.length > 1) {
        // Facebook carousel: create multiple media first, then publish with attached_media
        const createdMediaIds: string[] = []
        for (const url of validatedContent.mediaUrls) {
          const isVideo = /\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i.test(url)
          if (isVideo) {
            const payload = {
              file_url: url,
              description: this.formatMessage(validatedContent.caption, validatedContent.hashtags),
              access_token: pageAccessToken
            }
            const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/videos`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            })
            const mediaData = await mediaResponse.json()
            if (mediaData.error) throw new Error(JSON.stringify(mediaData.error))
            createdMediaIds.push(mediaData.id)
          } else {
            const payload = {
              url,
              published: false,
              access_token: pageAccessToken
            }
            const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/photos`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            })
            const mediaData = await mediaResponse.json()
            if (mediaData.error) throw new Error(JSON.stringify(mediaData.error))
            createdMediaIds.push(mediaData.id)
          }
        }

        if (createdMediaIds.length === 0) {
          throw new Error('No valid media created for Facebook carousel')
        }

        const attached_media = createdMediaIds.map(id => ({ media_fbid: id }))
        const carouselPayload: any = {
          message: this.formatMessage(content.caption, content.hashtags),
          attached_media,
          access_token: pageAccessToken
        }
        const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${this.pageId}/feed`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(carouselPayload)
        })
        const carouselData = await carouselResponse.json()
        if (carouselData.error) throw new Error(JSON.stringify(carouselData.error))
        return { success: true, postId: carouselData.id, scheduledTime: validatedContent.scheduledTime }
      } else if (validatedContent.mediaUrl) {
        // Media URL has already been validated and converted
        let mediaUrl = validatedContent.mediaUrl

        // Determine if it's a video or image based on file extension
        const isVideo = /\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i.test(mediaUrl)
        
        if (isVideo) {
          // Check file size for Facebook API limits (typically 25MB for videos)
          try {
            const response = await fetch(mediaUrl, { method: 'HEAD' })
            const contentLength = response.headers.get('content-length')
            if (contentLength && parseInt(contentLength) > 25 * 1024 * 1024) { // 25MB limit
              console.warn(`Video file too large for Facebook API (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB), skipping Facebook post`)
              return {
                success: false,
                error: 'Video file too large for Facebook API (Instagram post successful)',
                skipped: true
              }
            }
          } catch (sizeCheckError) {
            console.warn('Could not check video file size, proceeding with Facebook post attempt')
          }

          // For videos, use the videos endpoint
          const payload = {
            file_url: mediaUrl,
            description: this.formatMessage(validatedContent.caption, validatedContent.hashtags),
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
            
            // Handle specific Facebook API errors gracefully
            if (mediaData.error.code === 1 && mediaData.error.message.includes('reduce the amount of data')) {
              console.warn('Facebook video file too large, skipping Facebook post but keeping Instagram post')
              return {
                success: false,
                error: 'Video file too large for Facebook API (Instagram post successful)',
                skipped: true
              }
            }
            
            throw new Error(JSON.stringify(mediaData.error))
          }

          return {
            success: true,
            postId: mediaData.id,
            scheduledTime: validatedContent.scheduledTime
          }
        } else {
        // For images, use the photos endpoint
        const payload = {
            url: mediaUrl,
          message: this.formatMessage(validatedContent.caption, validatedContent.hashtags),
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
          scheduledTime: validatedContent.scheduledTime
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
   * Get user's Facebook pages with comprehensive pagination
   */
  async getFacebookPages(): Promise<Array<{ id: string; name: string; access_token: string }>> {
    try {
      console.log('Fetching Facebook pages with token:', this.accessToken.substring(0, 20) + '...')
      
      let allPages: Array<{ id: string; name: string; access_token: string }> = []
      let nextUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${this.accessToken}&limit=100`
      
      while (nextUrl) {
        console.log('Fetching pages from:', nextUrl)
        const response = await fetch(nextUrl)
        const data = await response.json()
        
        console.log('Facebook pages API response:', data)
        
        if (data.error) {
          console.error('Facebook pages API error:', data.error)
          throw new Error(data.error.message)
        }

        if (data.data && Array.isArray(data.data)) {
          allPages = allPages.concat(data.data)
          console.log(`✅ Fetched ${data.data.length} pages in this batch`)
        }
        
        // Check for next page
        nextUrl = data.paging?.next || null
      }

      console.log(`📊 Total Facebook pages found: ${allPages.length}`)
      return allPages
    } catch (error: any) {
      console.error('Error fetching Facebook pages:', error)
      throw error
    }
  }

  /**
   * Get Instagram business accounts for a page with comprehensive discovery
   */
  async getInstagramAccounts(pageId: string): Promise<Array<{ id: string; username: string; name: string }>> {
    try {
      const instagramAccounts: Array<{ id: string; username: string; name: string }> = []
      
      // Method 1: Check for Instagram Business Account
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account,connected_instagram_account&access_token=${this.accessToken}`
      )
      const pageData = await pageResponse.json()
      
      console.log(`Instagram data for page ${pageId}:`, pageData)
      
      if (pageData.error) {
        console.error(`Error getting page data for ${pageId}:`, pageData.error)
        return []
      }

      // Check for Instagram Business Account
      if (pageData.instagram_business_account) {
        console.log(`✅ Found Instagram Business Account for page ${pageId}`)
        const instagramDetailsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageData.instagram_business_account.id}?fields=id,username,name&access_token=${this.accessToken}`
        )
        const instagramDetails = await instagramDetailsResponse.json()
        
        if (!instagramDetails.error) {
          instagramAccounts.push(instagramDetails)
          console.log(`✅ Added Instagram Business: ${instagramDetails.username} (${instagramDetails.id})`)
        } else {
          console.log(`❌ Error getting Instagram business details:`, instagramDetails.error)
        }
      }
      
      // Method 2: Check for Connected Instagram Account (non-business) only if different from business account
      if (pageData.connected_instagram_account && 
          (!pageData.instagram_business_account || 
           pageData.connected_instagram_account.id !== pageData.instagram_business_account.id)) {
        console.log(`✅ Found Connected Instagram Account for page ${pageId}`)
        const connectedInstaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageData.connected_instagram_account.id}?fields=id,username,name&access_token=${this.accessToken}`
        )
        const connectedInstaDetails = await connectedInstaResponse.json()
        
        if (!connectedInstaDetails.error) {
          instagramAccounts.push(connectedInstaDetails)
          console.log(`✅ Added Connected Instagram: ${connectedInstaDetails.username} (${connectedInstaDetails.id})`)
        } else {
          console.log(`❌ Error getting connected Instagram details:`, connectedInstaDetails.error)
        }
      }
      
      // Method 3: Check for Instagram accounts through the page's Instagram edge
      try {
        const instagramEdgeResponse = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/instagram_accounts?fields=id,username,name&access_token=${this.accessToken}`
        )
        const instagramEdgeData = await instagramEdgeResponse.json()
        
        if (!instagramEdgeData.error && instagramEdgeData.data && Array.isArray(instagramEdgeData.data)) {
          console.log(`✅ Found ${instagramEdgeData.data.length} Instagram accounts through edge for page ${pageId}`)
          for (const insta of instagramEdgeData.data) {
            // Check if this account is not already added
            if (!instagramAccounts.some(acc => acc.id === insta.id)) {
              instagramAccounts.push(insta)
              console.log(`✅ Added Instagram via edge: ${insta.username} (${insta.id})`)
            }
          }
        }
      } catch (edgeError) {
        console.log(`ℹ️  Instagram edge not available for page ${pageId}:`, edgeError)
      }
      
      console.log(`📊 Total Instagram accounts for page ${pageId}: ${instagramAccounts.length}`)
      return instagramAccounts
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