// Test script to verify carousel functionality
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCarousel() {
  try {
    console.log('Testing carousel functionality...')
    
    // Test 1: Check if media_urls column exists
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, media_url, media_urls')
      .limit(5)
    
    if (error) {
      console.error('Error fetching posts:', error)
      return
    }
    
    console.log('Posts with media data:')
    posts.forEach(post => {
      console.log(`- Post ${post.id}:`)
      console.log(`  media_url: ${post.media_url}`)
      console.log(`  media_urls: ${JSON.stringify(post.media_urls)}`)
    })
    
    // Test 2: Create a test carousel post
    const testPost = {
      caption: 'Test carousel post',
      hashtags: ['test', 'carousel'],
      media_urls: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ],
      platform: 'instagram',
      status: 'draft'
    }
    
    console.log('\nCreating test carousel post...')
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert(testPost)
      .select()
    
    if (insertError) {
      console.error('Error creating test post:', insertError)
    } else {
      console.log('Test carousel post created:', newPost)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testCarousel() 