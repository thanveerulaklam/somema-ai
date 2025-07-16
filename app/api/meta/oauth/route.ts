import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const META_APP_ID = process.env.META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings?error=oauth_cancelled`
    )
  }

  // Handle OAuth callback with authorization code
  if (code) {
    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/meta/oauth`,
          code: code
        })
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.error) {
        console.error('Token exchange error:', tokenData.error)
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/settings?error=token_exchange_failed`
        )
      }

      const accessToken = tokenData.access_token

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
      )
      const userData = await userResponse.json()

      if (userData.error) {
        console.error('User info error:', userData.error)
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/settings?error=user_info_failed`
        )
      }

      // Get Facebook pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      )
      const pagesData = await pagesResponse.json()

      console.log('Pages response:', pagesData)
      console.log('Access token type:', accessToken.substring(0, 20) + '...')
      console.log('User ID:', userData.id)

      if (pagesData.error) {
        console.error('Pages error:', pagesData.error)
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/settings?error=pages_failed`
        )
      }

      // Get Instagram accounts for each page
      const pagesWithInstagram = await Promise.all(
        pagesData.data.map(async (page: any) => {
          const instagramResponse = await fetch(
            `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
          )
          const instagramData = await instagramResponse.json()
          
          return {
            ...page,
            instagram_accounts: instagramData.instagram_business_account ? [instagramData.instagram_business_account] : []
          }
        })
      )

      // Get the current user from the session or state
      // For now, we'll use a simple approach - in production, you'd get this from the session
      const currentUserResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`)
      let currentUserId = null
      
      try {
        const sessionData = await currentUserResponse.json()
        currentUserId = sessionData?.user?.id
      } catch (error) {
        console.log('Could not get session, will use state parameter')
      }

      // If we can't get the user ID from session, we'll store it temporarily and redirect
      if (!currentUserId) {
        const metaData = {
          accessToken,
          userId: userData.id,
          pages: pagesWithInstagram
        }
        const encodedData = encodeURIComponent(JSON.stringify(metaData))
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/settings?meta_connected=true&data=${encodedData}`
        )
      }

      // Store in database
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', currentUserId)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            meta_credentials: {
              accessToken,
              pages: pagesWithInstagram
            }
          })
          .eq('user_id', currentUserId)

        if (updateError) {
          console.error('Error updating Meta credentials:', updateError)
          return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/settings?error=save_failed`
          )
        }
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: currentUserId,
            meta_credentials: {
              accessToken,
              pages: pagesWithInstagram
            }
          })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/settings?error=save_failed`
          )
        }
      }

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?meta_connected=true`
      )

    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings?error=oauth_failed`
      )
    }
  }

  // Initial OAuth request - redirect to Facebook
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/meta/oauth`
  const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,instagram_basic,instagram_manage_insights'
  const oauthState = Math.random().toString(36).substring(7)

  // For development, we can use a simpler approach
  // In production, this should be the Facebook OAuth URL
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${oauthState}&response_type=code`

  return NextResponse.redirect(authUrl)
} 