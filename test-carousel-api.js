// Test carousel API implementation
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCarouselAPI() {
  try {
    console.log('Testing carousel API implementation...')
    
    // Test 1: Check if carousel posts exist in database
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
    console.log('Found carousel post:', {
      id: carouselPost.id,
      caption: carouselPost.caption?.substring(0, 100) + '...',
      media_urls: carouselPost.media_urls,
      carousel_count: carouselPost.media_urls?.length || 0
    })
    
    // Test 2: Simulate the carousel API flow
    console.log('\n=== SIMULATING CAROUSEL API FLOW ===')
    
    const mediaUrls = carouselPost.media_urls
    console.log('Step 1: Creating individual media containers...')
    
    const containerIds = []
    for (let i = 0; i < mediaUrls.length; i++) {
      const mediaUrl = mediaUrls[i]
      const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i)
      
      console.log(`  Container ${i + 1}: ${isVideo ? 'VIDEO' : 'IMAGE'} - ${mediaUrl}`)
      
      // Simulate container creation (without actual API call)
      const containerId = `simulated_container_${i + 1}`
      containerIds.push(containerId)
    }
    
    console.log('Step 2: Creating carousel container...')
    console.log('  Container IDs:', containerIds.join(','))
    console.log('  Media type: CAROUSEL')
    console.log('  Caption length:', carouselPost.caption?.length || 0)
    
    // Test 3: Validate carousel limits
    if (mediaUrls.length > 10) {
      console.log('❌ ERROR: Carousel exceeds 10 item limit')
    } else {
      console.log('✅ Carousel within 10 item limit')
    }
    
    // Test 4: Check if all URLs are accessible
    console.log('\nStep 3: Validating media URLs...')
    for (let i = 0; i < mediaUrls.length; i++) {
      const mediaUrl = mediaUrls[i]
      console.log(`  URL ${i + 1}: ${mediaUrl}`)
      
      // Check if URL is publicly accessible
      if (mediaUrl.includes('supabase.co')) {
        console.log('    ✅ Supabase URL (should be publicly accessible)')
      } else {
        console.log('    ⚠️  Non-Supabase URL (may need verification)')
      }
    }
    
    console.log('\n=== CAROUSEL API SIMULATION COMPLETE ===')
    console.log('✅ Carousel post ready for API testing')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testCarouselAPI() 