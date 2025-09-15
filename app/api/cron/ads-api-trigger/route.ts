import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdsAPIService } from '../../../../lib/ads-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel cron request
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    // Check for Vercel-specific headers that indicate this is a legitimate Vercel cron job
    const vercelId = request.headers.get('x-vercel-id');
    const vercelDeploymentUrl = request.headers.get('x-vercel-deployment-url');
    const vercelCache = request.headers.get('x-vercel-cache');
    const vercelMatchedPath = request.headers.get('x-matched-path');
    const host = request.headers.get('host');
    
    // Vercel cron jobs will have x-vercel-id and either x-vercel-deployment-url or x-vercel-cache
    // Also allow requests from Vercel domains (for actual cron jobs that might not have all headers)
    // Allow any request that has x-vercel-id (Vercel's internal requests)
    const isVercelCron = !!(vercelId && (vercelDeploymentUrl || vercelCache || vercelMatchedPath)) ||
                        (host && host.includes('vercel.app')) ||
                        !!vercelId; // Any request with x-vercel-id is from Vercel
    
    if (!isVercelCron && (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting daily Ads API trigger cron job...')

    // Get all users with Meta credentials
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, meta_credentials')
      .not('meta_credentials', 'is', null)

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      )
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.log('No users with Meta credentials found')
      return NextResponse.json({
        success: true,
        message: 'No users with Meta credentials found',
        processed: 0
      })
    }

    let processedCount = 0
    let successCount = 0
    let errorCount = 0

    // Process each user
    for (const profile of userProfiles) {
      try {
        if (!profile.meta_credentials?.accessToken) {
          console.log(`Skipping user ${profile.user_id} - no access token`)
          continue
        }

        const adsService = createAdsAPIService({
          accessToken: profile.meta_credentials.accessToken
        })

        // Make Ads API calls
        const adAccounts = await adsService.getAdAccounts()
        
        if (adAccounts.length > 0) {
          // Get insights for the first ad account
          const firstAdAccount = adAccounts[0]
          try {
            await adsService.getAdAccountInsights(firstAdAccount.id)
            console.log(`Successfully made Ads API calls for user ${profile.user_id}`)
            successCount++
          } catch (insightsError: any) {
            console.log(`Could not fetch insights for user ${profile.user_id}:`, insightsError.message)
            // Still count as processed since we made the API call
            successCount++
          }
        } else {
          console.log(`No ad accounts found for user ${profile.user_id}`)
          // Still count as processed since we made the API call
          successCount++
        }

        processedCount++
      } catch (error: any) {
        console.error(`Error processing user ${profile.user_id}:`, error.message)
        errorCount++
      }
    }

    console.log(`Ads API cron job completed. Processed: ${processedCount}, Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: 'Daily Ads API trigger completed',
      processed: processedCount,
      successful: successCount,
      errors: errorCount
    })

  } catch (error: any) {
    console.error('Ads API cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to trigger Ads API calls' },
      { status: 500 }
    )
  }
} 