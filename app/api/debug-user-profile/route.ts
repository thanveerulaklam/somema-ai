import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile not found', 
        details: profileError.message,
        userId: user.id 
      }, { status: 404 })
    }

    return NextResponse.json({
      userId: user.id,
      userProfile,
      isFreePlan: userProfile.subscription_plan === 'free',
      canUploadVideos: userProfile.subscription_plan !== 'free'
    })

  } catch (error: any) {
    console.error('Error checking user profile:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription_plan, media_storage_limit } = body

    if (!subscription_plan) {
      return NextResponse.json({ error: 'subscription_plan is required' }, { status: 400 })
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_plan,
        media_storage_limit: media_storage_limit || (subscription_plan === 'free' ? 50 : 1000)
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updatedProfile,
      message: `Plan updated to ${subscription_plan}`
    })

  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
