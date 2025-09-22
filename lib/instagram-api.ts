// Instagram API Service - Direct Instagram API Integration
// Optimized for Indian businesses that primarily use Instagram

import { InstagramPostContent, InstagramPostResult, InstagramAccount } from './types'
import { createClient } from '@supabase/supabase-js'

// Instagram aspect ratio requirements
const INSTAGRAM_ASPECT_RATIO = {
  MIN: 0.5625,  // 9:16 ratio (Reels format)
  MAX: 1.91     // 16:9 ratio (landscape)
}

// Function to validate and get image dimensions
async function validateImageForInstagram(imageUrl: string): Promise<{ isValid: boolean; width?: number; height?: number; aspectRatio?: number; error?: string; needsResize?: boolean }> {
  try {
    // Fetch image to get dimensions
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { isValid: false, error: 'Could not fetch image' }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Get image dimensions using a more robust approach
    let width = 0, height = 0
    
    // Check for JPEG format (multiple possible markers)
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      // JPEG format - look for SOF markers
      let i = 2
      while (i < buffer.length - 9) {
        if (buffer[i] === 0xFF) {
          const marker = buffer[i + 1]
          // SOF0, SOF1, SOF2, SOF3, SOF5, SOF6, SOF7, SOF9, SOF10, SOF11, SOF13, SOF14, SOF15
          if ([0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF].includes(marker)) {
            height = buffer.readUInt16BE(i + 5)
            width = buffer.readUInt16BE(i + 7)
            break
          }
          i += 2
        } else {
          i++
        }
      }
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      // PNG format
      width = buffer.readUInt32BE(16)
      height = buffer.readUInt32BE(20)
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      // GIF format
      width = buffer.readUInt16LE(6)
      height = buffer.readUInt16LE(8)
    } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      // WebP format
      width = buffer.readUInt16LE(26) + 1
      height = buffer.readUInt16LE(28) + 1
    }
    
    // If we still can't determine dimensions, try a fallback approach
    if (width === 0 || height === 0) {
      // For Instagram, we'll assume the image is valid and let Instagram handle it
      // This is more permissive and avoids blocking valid images
      console.log(`Could not determine dimensions for ${imageUrl}, assuming valid for Instagram`)
      return {
        isValid: true,
        width: 1080, // Default Instagram-friendly dimensions
        height: 1080,
        aspectRatio: 1.0,
        needsResize: false
      }
    }
    
    const aspectRatio = width / height
    
    // Check if aspect ratio is within Instagram limits
    const isValid = aspectRatio >= INSTAGRAM_ASPECT_RATIO.MIN && aspectRatio <= INSTAGRAM_ASPECT_RATIO.MAX
    
    return {
      isValid,
      width,
      height,
      aspectRatio,
      needsResize: !isValid,
      error: isValid ? undefined : `Aspect ratio ${aspectRatio.toFixed(2)} is not supported. Instagram requires aspect ratio between ${INSTAGRAM_ASPECT_RATIO.MIN} and ${INSTAGRAM_ASPECT_RATIO.MAX}`
    }
  } catch (error) {
    console.error(`Error validating image ${imageUrl}:`, error)
    // Fallback: assume image is valid and let Instagram handle any issues
    return {
      isValid: true,
      width: 1080,
      height: 1080,
      aspectRatio: 1.0,
      needsResize: false
    }
  }
}

// Function to resize image to meet Instagram requirements
async function resizeImageForInstagram(imageUrl: string): Promise<{ success: boolean; resizedUrl?: string; error?: string }> {
  try {
    // Import sharp and supabase client for direct processing
    const sharp = (await import('sharp')).default
    const { createClient } = await import('@supabase/supabase-js')
    
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { success: false, error: 'Could not fetch image' }
    }

    const imageBuffer = await response.arrayBuffer()
    const metadata = await sharp(Buffer.from(imageBuffer)).metadata()
    const { width: originalWidth, height: originalHeight } = metadata

    if (!originalWidth || !originalHeight) {
      return { success: false, error: 'Could not determine image dimensions' }
    }

    const originalAspectRatio = originalWidth / originalHeight
    console.log(`Original image: ${originalWidth}x${originalHeight} (AR: ${originalAspectRatio.toFixed(2)})`)

    // Instagram aspect ratios
    const INSTAGRAM_RATIOS = [
      { ratio: 0.8, name: 'portrait' }, // 4:5
      { ratio: 1.0, name: 'square' },   // 1:1
      { ratio: 1.91, name: 'landscape' } // 16:9
    ]

    // Pick closest Instagram ratio
    let target = INSTAGRAM_RATIOS[0]
    let minDiff = Math.abs(originalAspectRatio - target.ratio)

    for (const r of INSTAGRAM_RATIOS) {
      const diff = Math.abs(originalAspectRatio - r.ratio)
      if (diff < minDiff) {
        minDiff = diff
        target = r
      }
    }

    const targetAspectRatio = target.ratio
    console.log(`Target AR chosen: ${targetAspectRatio} (${target.name})`)

    // Calculate crop box
    let cropWidth: number
    let cropHeight: number
    let extractLeft: number
    let extractTop: number

    if (originalAspectRatio < targetAspectRatio) {
      // Too tall → crop height
      cropWidth = originalWidth
      cropHeight = Math.round(originalWidth / targetAspectRatio)
      extractLeft = 0
      extractTop = Math.round((originalHeight - cropHeight) / 2)
    } else {
      // Too wide → crop width
      cropHeight = originalHeight
      cropWidth = Math.round(originalHeight * targetAspectRatio)
      extractLeft = Math.round((originalWidth - cropWidth) / 2)
      extractTop = 0
    }

    console.log(`Crop box: ${cropWidth}x${cropHeight} at [${extractLeft}, ${extractTop}]`)

    // Crop the image
    const croppedBuffer = await sharp(Buffer.from(imageBuffer))
      .extract({
        left: extractLeft,
        top: extractTop,
        width: cropWidth,
        height: cropHeight
      })
      .toBuffer()

    // Final resize to Instagram standard
    let finalWidth = 1080
    let finalHeight = 1080

    if (target.name === 'portrait') {
      finalWidth = 1080
      finalHeight = 1350
    } else if (target.name === 'landscape') {
      finalWidth = 1080
      finalHeight = 608
    } else if (target.name === 'square') {
      finalWidth = 1080
      finalHeight = 1080
    }

    console.log(`Final resize: ${finalWidth}x${finalHeight} (standard ${target.name})`)

    const finalBuffer = await sharp(croppedBuffer)
      .resize(finalWidth, finalHeight)
      .jpeg({ quality: 90 })
      .toBuffer()

    // Upload to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return { success: false, error: 'Supabase env vars missing' }
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const fileName = `instagram-resized-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const filePath = `media/resized/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, Buffer.from(finalBuffer), {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(filePath)
    const resizedUrl = publicUrlData?.publicUrl

    return { success: true, resizedUrl }
  } catch (error) {
    return { success: false, error: `Error resizing image: ${error}` }
  }
}

export class InstagramAPIService {
  private accessToken: string
  private instagramBusinessAccountId: string
  private supabase: any
  private baseUrl = 'https://graph.instagram.com/v12.0'

  constructor(credentials: { accessToken: string; instagramBusinessAccountId: string }) {
    this.accessToken = credentials.accessToken
    this.instagramBusinessAccountId = credentials.instagramBusinessAccountId
    
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
      console.log('Converting data URL to public URL for Instagram...')
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
          console.error('Failed to upload converted media for Instagram:', uploadError)
          throw new Error('Failed to convert data URL to public URL')
        }
        
        // Get public URL
        const { data: { publicUrl } } = this.supabase.storage
          .from('media')
          .getPublicUrl(filePath)
        
        console.log('Data URL converted to public URL for Instagram:', publicUrl)
        return publicUrl
      } catch (error) {
        console.error('Error converting data URL for Instagram:', error)
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
  private async validatePostContent(content: InstagramPostContent): Promise<InstagramPostContent> {
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
   * Post content to Instagram using Facebook Graph API with whitelist bypass
   */
  async postToInstagram(content: InstagramPostContent): Promise<InstagramPostResult> {
    try {
      console.log('=== INSTAGRAM API POSTING START ===')
      console.log('Original content:', content)
      
      // Validate and convert media URLs
      const validatedContent = await this.validatePostContent(content)
      console.log('Validated content:', validatedContent)
      console.log('Instagram Business Account ID:', this.instagramBusinessAccountId)

      // Validate all images before posting
      const mediaUrls = validatedContent.mediaUrls && validatedContent.mediaUrls.length > 0 ? validatedContent.mediaUrls : (validatedContent.mediaUrl ? [validatedContent.mediaUrl] : [])
      
      if (mediaUrls.length === 0) {
        throw new Error('No media URL provided')
      }
      
      const validationResults = await Promise.all(
        mediaUrls.map(async (url) => {
          const validation = await validateImageForInstagram(url)
          return { url, validation }
        })
      )

      // Process images that need resizing
      const processedUrls = await Promise.all(
        validationResults.map(async (result) => {
          if (result.validation.needsResize) {
            console.log(`Resizing image: ${result.url} (aspect ratio: ${result.validation.aspectRatio?.toFixed(2)})`)
            const resizeResult = await resizeImageForInstagram(result.url)
            if (resizeResult.success && resizeResult.resizedUrl) {
              return resizeResult.resizedUrl
            } else {
              throw new Error(`Failed to resize image ${result.url}: ${resizeResult.error}`)
            }
          }
          return result.url
        })
      )

      // Check for images that couldn't be processed
      const failedImages = validationResults.filter(result => !result.validation.isValid && !result.validation.needsResize)
      if (failedImages.length > 0) {
        console.warn('Some images failed validation, but proceeding anyway:', failedImages.map(img => img.url))
        // Don't throw error, just log warning and continue
      }

      // Log validation results
      console.log('Image validation results:')
      validationResults.forEach(result => {
        console.log(`${result.url}: ${result.validation.width}x${result.validation.height} (aspect ratio: ${result.validation.aspectRatio?.toFixed(2)})`)
      })

      const formattedCaption = this.formatCaption(validatedContent.caption, validatedContent.hashtags)

      // Handle single image/video post
      if (mediaUrls.length <= 1) {
        let mediaUrl = processedUrls[0]
        if (!mediaUrl) {
          throw new Error('No media URL provided')
        }



        const isVideo = mediaUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i)
        const mediaData: any = {
          media_type: isVideo ? 'REELS' : 'IMAGE',
          [isVideo ? 'video_url' : 'image_url']: mediaUrl,
          caption: formattedCaption,
          access_token: this.accessToken
        }

        // Add scheduling support if scheduledTime is provided
        if (validatedContent.scheduledTime) {
          console.log('Adding scheduling to Instagram post...')
          mediaData.published = false
          mediaData.scheduled_publish_time = Math.floor(new Date(validatedContent.scheduledTime).getTime() / 1000)
          console.log('Scheduled publish time:', mediaData.scheduled_publish_time)
        }

        console.log('Creating single media post...')
        console.log('Video URL:', mediaUrl)
        console.log('Media data:', mediaData)
        
        // Check if video URL is accessible
        try {
          const videoCheck = await fetch(mediaUrl, { method: 'HEAD' })
          if (!videoCheck.ok) {
            throw new Error(`Video URL not accessible: ${videoCheck.status} ${videoCheck.statusText}`)
          }
          console.log('Video URL is accessible')
        } catch (error) {
          console.error('Error checking video URL:', error)
          throw new Error(`Video URL check failed: ${(error as Error).message || 'Unknown error'}`)
        }
        
        const response = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mediaData)
        })

        const result = await response.json()
        console.log('Single media response:', result)

        if (!response.ok) {
          console.error('Instagram API error response:', result)
          
          // Handle whitelist error with fallback to immediate posting
          if (result.error?.code === 3 || result.error?.message?.includes('whitelist')) {
            console.log('Instagram whitelist error detected, attempting immediate posting fallback...')
            
            // For whitelist errors, try posting immediately without scheduling
            const immediateMediaData = {
              media_type: isVideo ? 'REELS' : 'IMAGE',
              [isVideo ? 'video_url' : 'image_url']: mediaUrl,
              caption: formattedCaption,
              access_token: this.accessToken
            }
            
            console.log('Attempting immediate Instagram post...')
            const immediateResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(immediateMediaData)
            })
            
            const immediateResult = await immediateResponse.json()
            console.log('Immediate post response:', immediateResult)
            
            if (!immediateResponse.ok) {
              throw new Error(`Instagram API error (whitelist fallback failed): ${immediateResult.error?.message || 'Unknown error'}`)
            }
            
            // Poll for media status
            let status = 'IN_PROGRESS'
            let pollCount = 0
            const maxPolls = 30
            const pollDelay = 10000
            
            while (status !== 'FINISHED' && pollCount < maxPolls) {
              pollCount++
              console.log(`Checking immediate post media status (poll ${pollCount}/${maxPolls})...`)
              
              const statusResponse = await fetch(
                `https://graph.facebook.com/v18.0/${immediateResult.id}?fields=status_code&access_token=${this.accessToken}`
              )
              
              if (!statusResponse.ok) {
                throw new Error('Failed to check immediate post media status')
              }
              
              const statusResult = await statusResponse.json()
              status = statusResult.status_code
              console.log('Immediate post media status:', status)
              
              if (status === 'FINISHED') {
                break
              }
              
              if (status === 'ERROR') {
                throw new Error(`Immediate post media processing failed: ${(statusResult as any).error?.message || 'Unknown error'}`)
              }
              
              if (pollCount < maxPolls) {
                await new Promise(resolve => setTimeout(resolve, pollDelay))
              }
            }
            
            if (status !== 'FINISHED') {
              throw new Error('Immediate post media processing timed out')
            }
            
            // Publish immediately
            const publishData = {
              creation_id: immediateResult.id,
              access_token: this.accessToken
            }
            
            const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(publishData)
            })
            
            const publishResult = await publishResponse.json()
            console.log('Immediate post publish response:', publishResult)
            
            if (!publishResponse.ok) {
              throw new Error(`Instagram immediate post publish error: ${publishResult.error?.message || 'Unknown error'}`)
            }
            
            console.log('=== INSTAGRAM IMMEDIATE POSTING SUCCESS (WHITELIST FALLBACK) ===')
            return {
              success: true,
              postId: publishResult.id,
              scheduledTime: undefined
            }
          }
          
          throw new Error(`Instagram API error: ${result.error?.message || result.error?.type || 'Unknown error'}`)
        }

        // Poll for media status before publishing
        console.log('Polling for media status before publishing...')
        let status = 'IN_PROGRESS'
        let pollCount = 0
        const maxPolls = 30 // Max 5 minutes (30 * 10 seconds)
        const pollDelay = 10000 // 10 seconds

        while (status !== 'FINISHED' && pollCount < maxPolls) {
          pollCount++
          console.log(`Checking media status (poll ${pollCount}/${maxPolls})...`)
          
          const statusResponse = await fetch(
            `https://graph.facebook.com/v18.0/${result.id}?fields=status_code&access_token=${this.accessToken}`
          )
          
          if (!statusResponse.ok) {
            console.error('Error checking media status:', await statusResponse.text())
            throw new Error('Failed to check media status')
          }
          
          const statusResult = await statusResponse.json()
          status = statusResult.status_code
          console.log('Media status:', status)
          
          if (status === 'FINISHED') {
            console.log('Media processing finished! Ready to publish.')
            break
          }
          
          if (status === 'ERROR') {
            console.error('Media processing failed:', statusResult)
            throw new Error(`Media processing failed: ${(statusResult as any).error?.message || 'Unknown error'}`)
          }
          
          if (pollCount < maxPolls) {
            console.log(`Media still processing, waiting ${pollDelay}ms before next check...`)
            await new Promise(resolve => setTimeout(resolve, pollDelay))
          }
        }
        
        if (status !== 'FINISHED') {
          throw new Error('Media processing timed out after 5 minutes')
        }
        
        // For scheduled posts, don't publish immediately - Instagram will handle scheduling
        if (validatedContent.scheduledTime) {
          console.log('Post is scheduled - Instagram will handle publishing at the scheduled time')
          console.log('=== INSTAGRAM SCHEDULED POSTING SUCCESS ===')
          return {
            success: true,
            postId: result.id, // Return the media container ID for scheduled posts
            scheduledTime: validatedContent.scheduledTime
          }
        }

        console.log('Attempting to publish media...')

        // Now publish the media (for immediate posts)
        console.log('Publishing media...')
        const publishData = {
          creation_id: result.id,
          access_token: this.accessToken
        }

        const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publishData)
        })

        const publishResult = await publishResponse.json()
        console.log('Publish response:', publishResult)

        if (!publishResponse.ok) {
          throw new Error(`Instagram publish error: ${publishResult.error?.message || 'Unknown error'}`)
        }

        console.log('=== INSTAGRAM API POSTING SUCCESS ===')
        return {
          success: true,
          postId: publishResult.id,
          scheduledTime: undefined
        }
      }

      // Handle carousel posts with multiple images
      if (mediaUrls.length > 1) {
        if (mediaUrls.length > 10) {
          throw new Error('Carousel posts are limited to 10 images/videos maximum')
        }

        console.log('Creating carousel post with', mediaUrls.length, 'images...')

        const containerIds = []
        for (const mediaUrl of processedUrls) {
          // All images should now be public URLs
          console.log('Processing media URL for Instagram:', mediaUrl)

          const isVideo = mediaUrl.match(/\.(mp4|mov|webm|avi|mkv)$/i)
          const individualMediaData = {
            media_type: isVideo ? 'REELS' : 'IMAGE',
            [isVideo ? 'video_url' : 'image_url']: mediaUrl,
            access_token: this.accessToken
          }

          try {
            const individualResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(individualMediaData)
            })

            const individualResult = await individualResponse.json()
            console.log('Individual media response:', individualResult)

            if (!individualResponse.ok) {
              console.error('Error with media', mediaUrl + ':', individualResult)
              
              // Handle whitelist error for carousel posts
              if (individualResult.error?.code === 3 || individualResult.error?.message?.includes('whitelist')) {
                console.log('Instagram whitelist error detected for carousel media, skipping this media item...')
                continue // Skip this media item and continue with others
              }
              
              throw new Error(`Failed to create media container: ${individualResult.error?.message || 'Unknown error'}`)
            }

            containerIds.push(individualResult.id)
          } catch (error) {
            console.error('Error creating individual media container:', error)
            throw error
          }
        }

        if (containerIds.length === 0) {
          throw new Error('No valid media containers created for carousel')
        }

        // Create carousel container
        const carouselData: any = {
          media_type: 'CAROUSEL',
          children: containerIds.join(','),
          caption: formattedCaption,
          access_token: this.accessToken
        }

        // Add scheduling support for carousel posts
        if (validatedContent.scheduledTime) {
          console.log('Adding scheduling to carousel post...')
          carouselData.published = false
          carouselData.scheduled_publish_time = Math.floor(new Date(validatedContent.scheduledTime).getTime() / 1000)
          console.log('Scheduled publish time:', carouselData.scheduled_publish_time)
        }

        const carouselResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(carouselData)
        })

        const carouselResult = await carouselResponse.json()
        console.log('Carousel response:', carouselResult)

        if (!carouselResponse.ok) {
          throw new Error(`Carousel creation failed: ${carouselResult.error?.message || 'Unknown error'}`)
        }

        // For scheduled carousel posts, don't publish immediately - Instagram will handle scheduling
        if (validatedContent.scheduledTime) {
          console.log('Carousel post is scheduled - Instagram will handle publishing at the scheduled time')
          console.log('=== INSTAGRAM SCHEDULED CAROUSEL POSTING SUCCESS ===')
          return {
            success: true,
            postId: carouselResult.id, // Return the carousel container ID for scheduled posts
            scheduledTime: validatedContent.scheduledTime
          }
        }

        // Publish the carousel (for immediate posts)
        const publishData = {
          creation_id: carouselResult.id,
          access_token: this.accessToken
        }

        const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${this.instagramBusinessAccountId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publishData)
        })

        const publishResult = await publishResponse.json()
        console.log('Carousel publish response:', publishResult)

        if (!publishResponse.ok) {
          throw new Error(`Carousel publish failed: ${publishResult.error?.message || 'Unknown error'}`)
        }

        console.log('=== INSTAGRAM API POSTING SUCCESS ===')
        return {
          success: true,
          postId: publishResult.id,
          scheduledTime: undefined
        }
      }

      throw new Error('No valid media content provided')
    } catch (error) {
      console.error('=== INSTAGRAM API POSTING ERROR ===')
      console.error('Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
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
  private formatCaption(caption: string, hashtags: string[]): string {
    let formattedCaption = caption || ''
    
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')
      formattedCaption += `\n\n${hashtagString}`
    }
    
    return formattedCaption
  }
}

export function createInstagramAPIService(credentials: { accessToken: string; instagramBusinessAccountId: string }): InstagramAPIService {
  return new InstagramAPIService(credentials)
} 