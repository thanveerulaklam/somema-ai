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

// Helper function to fetch all pages with pagination
async function fetchAllPages(accessToken: string): Promise<any[]> {
  let allPages: any[] = []
  let nextUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,category_list,tasks,access_token&access_token=${accessToken}&limit=100`
  
  while (nextUrl) {
    console.log('Fetching pages from:', nextUrl)
    const response = await fetch(nextUrl)
    const data = await response.json()
    
    console.log('Page fetch response:', JSON.stringify(data, null, 2))
    
    if (data.error) {
      console.error('❌ Page fetch error:', data.error)
      throw new Error(`Failed to fetch pages: ${data.error.message}`)
    }
    
    if (data.data && Array.isArray(data.data)) {
      allPages = allPages.concat(data.data)
      console.log(`✅ Fetched ${data.data.length} pages in this batch`)
    }
    
    // Check for next page
    nextUrl = data.paging?.next || null
  }
  
  console.log(`📊 Total pages fetched: ${allPages.length}`)
  return allPages
}

// Helper function to fetch all business pages
async function fetchBusinessPages(accessToken: string): Promise<any[]> {
  let allBusinessPages: any[] = []
  
  try {
    // First, get all business accounts
    const businessesResponse = await fetch(`https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${accessToken}`)
    const businessesData = await businessesResponse.json()
    
    console.log('Business accounts response:', businessesData)
    
    if (businessesData.error) {
      console.log('No business accounts or error:', businessesData.error.message)
      return []
    }
    
    if (businessesData.data && businessesData.data.length > 0) {
      console.log(`Found ${businessesData.data.length} business accounts`)
      
      // For each business, get all owned pages
      for (const business of businessesData.data) {
        console.log(`Fetching pages for business: ${business.name} (ID: ${business.id})`)
        
        let businessPagesUrl = `https://graph.facebook.com/v18.0/${business.id}/owned_pages?fields=id,name,category,category_list,tasks,access_token&access_token=${accessToken}&limit=100`
        
        while (businessPagesUrl) {
          const bizPagesResponse = await fetch(businessPagesUrl)
          const bizPagesData = await bizPagesResponse.json()
          
          console.log(`Business pages response for ${business.name}:`, bizPagesData)
          
          if (bizPagesData.error) {
            console.log(`Error fetching pages for business ${business.name}:`, bizPagesData.error.message)
            break
          }
          
          if (bizPagesData.data && Array.isArray(bizPagesData.data)) {
            allBusinessPages = allBusinessPages.concat(bizPagesData.data)
            console.log(`Found ${bizPagesData.data.length} pages in business ${business.name}`)
          }
          
          businessPagesUrl = bizPagesData.paging?.next || null
        }
      }
    }
  } catch (error) {
    console.log('Error fetching business pages:', error)
  }
  
  console.log(`📊 Total business pages fetched: ${allBusinessPages.length}`)
  return allBusinessPages
}

// Helper function to get Instagram accounts for a page
async function getInstagramAccountsForPage(pageId: string, pageAccessToken: string): Promise<Array<{id: string, username: string, name: string}>> {
  const instagramAccounts: Array<{id: string, username: string, name: string}> = []
  
  try {
    // Get page details including Instagram connections
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account,connected_instagram_account&access_token=${pageAccessToken}`
    )
    const pageData = await pageResponse.json()
    
    console.log(`Instagram data for page ${pageId}:`, JSON.stringify(pageData, null, 2))
    
    // Check for Instagram Business Account
    if (pageData.instagram_business_account) {
      console.log(`✅ Found Instagram Business Account for page ${pageId}`)
      const instagramDetailsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageData.instagram_business_account.id}?fields=id,username,name&access_token=${pageAccessToken}`
      )
      const instagramDetails = await instagramDetailsResponse.json()
      
      if (!instagramDetails.error) {
        instagramAccounts.push(instagramDetails)
        console.log(`✅ Added Instagram Business: ${instagramDetails.username} (${instagramDetails.id})`)
      } else {
        console.log(`❌ Error getting Instagram business details:`, instagramDetails.error)
      }
    }
    
    // Check for Connected Instagram Account (non-business) only if different from business account
    if (pageData.connected_instagram_account && 
        (!pageData.instagram_business_account || 
         pageData.connected_instagram_account.id !== pageData.instagram_business_account.id)) {
      console.log(`✅ Found Connected Instagram Account for page ${pageId}`)
      const connectedInstaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageData.connected_instagram_account.id}?fields=id,username,name&access_token=${pageAccessToken}`
      )
      const connectedInstaDetails = await connectedInstaResponse.json()
      
      if (!connectedInstaDetails.error) {
        instagramAccounts.push(connectedInstaDetails)
        console.log(`✅ Added Connected Instagram: ${connectedInstaDetails.username} (${connectedInstaDetails.id})`)
      } else {
        console.log(`❌ Error getting connected Instagram details:`, connectedInstaDetails.error)
      }
    }
    
    // Also check for Instagram accounts through the page's Instagram edge
    try {
      const instagramEdgeResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/instagram_accounts?fields=id,username,name&access_token=${pageAccessToken}`
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
    
  } catch (error) {
    console.error(`❌ Error getting Instagram accounts for page ${pageId}:`, error)
  }
  
  console.log(`📊 Total Instagram accounts for page ${pageId}: ${instagramAccounts.length}`)
  return instagramAccounts
}

// Helper function to fetch all pages with enhanced discovery for regular users
async function fetchAllPagesEnhanced(accessToken: string): Promise<any[]> {
  let allPages: any[] = []
  
  console.log('=== ENHANCED PAGE DISCOVERY FOR REGULAR USERS ===')
  
  // Method 1: Direct pages from /me/accounts (always works)
  console.log('Method 1: Fetching direct pages from /me/accounts...')
  try {
    const directPages = await fetchAllPages(accessToken)
    allPages = allPages.concat(directPages)
    console.log(`✅ Method 1: Found ${directPages.length} direct pages`)
  } catch (error: any) {
    console.error('❌ Method 1 failed:', error.message)
  }
  
  // Method 2: User accounts edge (alternative way to get pages)
  console.log('Method 2: Fetching pages via user accounts edge...')
  try {
    const userAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=accounts{id,name,category,category_list,tasks,access_token}&access_token=${accessToken}&limit=100`
    )
    const userAccountsData = await userAccountsResponse.json()
    
    if (!userAccountsData.error && userAccountsData.accounts && userAccountsData.accounts.data) {
      const userAccounts = userAccountsData.accounts.data
      console.log(`✅ Method 2: Found ${userAccounts.length} pages via user accounts edge`)
      
      // Merge with existing pages, avoiding duplicates
      for (const userAccount of userAccounts) {
        const existingIndex = allPages.findIndex(page => page.id === userAccount.id)
        if (existingIndex < 0) {
          allPages.push(userAccount)
          console.log(`✅ Added new page via user accounts: ${userAccount.name}`)
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Method 2 failed:', error.message)
  }
  
  // Method 3: Business Manager pages (may not work for regular users)
  console.log('Method 3: Attempting Business Manager access...')
  try {
    const businessPages = await fetchBusinessPages(accessToken)
    if (businessPages.length > 0) {
      console.log(`✅ Method 3: Found ${businessPages.length} Business Manager pages`)
      
      // Merge business pages, avoiding duplicates
      for (const businessPage of businessPages) {
        const existingIndex = allPages.findIndex(page => page.id === businessPage.id)
        if (existingIndex >= 0) {
          // Update existing page with business info
          allPages[existingIndex] = { ...allPages[existingIndex], ...businessPage }
          console.log(`✅ Updated existing page with business info: ${businessPage.name}`)
        } else {
          allPages.push(businessPage)
          console.log(`✅ Added Business Manager page: ${businessPage.name}`)
        }
      }
    } else {
      console.log('ℹ️  Method 3: No Business Manager pages found (normal for regular users)')
    }
  } catch (error: any) {
    console.log('ℹ️  Method 3: Business Manager access not available (normal for regular users)')
  }
  
  // Method 4: Check for additional accessible pages
  console.log('Method 4: Checking for additional accessible pages...')
  try {
    // Get user info to understand their role
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`)
    const userData = await userResponse.json()
    
    if (!userData.error) {
      console.log(`✅ User info: ${userData.name} (${userData.id})`)
      
      // Try to discover pages through Instagram accounts
      const instagramPages = await discoverPagesViaInstagram(accessToken, allPages)
      if (instagramPages.length > 0) {
        console.log(`✅ Method 4: Found ${instagramPages.length} additional pages via Instagram discovery`)
        allPages = allPages.concat(instagramPages)
      }
    }
  } catch (error: any) {
    console.error('❌ Method 4 failed:', error.message)
  }
  
  console.log(`📊 Enhanced discovery complete: ${allPages.length} total pages found`)
  return allPages
}

// Helper function to discover pages via Instagram accounts
async function discoverPagesViaInstagram(accessToken: string, existingPages: any[]): Promise<any[]> {
  const discoveredPages: any[] = []
  
  try {
    // For each existing page, check if it has Instagram accounts
    for (const page of existingPages.slice(0, 5)) { // Limit to first 5 pages to avoid rate limiting
      try {
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account,connected_instagram_account&access_token=${accessToken}`
        )
        const instagramData = await instagramResponse.json()
        
        if (instagramData.instagram_business_account || instagramData.connected_instagram_account) {
          // This page has Instagram accounts, it might be connected to other pages
          console.log(`📱 Page ${page.name} has Instagram accounts`)
          
          // Try to discover related pages through Instagram
          const relatedPages = await discoverRelatedPages(accessToken, page.id)
          for (const relatedPage of relatedPages) {
            const existingIndex = discoveredPages.findIndex(p => p.id === relatedPage.id)
            if (existingIndex < 0) {
              discoveredPages.push(relatedPage)
            }
          }
        }
      } catch (error) {
        // Continue with next page
        console.log(`⚠️  Error checking Instagram for page ${page.name}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Instagram discovery failed:', error)
  }
  
  return discoveredPages
}

// Helper function to discover related pages
async function discoverRelatedPages(accessToken: string, pageId: string): Promise<any[]> {
  const relatedPages: any[] = []
  
  try {
    // Try to get pages that might be related to this page
    // This is a fallback method for regular users
    const relatedResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=connected_pages&access_token=${accessToken}`
    )
    const relatedData = await relatedResponse.json()
    
    if (!relatedData.error && relatedData.connected_pages && relatedData.connected_pages.data) {
      for (const connectedPage of relatedData.connected_pages.data) {
        try {
          // Check if we can access this connected page
          const pageResponse = await fetch(
            `https://graph.facebook.com/v18.0/${connectedPage.id}?fields=id,name,category&access_token=${accessToken}`
          )
          const pageData = await pageResponse.json()
          
          if (!pageData.error) {
            relatedPages.push({
              id: pageData.id,
              name: pageData.name,
              category: pageData.category,
              tasks: ['MODERATE', 'MESSAGING', 'ANALYZE', 'ADVERTISE', 'CREATE_CONTENT', 'MANAGE'],
              access_token: accessToken,
              discovered_via: 'connected_pages'
            })
          }
        } catch (error) {
          // Skip this page if we can't access it
        }
      }
    }
  } catch (error) {
    console.log('ℹ️  Related pages discovery not available')
  }
  
  return relatedPages
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

      if (tokenData.error) {
        console.error('Token exchange error details:', tokenData.error)
        return NextResponse.redirect(
          `${getBaseUrl(request)}/settings?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(tokenData.error))}`
        )
      }

      const shortLivedToken = tokenData.access_token
      console.log('Short-lived token obtained:', shortLivedToken.substring(0, 20) + '...')
      
      // Exchange short-lived token for long-lived token
      console.log('=== STEP 2: EXCHANGING FOR LONG-LIVED TOKEN ===')
      const longLivedTokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
      )
      const longLivedTokenData = await longLivedTokenResponse.json()
      
      if (longLivedTokenData.error) {
        console.error('❌ Long-lived token exchange failed:', longLivedTokenData.error)
        return NextResponse.redirect(
          `${getBaseUrl(request)}/settings?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(longLivedTokenData.error))}`
        )
      }

      const accessToken = longLivedTokenData.access_token
      console.log('✅ Long-lived token obtained:', accessToken.substring(0, 20) + '...')
      console.log('Token expires in:', longLivedTokenData.expires_in, 'seconds')

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

      // STEP 3: Fetch ALL pages with comprehensive approach
      console.log('=== STEP 3: COMPREHENSIVE PAGE DISCOVERY ===')
      
      // Use enhanced discovery that works for both developers and regular users
      console.log('Using enhanced page discovery for all user types...')
      let allPages: any[] = []
      
      try {
        const discoveredPages = await fetchAllPagesEnhanced(accessToken)
        allPages = allPages.concat(discoveredPages)
        console.log(`✅ Enhanced discovery: Found ${discoveredPages.length} total pages`)
      } catch (error: any) {
        console.error('❌ Enhanced discovery failed:', error.message)
        // Fallback to basic discovery
        try {
          const basicPages = await fetchAllPages(accessToken)
          allPages = allPages.concat(basicPages)
          console.log(`✅ Fallback discovery: Found ${basicPages.length} basic pages`)
        } catch (fallbackError: any) {
          console.error('❌ Fallback discovery also failed:', fallbackError.message)
        }
      }
      
      console.log(`\n=== PAGE DISCOVERY COMPLETE ===`)
      console.log(`📊 Total unique pages found: ${allPages.length}`)
      console.log('All pages found:', allPages.map(p => `${p.name} (${p.id})`))
      
      if (allPages.length === 0) {
        console.error('❌ CRITICAL ERROR: No pages found')
        return NextResponse.redirect(
          `${getBaseUrl(request)}/settings?error=no_pages_found`
        )
      }

      // Analyze discovery results for user guidance
      const hasBusinessPages = allPages.some(page => page.discovered_via === 'business_manager' || page.business_id)
      const hasDirectPages = allPages.some(page => !page.discovered_via || page.discovered_via === 'direct')
      const hasConnectedPages = allPages.some(page => page.discovered_via === 'connected_pages')
      
      console.log(`📊 Discovery Analysis:`)
      console.log(`   - Direct pages: ${hasDirectPages}`)
      console.log(`   - Business Manager pages: ${hasBusinessPages}`)
      console.log(`   - Connected pages: ${hasConnectedPages}`)
      
      // Determine user type and provide guidance
      const userType = hasBusinessPages ? 'developer' : 'regular'
      console.log(`👤 User type detected: ${userType}`)
      
      if (userType === 'regular' && allPages.length < 5) {
        console.log(`ℹ️  Regular user with limited pages - this is normal`)
        console.log(`ℹ️  Business Manager pages may not be visible to regular users`)
      }

      // STEP 4: Process each page and get Instagram accounts
      console.log('\n=== STEP 4: INSTAGRAM ACCOUNT DISCOVERY ===')
      const pagesWithInstagram = await Promise.all(
        allPages.map(async (page: any, index: number) => {
          console.log(`\n--- PROCESSING PAGE ${index + 1}/${allPages.length} ---`)
          console.log(`Page: ${page.name} (ID: ${page.id})`)
          
          // Exchange short-lived page access token for long-lived one if needed
          let pageAccessToken = page.access_token || accessToken
          console.log(`Original page access token for ${page.name}: ${pageAccessToken.substring(0, 20)}...`)
          
          if (page.access_token && page.access_token !== accessToken) {
            try {
              console.log(`Exchanging short-lived token for long-lived token for ${page.name}...`)
              const tokenExchangeResponse = await fetch(
                `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${page.access_token}`
              )
              const tokenExchangeData = await tokenExchangeResponse.json()
              
              if (!tokenExchangeData.error && tokenExchangeData.access_token) {
                pageAccessToken = tokenExchangeData.access_token
                console.log(`✅ Successfully exchanged token for ${page.name}`)
              } else {
                console.log(`⚠️  Token exchange failed for ${page.name}, using original token`)
              }
            } catch (error) {
              console.log(`⚠️  Token exchange error for ${page.name}:`, error)
            }
          }
          
          console.log(`Final access token for ${page.name}: ${pageAccessToken.substring(0, 20)}...`)
          
          // Get Instagram accounts for this page
          const instagramAccounts = await getInstagramAccountsForPage(page.id, pageAccessToken)
          
          return {
            ...page,
            access_token: pageAccessToken,
            instagram_accounts: instagramAccounts
          }
        })
      )
      
      console.log(`\n=== INSTAGRAM DISCOVERY COMPLETE ===`)
      console.log(`📊 Total pages with Instagram: ${pagesWithInstagram.length}`)
      pagesWithInstagram.forEach((page, index) => {
        console.log(`${index + 1}. ${page.name}: ${page.instagram_accounts.length} Instagram accounts`)
      })

      // Create connected accounts list - automatically connect all available pages and Instagram accounts
      const connectedAccounts = []
      console.log('\n=== CREATING CONNECTED ACCOUNTS ===')
      for (const page of pagesWithInstagram) {
        console.log(`Processing page: ${page.name} (${page.id})`)
        console.log(`Instagram accounts: ${page.instagram_accounts?.length || 0}`)
        
        if (page.instagram_accounts && page.instagram_accounts.length > 0) {
          for (const instagramAccount of page.instagram_accounts) {
            connectedAccounts.push({
              pageId: page.id,
              instagramId: instagramAccount.id
            })
            console.log(`✅ Connected: ${page.name} → ${instagramAccount.username}`)
          }
        } else {
          console.log(`ℹ️  No Instagram accounts for ${page.name} - page will still be stored`)
        }
      }
      
      console.log(`\n=== FINAL SUMMARY ===`)
      console.log(`📊 Total pages to store: ${pagesWithInstagram.length}`)
      console.log(`📊 Total connected accounts: ${connectedAccounts.length}`)
      console.log(`📊 Pages with Instagram: ${pagesWithInstagram.filter(p => p.instagram_accounts?.length > 0).length}`)
      console.log(`📊 Pages without Instagram: ${pagesWithInstagram.filter(p => !p.instagram_accounts || p.instagram_accounts.length === 0).length}`)
      
      // Get the current user from the session
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
          connected: [] // Don't auto-connect any accounts
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
        // Update existing profile - preserve existing connections but add new pages
        const { data: currentProfile } = await supabase
          .from('user_profiles')
          .select('meta_credentials')
          .eq('user_id', currentUserId)
          .single()

        const currentConnected = currentProfile?.meta_credentials?.connected || []
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            meta_credentials: {
              accessToken,
              pages: pagesWithInstagram,
              connected: currentConnected // Preserve existing connections
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
        // Create new profile - don't auto-connect any accounts
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: currentUserId,
            meta_credentials: {
              accessToken,
              pages: pagesWithInstagram,
              connected: [] // Don't auto-connect any accounts
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
  
  // OAuth scope with currently valid permissions for page discovery and Instagram posting
  const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,instagram_basic,instagram_content_publish,business_management,pages_manage_ads,pages_manage_engagement,pages_manage_cta,pages_manage_instant_articles,pages_utility_messaging,pages_messaging'
  const oauthState = Math.random().toString(36).substring(7)

  console.log('OAuth parameters:', { redirectUri, scope, oauthState, isLocalhost })

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${oauthState}&auth_type=reauthenticate&response_type=code`

  console.log('Redirecting to Facebook OAuth:', authUrl)
  return NextResponse.redirect(authUrl)
} 