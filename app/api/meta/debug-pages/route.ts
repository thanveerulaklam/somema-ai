import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaAPIService } from '../../../../lib/meta-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper to get user's meta_credentials
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

    console.log('=== DEBUG PAGES ENDPOINT ===')
    console.log('User ID:', userId)
    console.log('Access token:', metaCreds.accessToken.substring(0, 20) + '...')

    const debugInfo: any = {
      user_id: userId,
      access_token_preview: metaCreds.accessToken.substring(0, 20) + '...',
      stored_pages_count: metaCreds.pages?.length || 0,
      connected_accounts_count: metaCreds.connected?.length || 0,
      methods: {}
    }

    // Method 1: Direct /me/accounts call
    console.log('Method 1: Direct /me/accounts call...')
    try {
      const response1 = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,category_list,tasks,access_token&access_token=${metaCreds.accessToken}&limit=100`)
      const data1 = await response1.json()
      
      debugInfo.methods.direct_me_accounts = {
        success: !data1.error,
        error: data1.error?.message || null,
        pages_count: data1.data?.length || 0,
        pages: data1.data || [],
        paging: data1.paging || null
      }
      
      console.log(`✅ Method 1: ${data1.data?.length || 0} pages found`)
    } catch (error: any) {
      debugInfo.methods.direct_me_accounts = {
        success: false,
        error: error.message,
        pages_count: 0,
        pages: [],
        paging: null
      }
      console.error('❌ Method 1 failed:', error.message)
    }

    // Method 2: Business Manager pages
    console.log('Method 2: Business Manager pages...')
    try {
      const businessesResponse = await fetch(`https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${metaCreds.accessToken}`)
      const businessesData = await businessesResponse.json()
      
      debugInfo.methods.business_manager = {
        success: !businessesData.error,
        error: businessesData.error?.message || null,
        businesses_count: businessesData.data?.length || 0,
        businesses: businessesData.data || [],
        business_pages: []
      }
      
      if (!businessesData.error && businessesData.data && businessesData.data.length > 0) {
        for (const business of businessesData.data) {
          const bizPagesResponse = await fetch(`https://graph.facebook.com/v18.0/${business.id}/owned_pages?fields=id,name,category,category_list,tasks,access_token&access_token=${metaCreds.accessToken}&limit=100`)
          const bizPagesData = await bizPagesResponse.json()
          
          debugInfo.methods.business_manager.business_pages.push({
            business_id: business.id,
            business_name: business.name,
            pages_count: bizPagesData.data?.length || 0,
            pages: bizPagesData.data || [],
            error: bizPagesData.error?.message || null
          })
        }
      }
      
      console.log(`✅ Method 2: ${businessesData.data?.length || 0} businesses found`)
    } catch (error: any) {
      debugInfo.methods.business_manager = {
        success: false,
        error: error.message,
        businesses_count: 0,
        businesses: [],
        business_pages: []
      }
      console.error('❌ Method 2 failed:', error.message)
    }

    // Method 3: User info with accounts edge
    console.log('Method 3: User info with accounts edge...')
    try {
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,category,category_list,tasks,access_token}&access_token=${metaCreds.accessToken}`)
      const userData = await userResponse.json()
      
      debugInfo.methods.user_accounts_edge = {
        success: !userData.error,
        error: userData.error?.message || null,
        user_info: {
          id: userData.id,
          name: userData.name
        },
        accounts_count: userData.accounts?.data?.length || 0,
        accounts: userData.accounts?.data || [],
        accounts_paging: userData.accounts?.paging || null
      }
      
      console.log(`✅ Method 3: ${userData.accounts?.data?.length || 0} accounts found`)
    } catch (error: any) {
      debugInfo.methods.user_accounts_edge = {
        success: false,
        error: error.message,
        user_info: null,
        accounts_count: 0,
        accounts: [],
        accounts_paging: null
      }
      console.error('❌ Method 3 failed:', error.message)
    }

    // Method 4: Meta API Service
    console.log('Method 4: Meta API Service...')
    try {
      const metaService = createMetaAPIService({ accessToken: metaCreds.accessToken })
      const apiPages = await metaService.getFacebookPages()
      
      debugInfo.methods.meta_api_service = {
        success: true,
        error: null,
        pages_count: apiPages.length,
        pages: apiPages
      }
      
      console.log(`✅ Method 4: ${apiPages.length} pages found`)
    } catch (error: any) {
      debugInfo.methods.meta_api_service = {
        success: false,
        error: error.message,
        pages_count: 0,
        pages: []
      }
      console.error('❌ Method 4 failed:', error.message)
    }

    // Test Instagram discovery for a few pages
    console.log('Testing Instagram discovery...')
    debugInfo.instagram_test = {}
    
    const testPages = debugInfo.methods.direct_me_accounts?.pages?.slice(0, 3) || []
    for (const page of testPages) {
      try {
        const metaService = createMetaAPIService({ accessToken: metaCreds.accessToken })
        const instagramAccounts = await metaService.getInstagramAccounts(page.id)
        
        debugInfo.instagram_test[page.id] = {
          page_name: page.name,
          page_id: page.id,
          instagram_accounts_count: instagramAccounts.length,
          instagram_accounts: instagramAccounts
        }
        
        console.log(`✅ Instagram test for ${page.name}: ${instagramAccounts.length} accounts`)
      } catch (error: any) {
        debugInfo.instagram_test[page.id] = {
          page_name: page.name,
          page_id: page.id,
          error: error.message,
          instagram_accounts_count: 0,
          instagram_accounts: []
        }
        console.error(`❌ Instagram test failed for ${page.name}:`, error.message)
      }
    }

    console.log('=== DEBUG COMPLETE ===')
    return NextResponse.json({
      success: true,
      debug_info: debugInfo,
      summary: {
        total_methods: Object.keys(debugInfo.methods).length,
        successful_methods: Object.values(debugInfo.methods).filter((m: any) => m.success).length,
        total_pages_found: Math.max(
          debugInfo.methods.direct_me_accounts?.pages_count || 0,
          debugInfo.methods.meta_api_service?.pages_count || 0,
          debugInfo.methods.user_accounts_edge?.accounts_count || 0
        )
      }
    })
  } catch (error: any) {
    console.error('Debug pages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to debug pages' },
      { status: 500 }
    )
  }
} 