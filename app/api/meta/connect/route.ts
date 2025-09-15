import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaAPIService } from '../../../../lib/meta-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to get user's meta_credentials (accessToken, connected)
async function getUserMetaCredentials(userId: string) {
  const { data: userProfile, error } = await supabase
    .from('user_profiles')
    .select('meta_credentials')
    .eq('user_id', userId)
    .single()
  if (error || !userProfile?.meta_credentials) return null
  return userProfile.meta_credentials
}

export async function GET(request: NextRequest) {
  try {
    // Get user from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }
    const userId = authHeader.replace('Bearer ', '')
    const metaCreds = await getUserMetaCredentials(userId)
    if (!metaCreds?.accessToken) {
      return NextResponse.json(
        { error: 'Meta account not connected' },
        { status: 404 }
      )
    }
    // Use stored pages from database (includes manually added pages)
    const storedPages = metaCreds.pages || []
    console.log(`Using ${storedPages.length} stored pages from database`)
    
    // If no stored pages, fallback to API fetch
    let pagesWithInstagram = storedPages
    let facebookPagesRaw = storedPages
    
    if (storedPages.length === 0) {
      console.log('No stored pages found, fetching from Meta API...')
      const metaService = createMetaAPIService({ accessToken: metaCreds.accessToken })
      
      try {
        // Get all Facebook pages with pagination
        facebookPagesRaw = await metaService.getFacebookPages()
        console.log(`✅ Fetched ${facebookPagesRaw.length} Facebook pages`)
        
        // Get Instagram accounts for each page
        pagesWithInstagram = await Promise.all(
          facebookPagesRaw.map(async (page: any) => {
            console.log(`Getting Instagram accounts for page: ${page.name} (${page.id})`)
            const instagramAccounts = await metaService.getInstagramAccounts(page.id)
            return {
              ...page,
              instagram_accounts: instagramAccounts
            }
          })
        )
        
        console.log(`✅ Processed ${pagesWithInstagram.length} pages with Instagram accounts`)
      } catch (error: any) {
        console.error('Error fetching from Meta API:', error)
        // Fallback to basic page fetch
        try {
          const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,category_list,tasks,access_token&access_token=${metaCreds.accessToken}&limit=100`)
          const data = await response.json()
          
          if (!data.error && data.data) {
            facebookPagesRaw = data.data
            pagesWithInstagram = await Promise.all(
              facebookPagesRaw.map(async (page: any) => {
                const instagramAccounts = await metaService.getInstagramAccounts(page.id)
                return {
                  ...page,
                  instagram_accounts: instagramAccounts
                }
              })
            )
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError)
        }
      }
    }
    // Return both available and connected
    return NextResponse.json({
      success: true,
      available: pagesWithInstagram,
      connected: metaCreds.connected || [],
      debug: { facebookPagesRaw }
    })
  } catch (error: any) {
    console.error('Error fetching Meta pages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Meta pages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pageId, instagramId } = await request.json()
    // Get user from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }
    const userId = authHeader.replace('Bearer ', '')
    // Get current meta_credentials
    const metaCreds = await getUserMetaCredentials(userId)
    if (!metaCreds?.accessToken) {
      return NextResponse.json(
        { error: 'Meta account not connected' },
        { status: 404 }
      )
    }
    // Replace all existing connections with the new one (single connection only)
    const connected = [{ pageId, instagramId }]
    // Update DB
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ meta_credentials: { ...metaCreds, connected } })
      .eq('user_id', userId)
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to connect page/account' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, connected })
  } catch (error: any) {
    console.error('Meta connect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect page/account' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { pageId, instagramId } = await request.json()
    // Get user from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }
    const userId = authHeader.replace('Bearer ', '')
    // Get current meta_credentials
    const metaCreds = await getUserMetaCredentials(userId)
    if (!metaCreds?.accessToken) {
      return NextResponse.json(
        { error: 'Meta account not connected' },
        { status: 404 }
      )
    }
    let connected = metaCreds.connected || []
    connected = connected.filter((c: any) => !(c.pageId === pageId && c.instagramId === instagramId))
    // Update DB
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ meta_credentials: { ...metaCreds, connected } })
      .eq('user_id', userId)
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to disconnect page/account' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, connected })
  } catch (error: any) {
    console.error('Meta disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect page/account' },
      { status: 500 }
    )
  }
} 

export async function PATCH(request: NextRequest) {
  try {
    // Get user from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }
    const userId = authHeader.replace('Bearer ', '')
    
    // Get current meta_credentials
    const metaCreds = await getUserMetaCredentials(userId)
    if (!metaCreds?.accessToken) {
      return NextResponse.json(
        { error: 'Meta account not connected' },
        { status: 404 }
      )
    }
    
    // Clean up: if there are multiple connections, keep only the first one
    const connected = metaCreds.connected || []
    
    let cleanedConnected = connected
    if (connected.length > 1) {
      // Keep only the first connection
      cleanedConnected = [connected[0]]
      
      // Update DB with cleaned connections
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ meta_credentials: { ...metaCreds, connected: cleanedConnected } })
        .eq('user_id', userId)
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to clean up connections' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      connected: cleanedConnected,
      message: connected.length > 1 ? `Cleaned up ${connected.length} connections to single connection` : 'No cleanup needed'
    })
  } catch (error: any) {
    console.error('Meta cleanup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clean up connections' },
      { status: 500 }
    )
  }
} 