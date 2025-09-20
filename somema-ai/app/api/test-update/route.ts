import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: Request) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, textElements } = body

    if (!postId || !textElements) {
      return NextResponse.json({ error: 'Missing postId or textElements' }, { status: 400 })
    }

    // Test the update
    const { data, error } = await supabase
      .from('posts')
      .update({ text_elements: textElements })
      .eq('id', postId)
      .eq('user_id', user.id)
      .select()

    if (error) {
      return NextResponse.json({ 
        error: 'Update failed', 
        details: error,
        user: user.id,
        postId
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      user: user.id,
      postId
    })

  } catch (error) {
    console.error('Test update error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error 
    }, { status: 500 })
  }
} 