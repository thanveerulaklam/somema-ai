import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('Running carousel migration...')
    
    // Add media_urls column if it doesn't exist
    const { error: alterError } = await supabase
      .from('posts')
      .select('media_urls')
      .limit(1)
    
    if (alterError && alterError.message.includes('column "media_urls" does not exist')) {
      // Column doesn't exist, we need to add it
      console.log('Adding media_urls column...')
      // Note: This would require direct SQL execution which isn't available in the client
      // For now, we'll handle this by updating the schema manually
      return NextResponse.json({
        success: false,
        error: 'Please run the migration manually in your Supabase dashboard using the SQL in add-carousel-support.sql'
      })
    }
    
    // Update existing posts to migrate single media_url to media_urls array
    const { data: postsToUpdate, error: selectError } = await supabase
      .from('posts')
      .select('id, media_url, media_urls')
      .or('media_urls.is.null,media_urls.eq.[]')
    
    if (selectError) {
      console.error('Error selecting posts:', selectError)
      return NextResponse.json({ success: false, error: selectError.message })
    }
    
    if (postsToUpdate && postsToUpdate.length > 0) {
      console.log(`Updating ${postsToUpdate.length} posts...`)
      
      for (const post of postsToUpdate) {
        const mediaUrls = post.media_url && post.media_url.trim() !== '' 
          ? [post.media_url] 
          : []
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ media_urls: mediaUrls })
          .eq('id', post.id)
        
        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
        }
      }
    }
    
    console.log('Carousel migration completed successfully!')
    return NextResponse.json({
      success: true,
      message: 'Carousel migration completed successfully!',
      updatedPosts: postsToUpdate?.length || 0
    })
    
  } catch (error: any) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
} 