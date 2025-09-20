import { NextRequest, NextResponse } from 'next/server'
import { generateInstagramContentFromCLIP } from '../../../lib/ai-services'
import { createClient } from '@supabase/supabase-js'
import { shouldBypassCredits, getAdminInfo } from '../../../lib/admin-utils'

export async function POST(request: NextRequest) {
  try {
    const { imageAnalysis, businessProfile } = await request.json()

    if (!imageAnalysis || !businessProfile) {
      return NextResponse.json(
        { error: 'Missing required parameters: imageAnalysis and businessProfile' },
        { status: 400 }
      )
    }

    // Get user ID from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const userId = authHeader.replace('Bearer ', '')
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 401 }
      )
    }

    // Check if user is admin (bypass credits)
    const bypassCredits = await shouldBypassCredits(userId)
    const adminInfo = await getAdminInfo(userId)
    
    console.log('🔐 Admin check result:', {
      userId,
      bypassCredits,
      adminInfo
    })

    // Check and decrement user's post generation credits atomically (unless admin)
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    
    let currentCredits = 0
    let userData: any = null

    if (!bypassCredits) {
      // Use atomic operation to check and decrement credits for regular users
      const { data: userDataResult, error: userDataError } = await supabase
        .from('user_profiles')
        .select('post_generation_credits, subscription_plan')
        .eq('user_id', userId)
        .gte('post_generation_credits', 1) // Only select if credits >= 1
        .single()

      if (userDataError) {
        console.error('Error fetching user credits:', userDataError)
        return NextResponse.json({ 
          error: 'No post generation credits remaining. Please upgrade your plan or purchase more credits.',
          creditsRemaining: 0
        }, { status: 402 })
      }

      userData = userDataResult
      currentCredits = userData?.post_generation_credits || 0
      
      if (currentCredits <= 0) {
        return NextResponse.json({ 
          error: 'No post generation credits remaining. Please upgrade your plan or purchase more credits.',
          creditsRemaining: 0
        }, { status: 402 })
      }
    } else {
      // For admin users, just fetch user data without credit check
      const { data: userDataResult } = await supabase
        .from('user_profiles')
        .select('post_generation_credits, subscription_plan')
        .eq('user_id', userId)
        .single()
      
      userData = userDataResult
      currentCredits = userData?.post_generation_credits || 0
      console.log('👑 Admin user - bypassing credit check. Current credits:', currentCredits)
    }

    console.log('🚀 Starting INSTAGRAM POST GENERATION...')
    console.log('📊 Request details:')
    console.log('  - User ID:', userId)
    console.log('  - Credits before:', currentCredits)
    console.log('  - Product type:', imageAnalysis.classification)
    console.log('  - Business:', businessProfile.business_name)
    console.log('  - Niche:', businessProfile.niche)

    const result = await generateInstagramContentFromCLIP(imageAnalysis, businessProfile)

    console.log('✅ Generated Instagram content:', result)
    console.log('📋 Post Generation Summary:')
    console.log('  - Caption length:', result.caption.length, 'characters')
    console.log('  - Hashtags count:', result.hashtags.length)
    const newCredits = bypassCredits ? currentCredits : currentCredits - 1
    console.log('  - Credits after:', newCredits)
    console.log('  - Admin bypass:', bypassCredits)

    // Decrement user's post generation credits and log generation event (unless admin)
    if (!bypassCredits) {
      try {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ post_generation_credits: newCredits })
          .eq('user_id', userId)

        if (updateError) {
          console.error('Failed to update user credits:', updateError)
          // Don't fail the request if credit update fails, but log it
        }

        // Log generation event
        await supabase.from('generation_logs').insert({ user_id: userId, type: 'single' })
      } catch (logError) {
        console.error('Failed to log single generation:', logError)
      }
    } else {
      console.log('👑 Admin user - skipping credit decrement and generation log')
    }

    return NextResponse.json({
      success: true,
      result,
      creditsRemaining: newCredits
    })

  } catch (error: any) {
    console.error('Error generating Instagram content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate Instagram content' },
      { status: 500 }
    )
  }
} 