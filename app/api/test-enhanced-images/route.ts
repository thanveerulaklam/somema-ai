import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }

    console.log('Testing enhanced images for user:', userId)

    // Check all posts for this user
    const { data: allPosts, error: allPostsError } = await supabase
      .from('posts')
      .select('id, user_id, media_url, media_urls, enhanced_image_url, caption, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (allPostsError) {
      return NextResponse.json({ error: allPostsError.message }, { status: 500 })
    }

    // Check posts with enhanced images
    const { data: enhancedPosts, error: enhancedPostsError } = await supabase
      .from('posts')
      .select('id, user_id, media_url, media_urls, enhanced_image_url, caption, created_at')
      .eq('user_id', userId)
      .not('enhanced_image_url', 'is', null)
      .not('enhanced_image_url', 'eq', '')
      .order('created_at', { ascending: false })

    if (enhancedPostsError) {
      return NextResponse.json({ error: enhancedPostsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      totalPosts: allPosts?.length || 0,
      enhancedPostsCount: enhancedPosts?.length || 0,
      allPosts: allPosts || [],
      enhancedPosts: enhancedPosts || []
    })

  } catch (error: any) {
    console.error('Test enhanced images error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test enhanced images' },
      { status: 500 }
    )
  }
}
