import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with server-side authentication
    const supabase = await getServerSupabase(request.cookies)
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's credits from user_profiles table
    const { data: userData, error: userDataError } = await supabase
      .from('user_profiles')
      .select('image_enhancement_credits, post_generation_credits, subscription_plan')
      .eq('user_id', user.id)
      .single()

    if (userDataError) {
      console.error('Error fetching user credits:', userDataError)
      return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      credits: {
        imageEnhancements: userData?.image_enhancement_credits || 0,
        postGenerations: userData?.post_generation_credits || 0
      },
      subscription: userData?.subscription_plan || 'free'
    })
  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
