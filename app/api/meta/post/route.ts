import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaAPIService, PostContent } from '../../../../lib/meta-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { caption, hashtags, mediaUrl, scheduledTime, platform, postId, selectedPageId } = await request.json()

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
    
    // Find the selected page and its Instagram account
    const selectedPage = credentials.pages?.find((page: any) => page.id === selectedPageId)
    if (!selectedPage) {
      return NextResponse.json(
        { error: 'Selected page not found in user credentials' },
        { status: 400 }
      )
    }
    
    // Create Meta service with the selected page credentials
    const instagramAccountId = selectedPage.instagram_accounts?.[0]?.id
    console.log('Selected page:', selectedPage.id)
    console.log('Instagram account ID:', instagramAccountId)
    
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
      scheduledTime,
      platform
    }

    // Post to Meta platforms
    let result
    switch (platform) {
      case 'facebook':
        result = await metaService.postToFacebook(postContent)
        break
      case 'instagram':
        if (!instagramAccountId) {
          result = {
            success: false,
            error: 'No Instagram business account connected to this page. Please connect an Instagram account first.'
          }
        } else {
        result = await metaService.postToInstagram(postContent)
        }
        break
      case 'both':
        const facebookResult = await metaService.postToFacebook(postContent)
        let instagramResult
        if (!instagramAccountId) {
          instagramResult = {
            success: false,
            error: 'No Instagram business account connected to this page. Please connect an Instagram account first.'
          }
        } else {
          instagramResult = await metaService.postToInstagram(postContent)
        }
        result = { facebook: facebookResult, instagram: instagramResult }
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
        
        updateData.status = (facebookSuccess && instagramSuccess) ? 'scheduled' : 'failed'
        updateData.meta_post_ids = {
          facebook: bothResult.facebook.postId,
          instagram: bothResult.instagram.postId
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

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error: any) {
    console.error('Meta posting error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to post to Meta platforms' },
      { status: 500 }
    )
  }
} 