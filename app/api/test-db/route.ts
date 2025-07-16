import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Test if posts table exists and get count
    const { data: posts, error: postsError, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (postsError) {
      return NextResponse.json({ 
        error: 'Posts table error', 
        details: postsError,
        user: user.id 
      }, { status: 500 })
    }

    // Get actual posts data
    const { data: actualPosts, error: actualPostsError } = await supabase
      .from('posts')
      .select('id, caption, created_at, user_id, text_elements')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (actualPostsError) {
      return NextResponse.json({ 
        error: 'Failed to get actual posts', 
        details: actualPostsError,
        user: user.id 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      user: user.id,
      postsCount: count,
      recentPosts: actualPosts || [],
      tableExists: true
    })

  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error 
    }, { status: 500 })
  }
} 