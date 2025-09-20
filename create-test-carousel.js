// Create a test carousel post to demonstrate functionality
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestCarousel() {
  try {
    console.log('=== CREATING TEST CAROUSEL POST ===')
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return
    }
    
    // Create a test carousel post with multiple images
    const testCarouselPost = {
      user_id: user.id,
      caption: "Test carousel post with multiple images! 🎉 This demonstrates our carousel functionality with 3 different images showing various products and styles.",
      hashtags: ['TestCarousel', 'MultipleImages', 'Demo', 'CarouselFeature', 'ProductShowcase'],
      platform: 'instagram',
      status: 'draft',
      media_url: 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1753331199121-lbyht.jpg',
      media_urls: [
        'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1753331199121-lbyht.jpg',
        'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/7c12a35b-353c-43ff-808b-f1c574df69e0/1753079531738-nk7mzr.jpeg',
        'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/7c12a35b-353c-43ff-808b-f1c574df69e0/1752915133771-rdj2eg.webp'
      ],
      text_elements: {
        headline: "Test Carousel Demo",
        subtext: "Multiple images in one post",
        cta: "See more"
      },
      business_context: "Test carousel functionality",
      theme: "product"
    }
    
    const { data: newPost, error } = await supabase
      .from('posts')
      .insert(testCarouselPost)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating test carousel post:', error)
      return
    }
    
    console.log('✅ Test carousel post created successfully!')
    console.log('Post ID:', newPost.id)
    console.log('Media URLs count:', newPost.media_urls?.length || 0)
    console.log('Status:', newPost.status)
    console.log('\n=== TEST RESULTS ===')
    console.log('✅ Should show carousel badge: 3 images')
    console.log('✅ Should show in drafts list with badge')
    console.log('✅ Should show carousel preview in editor')
    console.log('\nCheck the posts page to see the carousel indicator!')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

createTestCarousel() 