import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()
    
    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }
    
    console.log('Debugging post:', postId)
    
    // Get the post data
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (error) {
      console.error('Error fetching post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('Post data:', post)
    
    // Check if media_urls column exists
    const { data: columns, error: columnsError } = await supabase
      .from('posts')
      .select('media_urls')
      .limit(1)
    
    if (columnsError && columnsError.message.includes('column "media_urls" does not exist')) {
      console.log('media_urls column does not exist, running migration...')
      
      // Try to add the column
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE posts ADD COLUMN media_urls JSONB DEFAULT \'[]\';'
      })
      
      if (alterError) {
        console.error('Error adding column:', alterError)
        return NextResponse.json({
          error: 'Database migration needed. Please run the migration manually in Supabase dashboard.',
          migrationNeeded: true,
          post
        })
      }
      
      // Update the post to migrate media_url to media_urls
      const mediaUrls = post.media_url && post.media_url.trim() !== '' 
        ? [post.media_url] 
        : []
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ media_urls: mediaUrls })
        .eq('id', postId)
      
      if (updateError) {
        console.error('Error updating post:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      
      console.log('Migration completed, updated post with media_urls:', mediaUrls)
      
      // Fetch updated post
      const { data: updatedPost, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching updated post:', fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        post: updatedPost,
        migrationCompleted: true
      })
    }
    
    return NextResponse.json({
      success: true,
      post,
      migrationCompleted: false
    })
    
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: error.message || 'Debug failed' },
      { status: 500 }
    )
  }
} 