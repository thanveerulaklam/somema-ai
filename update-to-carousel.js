// Update an existing post to be a carousel
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateToCarousel() {
  try {
    console.log('=== UPDATING POST TO CAROUSEL ===')
    
    // Update the specific post from the URL to be a carousel
    const postId = 'a5ae53f3-99f3-46e1-8140-9cc8da9cf055'
    
    // Multiple image URLs for carousel
    const carouselImages = [
      'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1753331199121-lbyht.jpg',
      'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/7c12a35b-353c-43ff-808b-f1c574df69e0/1753079531738-nk7mzr.jpeg',
      'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/7c12a35b-353c-43ff-808b-f1c574df69e0/1752915133771-rdj2eg.webp'
    ]
    
    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        media_urls: carouselImages
      })
      .eq('id', postId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating post:', error)
      return
    }
    
    console.log('✅ Post updated to carousel successfully!')
    console.log('Post ID:', updatedPost.id)
    console.log('Media URLs count:', updatedPost.media_urls?.length || 0)
    console.log('Media URLs:', updatedPost.media_urls)
    console.log('\n=== TEST RESULTS ===')
    console.log('✅ Should show carousel badge: 3 images')
    console.log('✅ Should show in drafts list with badge')
    console.log('✅ Should show carousel preview in editor')
    console.log('\nNow check:')
    console.log('1. Posts page: http://localhost:3000/posts?status=draft')
    console.log('2. Editor page: http://localhost:3000/posts/editor?postId=' + postId)
    
  } catch (error) {
    console.error('Update failed:', error)
  }
}

updateToCarousel() 