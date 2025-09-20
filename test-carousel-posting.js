// Test carousel posting functionality
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCarouselPosting() {
  try {
    console.log('Testing carousel posting functionality...')
    
    // Test 1: Check if a carousel post exists
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .not('media_urls', 'eq', '[]')
      .limit(1)
    
    if (error) {
      console.error('Error fetching carousel posts:', error)
      return
    }
    
    if (!posts || posts.length === 0) {
      console.log('No carousel posts found in database')
      return
    }
    
    const carouselPost = posts[0]
    console.log('Found carousel post:', {
      id: carouselPost.id,
      caption: carouselPost.caption?.substring(0, 100) + '...',
      media_url: carouselPost.media_url,
      media_urls: carouselPost.media_urls,
      carousel_count: carouselPost.media_urls?.length || 0
    })
    
    // Test 2: Simulate posting the carousel post
    console.log('\nSimulating carousel post to Instagram...')
    
    const postData = {
      caption: carouselPost.caption,
      hashtags: carouselPost.hashtags || [],
      mediaUrl: carouselPost.media_url,
      mediaUrls: carouselPost.media_urls,
      platform: 'instagram',
      selectedPageId: 'test-page-id'
    }
    
    console.log('Post data to send:', {
      caption: postData.caption?.substring(0, 100) + '...',
      hashtags: postData.hashtags,
      mediaUrl: postData.mediaUrl,
      mediaUrls: postData.mediaUrls,
      carousel_count: postData.mediaUrls?.length || 0
    })
    
    // Test 3: Check if the post would be treated as carousel
    if (postData.mediaUrls && postData.mediaUrls.length > 1) {
      console.log('✅ This would be posted as a carousel with', postData.mediaUrls.length, 'images')
    } else {
      console.log('❌ This would be posted as a single image')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testCarouselPosting() 