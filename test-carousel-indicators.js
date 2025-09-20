// Test carousel indicators on posts list
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCarouselIndicators() {
  try {
    console.log('=== TESTING CAROUSEL INDICATORS ===')
    
    // Get all posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, caption, media_url, media_urls, status')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching posts:', error)
      return
    }
    
    console.log(`Found ${posts.length} posts`)
    
    posts.forEach((post, index) => {
      const isCarousel = post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 1
      const hasMedia = (post.media_urls && post.media_urls.length > 0) || (post.media_url && post.media_url.trim() !== '')
      
      console.log(`\nPost ${index + 1}:`)
      console.log(`  ID: ${post.id}`)
      console.log(`  Status: ${post.status}`)
      console.log(`  Has media: ${hasMedia}`)
      console.log(`  Is carousel: ${isCarousel}`)
      console.log(`  Media URLs count: ${post.media_urls?.length || 0}`)
      console.log(`  Media URL: ${post.media_url ? 'Present' : 'None'}`)
      
      if (isCarousel) {
        console.log(`  ✅ Should show carousel badge: ${post.media_urls.length} images`)
      } else if (hasMedia) {
        console.log(`  📷 Single image post`)
      } else {
        console.log(`  ❌ No media`)
      }
    })
    
    // Count carousel posts
    const carouselPosts = posts.filter(post => 
      post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 1
    )
    
    console.log(`\n=== SUMMARY ===`)
    console.log(`Total posts: ${posts.length}`)
    console.log(`Carousel posts: ${carouselPosts.length}`)
    console.log(`Single image posts: ${posts.length - carouselPosts.length}`)
    
    if (carouselPosts.length > 0) {
      console.log(`\nCarousel posts should show badges:`)
      carouselPosts.forEach((post, index) => {
        console.log(`  ${index + 1}. Post ${post.id}: ${post.media_urls.length} images`)
      })
    } else {
      console.log(`\n⚠️  No carousel posts found. All posts are single images.`)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testCarouselIndicators() 