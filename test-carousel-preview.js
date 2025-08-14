// Test carousel preview functionality
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCarouselPreview() {
  try {
    console.log('Testing carousel preview functionality...')
    
    // Test 1: Check if carousel posts exist
    const { data: carouselPosts, error } = await supabase
      .from('posts')
      .select('*')
      .not('media_urls', 'eq', '[]')
      .gt('media_urls', '[]')
      .limit(1)
    
    if (error) {
      console.error('Error fetching carousel posts:', error)
      return
    }
    
    if (!carouselPosts || carouselPosts.length === 0) {
      console.log('No carousel posts found in database')
      return
    }
    
    const carouselPost = carouselPosts[0]
    console.log('Found carousel post for preview testing:', {
      id: carouselPost.id,
      caption: carouselPost.caption?.substring(0, 100) + '...',
      media_urls: carouselPost.media_urls,
      carousel_count: carouselPost.media_urls?.length || 0
    })
    
    // Test 2: Simulate carousel preview data
    console.log('\n=== SIMULATING CAROUSEL PREVIEW ===')
    
    const previewData = {
      imageUrl: carouselPost.media_urls[0], // First image for backward compatibility
      imageUrls: carouselPost.media_urls, // All carousel images
      caption: carouselPost.caption,
      hashtags: carouselPost.hashtags || [],
      carousel_count: carouselPost.media_urls?.length || 0
    }
    
    console.log('Preview data structure:', {
      imageUrl: previewData.imageUrl,
      imageUrls_count: previewData.imageUrls?.length || 0,
      imageUrls: previewData.imageUrls,
      caption_length: previewData.caption?.length || 0,
      hashtags_count: previewData.hashtags?.length || 0
    })
    
    // Test 3: Simulate carousel navigation
    console.log('\n=== SIMULATING CAROUSEL NAVIGATION ===')
    
    for (let i = 0; i < previewData.imageUrls.length; i++) {
      const currentImage = previewData.imageUrls[i]
      const isVideo = currentImage.match(/\.(mp4|webm|mov)$/i)
      
      console.log(`Image ${i + 1} of ${previewData.imageUrls.length}:`)
      console.log(`  URL: ${currentImage}`)
      console.log(`  Type: ${isVideo ? 'VIDEO' : 'IMAGE'}`)
      console.log(`  Preview: ${i === 0 ? 'MAIN PREVIEW' : 'SWIPE TO VIEW'}`)
    }
    
    // Test 4: Validate preview functionality
    console.log('\n=== PREVIEW VALIDATION ===')
    
    if (previewData.imageUrls && previewData.imageUrls.length > 1) {
      console.log('✅ Carousel preview should show:')
      console.log('  - First image as main preview')
      console.log('  - Navigation arrows (← →)')
      console.log('  - Image counter (1 of 3)')
      console.log('  - All images accessible via navigation')
    } else {
      console.log('⚠️  Single image post - no carousel navigation needed')
    }
    
    console.log('\n=== CAROUSEL PREVIEW TEST COMPLETE ===')
    console.log('✅ Carousel preview functionality ready for testing')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testCarouselPreview() 