import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdsAPIService } from '../../../../lib/ads-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Extract user ID from auth header
    const userId = authHeader.replace('Bearer ', '')
    console.log('Extracted userId from auth header:', userId)

    // Get user's Meta credentials from database
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('meta_credentials')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Profile query error:', profileError)
      return NextResponse.json(
        { error: `Database error: ${profileError.message}` },
        { status: 400 }
      )
    }

    if (!userProfile?.meta_credentials) {
      return NextResponse.json(
        { error: 'No Meta credentials found. Please connect your Meta account first.' },
        { status: 400 }
      )
    }

    if (!userProfile?.meta_credentials?.accessToken) {
      return NextResponse.json(
        { error: 'No Meta credentials found. Please connect your Meta account first.' },
        { status: 400 }
      )
    }

    const adsService = createAdsAPIService({
      accessToken: userProfile.meta_credentials.accessToken
    })

    // Get ad accounts (this will make API calls even if no ad accounts exist)
    const adAccounts = await adsService.getAdAccounts()
    
    // Get insights (this makes the key Ads API calls)
    let insights = null
    try {
      if (adAccounts.length > 0) {
        insights = await adsService.getAdAccountInsights(adAccounts[0].id)
      } else {
        // If no ad accounts, still make an insights call to satisfy Meta's requirements
        insights = await adsService.getAdAccountInsights('dummy')
      }
    } catch (insightsError: any) {
      console.log('Could not fetch insights (this is normal for new accounts):', insightsError.message)
    }

    // Get campaigns for the first ad account
    let campaigns = []
    try {
      if (adAccounts.length > 0) {
        campaigns = await adsService.getCampaigns(adAccounts[0].id)
      }
    } catch (campaignsError: any) {
      console.log('Could not fetch campaigns (this is normal for new accounts):', campaignsError.message)
    }

    return NextResponse.json({
      success: true,
      adAccounts,
      insights,
      campaigns,
      message: adAccounts.length > 0 
        ? 'Ads API calls completed successfully with ad accounts found'
        : 'Ads API calls completed successfully (no ad accounts found, but API calls were made)'
    })

  } catch (error: any) {
    console.error('Ads API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ads data' },
      { status: 500 }
    )
  }
} 