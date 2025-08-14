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
      facebookPagesRaw = await metaService.getFacebookPages()
      const facebookPages = facebookPagesRaw
      pagesWithInstagram = await Promise.all(
        facebookPages.map(async (page: any) => {
          const instagramAccounts = await metaService.getInstagramAccounts(page.id)
          return {
            ...page,
            instagram_accounts: instagramAccounts
          }
        })
      )
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
    // Add to connected list
    const connected = metaCreds.connected || []
    // Prevent duplicates
    if (!connected.some((c: any) => c.pageId === pageId && c.instagramId === instagramId)) {
      connected.push({ pageId, instagramId })
    }
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