import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const META_APP_ID = process.env.META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET

// Helper function to get the correct base URL for redirects
function getBaseUrl(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  return isLocalhost 
    ? 'http://localhost:3000'
    : (process.env.META_REDIRECT_URI || 'https://www.quely.ai/api/meta/oauth').replace('/api/meta/oauth', '')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('OAuth callback received:', { code: code ? 'present' : 'missing', error })

  // Handle OAuth errors
  if (error) {
        console.error('OAuth error:', error)
    return NextResponse.redirect(
          `${getBaseUrl(request)}/settings?error=oauth_error&details=${error}`
    )
  }

  // Handle OAuth callback with authorization code
  if (code) {
    try {
      console.log('Processing OAuth code...')
      
      // Exchange authorization code for access token
      const host = request.headers.get('host') || ''
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
      const redirectUri = isLocalhost 
        ? 'http://localhost:3000/api/meta/oauth'
        : (process.env.META_REDIRECT_URI || 'https://www.quely.ai/api/meta/oauth')
      
      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: redirectUri,
          code: code
        })
      })

      const tokenData = await tokenResponse.json()
      console.log('Token exchange response:', tokenData)
      console.log('Token exchange request details:', {
        client_id: META_APP_ID,
        redirect_uri: redirectUri,
        code_length: code?.length || 0
      })

      if (tokenData.error) {
          console.error('Token exchange error details:', tokenData.error)
        return NextResponse.redirect(
            `${getBaseUrl(request)}/settings?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(tokenData.error))}`
        )
      }

      const accessToken = tokenData.access_token
      console.log('Access token obtained:', accessToken.substring(0, 20) + '...')

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
      )
      const userData = await userResponse.json()
      console.log('User data:', userData)

      if (userData.error) {
        console.error('User info error:', userData.error)
        return NextResponse.redirect(
          `${getBaseUrl(request)}/settings?error=user_info_failed`
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
          `${getBaseUrl(request)}/settings?error=pages_failed`
        )
      }

      // Get Instagram accounts for each page
      const pagesWithInstagram = await Promise.all(
        pagesData.data.map(async (page: any) => {
          const instagramResponse = await fetch(
            `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
          )
          const instagramData = await instagramResponse.json()
          
          let instagramAccounts: Array<{id: string, username: string, name: string}> = []
          if (instagramData.instagram_business_account) {
            // Get Instagram account details
            const instagramDetailsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${instagramData.instagram_business_account.id}?fields=id,username,name&access_token=${accessToken}`
            )
            const instagramDetails = await instagramDetailsResponse.json()
            
            if (!instagramDetails.error) {
              instagramAccounts = [instagramDetails]
            }
          }
          
          return {
            ...page,
            instagram_accounts: instagramAccounts
          }
        })
      )

      console.log('Pages with Instagram:', pagesWithInstagram)

      // Create connected accounts list - automatically connect all available pages and Instagram accounts
      const connectedAccounts = []
      for (const page of pagesWithInstagram) {
        if (page.instagram_accounts && page.instagram_accounts.length > 0) {
          for (const instagramAccount of page.instagram_accounts) {
            connectedAccounts.push({
              pageId: page.id,
              instagramId: instagramAccount.id
            })
          }
        }
      }

      console.log('Auto-connected accounts:', connectedAccounts)

      // Get the current user from the session or state
      // For now, we'll use a simple approach - in production, you'd get this from the session
        const currentUserResponse = await fetch(`${getBaseUrl(request)}/api/auth/session`)
      let currentUserId = null
      
      try {
        const sessionData = await currentUserResponse.json()
        currentUserId = sessionData?.user?.id
        console.log('Session data:', sessionData)
      } catch (error) {
        console.log('Could not get session, will use state parameter')
      }

      // If we can't get the user ID from session, we'll store it temporarily and redirect
      if (!currentUserId) {
        console.log('No current user ID found, storing data temporarily')
        const metaData = {
          accessToken,
          userId: userData.id,
          pages: pagesWithInstagram,
          connected: connectedAccounts
        }
        const encodedData = encodeURIComponent(JSON.stringify(metaData))
        const redirectUrl = `${getBaseUrl(request)}/settings?meta_connected=true&data=${encodedData}`
        console.log('Redirecting with data to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }

      console.log('Storing data in database for user:', currentUserId)

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
              pages: pagesWithInstagram,
              connected: connectedAccounts
            }
          })
          .eq('user_id', currentUserId)

        if (updateError) {
          console.error('Error updating Meta credentials:', updateError)
          return NextResponse.redirect(
            `${getBaseUrl(request)}/settings?error=save_failed`
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
              pages: pagesWithInstagram,
              connected: connectedAccounts
            }
          })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          return NextResponse.redirect(
            `${getBaseUrl(request)}/settings?error=save_failed`
          )
        }
      }

      const redirectUrl = `${getBaseUrl(request)}/settings?meta_connected=true`
      console.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)

    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(
        `${getBaseUrl(request)}/settings?error=oauth_failed`
      )
    }
  }

  // Initial OAuth request - redirect to Facebook
  console.log('Starting OAuth flow...')
  
  // Check if we're running locally
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  const redirectUri = isLocalhost 
    ? 'http://localhost:3000/api/meta/oauth'
    : (process.env.META_REDIRECT_URI || 'https://www.quely.ai/api/meta/oauth')
  
  const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,instagram_basic,instagram_manage_insights,instagram_content_publish'
  const oauthState = Math.random().toString(36).substring(7)

  console.log('OAuth parameters:', { redirectUri, scope, oauthState, isLocalhost })

  // For development, we can use a simpler approach
  // In production, this should be the Facebook OAuth URL
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${oauthState}&response_type=code`

  console.log('Redirecting to Facebook OAuth:', authUrl)
  return NextResponse.redirect(authUrl)
} 