// Debug post data to check media_urls field
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugPostData() {
  try {
    console.log('=== DEBUGGING POST DATA ===')
    
    // Check the specific post from the URL
    const postId = 'a5ae53f3-99f3-46e1-8140-9cc8da9cf055'
    
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (error) {
      console.error('Error fetching post:', error)
      return
    }
    
    if (!post) {
      console.log('Post not found')
      return
    }
    
    console.log('\n=== POST DATA ANALYSIS ===')
    console.log('Post ID:', post.id)
    console.log('Caption:', post.caption?.substring(0, 100) + '...')
    console.log('Media URL:', post.media_url)
    console.log('Media URLs:', post.media_urls)
    console.log('Media URLs type:', typeof post.media_urls)
    console.log('Media URLs length:', post.media_urls?.length || 0)
    console.log('Is array:', Array.isArray(post.media_urls))
    console.log('Is null:', post.media_urls === null)
    console.log('Is undefined:', post.media_urls === undefined)
    
    // Check if media_urls column exists
    console.log('\n=== DATABASE SCHEMA CHECK ===')
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'posts')
      .eq('table_schema', 'public')
    
    if (schemaError) {
      console.error('Error checking schema:', schemaError)
    } else {
      const columnNames = columns.map(col => col.column_name)
      console.log('Available columns:', columnNames)
      console.log('Has media_urls column:', columnNames.includes('media_urls'))
    }
    
    // Check all posts to see if any have media_urls
    console.log('\n=== CHECKING ALL POSTS ===')
    const { data: allPosts, error: allError } = await supabase
      .from('posts')
      .select('id, media_url, media_urls')
      .limit(5)
    
    if (allError) {
      console.error('Error fetching all posts:', allError)
    } else {
      console.log('Sample posts:')
      allPosts.forEach((p, index) => {
        console.log(`Post ${index + 1}:`, {
          id: p.id,
          media_url: p.media_url,
          media_urls: p.media_urls,
          media_urls_length: p.media_urls?.length || 0
        })
      })
    }
    
    // Check if we need to migrate data
    console.log('\n=== MIGRATION CHECK ===')
    if (post.media_url && (!post.media_urls || post.media_urls.length === 0)) {
      console.log('⚠️  POST NEEDS MIGRATION')
      console.log('  - Has media_url:', post.media_url)
      console.log('  - Missing media_urls or empty')
      console.log('  - Should migrate media_url to media_urls array')
    } else if (post.media_urls && post.media_urls.length > 0) {
      console.log('✅ POST HAS MEDIA_URLS')
      console.log('  - media_urls count:', post.media_urls.length)
      console.log('  - media_urls:', post.media_urls)
    } else {
      console.log('❌ POST HAS NO MEDIA DATA')
      console.log('  - No media_url')
      console.log('  - No media_urls')
    }
    
  } catch (error) {
    console.error('Debug failed:', error)
  }
}

debugPostData() 