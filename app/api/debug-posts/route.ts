import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all posts with detailed info
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (postsError) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: postsError,
        user: user.id 
      }, { status: 500 })
    }

    // Analyze posts
    const analysis: {
      totalPosts: number
      postsWithTextElements: number
      postsWithoutTextElements: number
      postsWithEmptyTextElements: number
      samplePosts: Array<{
        id: string
        caption: string
        text_elements: any
        hasTextElements: boolean
      }>
    } = {
      totalPosts: posts?.length || 0,
      postsWithTextElements: 0,
      postsWithoutTextElements: 0,
      postsWithEmptyTextElements: 0,
      samplePosts: []
    }

    posts?.forEach(post => {
      if (post.text_elements && Object.keys(post.text_elements).length > 0) {
        analysis.postsWithTextElements++
      } else if (post.text_elements === null || post.text_elements === undefined) {
        analysis.postsWithoutTextElements++
      } else {
        analysis.postsWithEmptyTextElements++
      }
    })

    // Get sample posts for debugging
    analysis.samplePosts = posts?.slice(0, 3).map(post => ({
      id: post.id,
      caption: post.caption?.substring(0, 100) + '...',
      text_elements: post.text_elements,
      hasTextElements: !!(post.text_elements && Object.keys(post.text_elements).length > 0)
    })) || []

    return NextResponse.json({ 
      success: true, 
      analysis,
      user: user.id
    })

  } catch (error) {
    console.error('Debug posts error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error 
    }, { status: 500 })
  }
} 