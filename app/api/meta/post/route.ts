import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaAPIService, PostContent } from '../../../../lib/meta-api'
import { createInstagramAPIService } from '../../../../lib/instagram-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { caption, hashtags, mediaUrl, mediaUrls, scheduledTime, platform, postId, selectedPageId } = requestData
    
    console.log('Meta post API received data:', requestData)
    console.log('Media URLs:', mediaUrls)
    console.log('Single media URL:', mediaUrl)
    console.log('Platform:', platform)
    console.log('Selected Page ID:', selectedPageId)

    // Validate required fields
    if (!caption || !platform || !selectedPageId) {
      return NextResponse.json(
        { error: 'Missing required fields: caption, platform, and selectedPageId' },
        { status: 400 }
      )
    }

    // Get user from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract user ID from auth header
    const userId = authHeader.replace('Bearer ', '')
    console.log('Extracted userId from auth header:', userId)

    // Get user's Meta credentials from database
    console.log('Looking for user profile with userId:', userId)
    
    // First, check if user profile exists
    const { data: allProfiles, error: listError } = await supabase
      .from('user_profiles')
      .select('user_id, meta_credentials')
      .limit(10)
    
    console.log('All user profiles:', allProfiles)
    console.log('List error:', listError)
    
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('meta_credentials')
      .eq('user_id', userId)
      .single()

    console.log('Profile query result:', { userProfile, profileError })

    if (profileError) {
      console.error('Profile query error:', profileError)
      return NextResponse.json(
        { error: `Database error: ${profileError.message}` },
        { status: 400 }
      )
    }

    if (!userProfile?.meta_credentials) {
      console.log('No meta_credentials found in user profile')
      return NextResponse.json(
        { error: 'Meta credentials not found. Please connect your Meta account first.' },
        { status: 400 }
      )
    }

    const credentials = userProfile.meta_credentials
    console.log('Full credentials structure:', JSON.stringify(credentials, null, 2))
    
    // Find the selected page and its Instagram account
    const selectedPage = credentials.pages?.find((page: any) => page.id === selectedPageId)
    if (!selectedPage) {
      console.log('Available pages:', credentials.pages)
      return NextResponse.json(
        { error: 'Selected page not found in user credentials' },
        { status: 400 }
      )
    }
    
    console.log('Selected page structure:', JSON.stringify(selectedPage, null, 2))
    
    // Try different ways to get Instagram account ID
    let instagramAccountId = selectedPage.instagram_accounts?.[0]?.id
    
    // If not found, try alternative structures
    if (!instagramAccountId) {
      // Try direct instagram_accounts array
      if (selectedPage.instagram_accounts && Array.isArray(selectedPage.instagram_accounts)) {
        instagramAccountId = selectedPage.instagram_accounts[0]?.id
      }
      // Try instagram_business_account
      if (!instagramAccountId && selectedPage.instagram_business_account) {
        instagramAccountId = selectedPage.instagram_business_account.id || selectedPage.instagram_business_account
      }
      // Try connected_instagram_account
      if (!instagramAccountId && selectedPage.connected_instagram_account) {
        instagramAccountId = selectedPage.connected_instagram_account.id || selectedPage.connected_instagram_account
      }
    }
    
    console.log('Selected page:', selectedPage.id)
    console.log('Instagram account ID found:', instagramAccountId)
    console.log('Instagram accounts array:', selectedPage.instagram_accounts)
    console.log('Full selected page structure:', JSON.stringify(selectedPage, null, 2))
    
    const metaService = createMetaAPIService({
      accessToken: credentials.accessToken,
      pageId: selectedPage.id,
      instagramBusinessAccountId: instagramAccountId
    })

    // Validate token
    const tokenValidation = await metaService.validateToken()
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid Meta access token. Please reconnect your account.' },
        { status: 400 }
      )
    }

    // Prepare post content
    const postContent: PostContent = {
      caption,
      hashtags: hashtags || [],
      mediaUrl,
      mediaUrls: mediaUrls || (mediaUrl ? [mediaUrl] : undefined),
      scheduledTime,
      platform
    }

    // Post to Meta platforms (Instagram first, then Facebook)
    let result
    switch (platform) {
      case 'instagram':
        if (!instagramAccountId) {
          result = {
            success: false,
            error: 'No Instagram business account connected to this page. Please connect an Instagram account first.'
          }
        } else {
          console.log('Posting to Instagram using Instagram API...')
          
          // Use Instagram API with page access token
          const selectedPage = credentials.pages?.find((page: any) => page.id === selectedPageId)
          const pageAccessToken = selectedPage?.access_token
          
          if (!pageAccessToken) {
            result = {
              success: false,
              error: 'Page access token not found'
            }
          } else {
            const instagramService = createInstagramAPIService({
              accessToken: pageAccessToken,
              instagramBusinessAccountId: instagramAccountId
            })
            
            result = await instagramService.postToInstagram({
              caption: postContent.caption,
              hashtags: postContent.hashtags,
              mediaUrl: postContent.mediaUrl,
              mediaUrls: postContent.mediaUrls,
              scheduledTime: postContent.scheduledTime
            })
          }
        }
        break
      case 'facebook':
        console.log('Posting to Facebook...')
        result = await metaService.postToFacebook(postContent)
        break
      case 'both':
        console.log('Posting to both platforms (Instagram first)...')
        
        // Try Instagram first using Instagram API
        let instagramResult
        if (!instagramAccountId) {
          console.log('No Instagram account ID found, skipping Instagram posting')
          instagramResult = {
            success: false,
            error: 'No Instagram business account connected to this page. Please connect an Instagram account first.'
          }
        } else {
          console.log('Attempting Instagram post with account ID:', instagramAccountId)
          try {
            // Use Instagram API with page access token
            const selectedPage = credentials.pages?.find((page: any) => page.id === selectedPageId)
            const pageAccessToken = selectedPage?.access_token
            
            if (!pageAccessToken) {
              instagramResult = {
                success: false,
                error: 'Page access token not found'
              }
            } else {
              const instagramService = createInstagramAPIService({
                accessToken: pageAccessToken,
                instagramBusinessAccountId: instagramAccountId
              })
              
              instagramResult = await instagramService.postToInstagram({
                caption: postContent.caption,
                hashtags: postContent.hashtags,
                mediaUrl: postContent.mediaUrl,
                mediaUrls: postContent.mediaUrls,
                scheduledTime: postContent.scheduledTime
              })
        }
            console.log('Instagram result:', instagramResult)
          } catch (instagramError: any) {
            console.error('Instagram posting error:', instagramError)
            instagramResult = {
              success: false,
              error: instagramError.message || 'Failed to post to Instagram'
            }
          }
        }
        
        // Then try Facebook
        console.log('Attempting Facebook post...')
        const facebookResult = await metaService.postToFacebook(postContent)
        console.log('Facebook result:', facebookResult)
        
        result = { instagram: instagramResult, facebook: facebookResult }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid platform. Must be facebook, instagram, or both' },
          { status: 400 }
        )
    }

    // Update post status in database
    if (postId) {
      let updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (platform === 'both') {
        const bothResult = result as { facebook: any; instagram: any }
        const facebookSuccess = bothResult.facebook.success
        const instagramSuccess = bothResult.instagram.success
        
        // Mark as successful if at least one platform succeeds
        updateData.status = (facebookSuccess || instagramSuccess) ? 'scheduled' : 'failed'
        updateData.meta_post_ids = {
          facebook: bothResult.facebook.postId,
          instagram: bothResult.instagram.postId
        }
        
        // CRITICAL FIX: Always set scheduled_for when status is scheduled
        if (facebookSuccess || instagramSuccess) {
          updateData.scheduled_for = scheduledTime
        }
        
        if (!facebookSuccess || !instagramSuccess) {
          updateData.meta_errors = {
            facebook: bothResult.facebook.error,
            instagram: bothResult.instagram.error
          }
        }
      } else {
        const singleResult = result as any
        updateData.status = singleResult.success ? 'scheduled' : 'failed'
        
        if (singleResult.success) {
          updateData.meta_post_id = singleResult.postId
          updateData.scheduled_for = scheduledTime
        } else {
          updateData.meta_error = singleResult.error
        }
      }

      await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('user_id', userId)
    }

    // Determine overall success and create user-friendly messages
    let overallSuccess = true
    let userMessage = 'Post published successfully!'
    let errorDetails = ''

    if (platform === 'both') {
      const bothResult = result as { facebook: any; instagram: any }
      const facebookSuccess = bothResult.facebook.success
      const instagramSuccess = bothResult.instagram.success
      
      if (facebookSuccess && instagramSuccess) {
        userMessage = 'Post published successfully to both Instagram and Facebook!'
        overallSuccess = true
      } else if (facebookSuccess && !instagramSuccess) {
        userMessage = 'Posted to Facebook successfully! Instagram posting failed due to API limitations, but your post is scheduled and will be published to Facebook.'
        errorDetails = `Instagram error: ${bothResult.instagram.error}`
        overallSuccess = true // Still consider it successful since Facebook worked
      } else if (!facebookSuccess && instagramSuccess) {
        userMessage = 'Posted to Instagram successfully! Facebook posting failed, but your post is scheduled and will be published to Instagram.'
        errorDetails = `Facebook error: ${bothResult.facebook.error}`
        overallSuccess = true // Still consider it successful since Instagram worked
      } else {
        userMessage = 'Posting failed on both platforms. Please try again in a few minutes.'
        errorDetails = `Instagram: ${bothResult.instagram.error}, Facebook: ${bothResult.facebook.error}`
        overallSuccess = false
      }
    } else {
      const singleResult = result as any
      if (!singleResult.success) {
        if (platform === 'instagram') {
          userMessage = 'Instagram posting failed. This is common with Instagram\'s API. Please try again in a few minutes.'
        } else {
          userMessage = 'Facebook posting failed. Please try again.'
        }
        errorDetails = singleResult.error
        overallSuccess = false
      }
    }

    return NextResponse.json({
      success: overallSuccess,
      result,
      message: userMessage,
      errorDetails: errorDetails || null
    })

  } catch (error: any) {
    console.error('Meta posting error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to post to Meta platforms' },
      { status: 500 }
    )
  }
} 