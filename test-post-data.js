// Test post data structure for carousel preview
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testPostData() {
  try {
    console.log('Testing post data structure...')
    
    // Test the specific post ID from the URL
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
    
    console.log('=== POST DATA STRUCTURE ===')
    console.log('Post ID:', post.id)
    console.log('Caption:', post.caption?.substring(0, 100) + '...')
    console.log('Media URL:', post.media_url)
    console.log('Media URLs:', post.media_urls)
    console.log('Media URLs type:', typeof post.media_urls)
    console.log('Media URLs length:', post.media_urls?.length || 0)
    console.log('Is array:', Array.isArray(post.media_urls))
    
    // Check if it's a carousel post
    const isCarousel = post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 1
    console.log('Is carousel post:', isCarousel)
    
    if (isCarousel) {
      console.log('\n=== CAROUSEL DETAILS ===')
      console.log('Number of images:', post.media_urls.length)
      post.media_urls.forEach((url, index) => {
        console.log(`Image ${index + 1}:`, url)
      })
    }
    
    // Simulate the editor data structure
    console.log('\n=== SIMULATED EDITOR DATA ===')
    const editorData = {
      imageUrl: post.media_urls?.[0] || post.media_url,
      imageUrls: post.media_urls,
      caption: post.caption,
      hashtags: post.hashtags || []
    }
    
    console.log('Editor data:', {
      imageUrl: editorData.imageUrl,
      imageUrls_count: editorData.imageUrls?.length || 0,
      imageUrls: editorData.imageUrls,
      is_carousel: (editorData.imageUrls?.length || 0) > 1
    })
    
    console.log('\n=== EXPECTED UI BEHAVIOR ===')
    if (editorData.imageUrls && editorData.imageUrls.length > 1) {
      console.log('✅ Should show carousel preview with:')
      console.log('  - Main preview image')
      console.log('  - Thumbnail row with', editorData.imageUrls.length, 'images')
      console.log('  - Carousel indicator')
    } else {
      console.log('⚠️  Single image post - no carousel needed')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testPostData() 