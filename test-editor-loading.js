// Test editor loading logic
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testEditorLoading() {
  try {
    console.log('=== TESTING EDITOR LOADING ===')
    
    const postId = 'a5ae53f3-99f3-46e1-8140-9cc8da9cf055'
    
    // Simulate the editor loading logic
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
    
    console.log('Raw post data from database:')
    console.log('  - ID:', post.id)
    console.log('  - Media URL:', post.media_url)
    console.log('  - Media URLs:', post.media_urls)
    console.log('  - Media URLs length:', post.media_urls?.length || 0)
    
    // Simulate the editor's data processing
    const editorData = {
      imageUrl: post.media_url || '',
      imageUrls: post.media_urls || [],
      caption: post.caption || '',
      hashtags: post.hashtags || [],
      textElements: { headline: post.text_elements?.headline || '' },
      businessContext: post.business_context || '',
      platform: post.platform || 'instagram',
      theme: post.theme || 'product'
    }
    
    console.log('\nProcessed editor data:')
    console.log('  - imageUrl:', editorData.imageUrl)
    console.log('  - imageUrls:', editorData.imageUrls)
    console.log('  - imageUrls length:', editorData.imageUrls?.length || 0)
    console.log('  - Is carousel:', (editorData.imageUrls?.length || 0) > 1)
    
    // Simulate the render conditions
    console.log('\nRender conditions:')
    console.log('  - Has imageUrls:', !!editorData.imageUrls)
    console.log('  - imageUrls.length > 0:', (editorData.imageUrls?.length || 0) > 0)
    console.log('  - Should show carousel section:', editorData.imageUrls && editorData.imageUrls.length > 0)
    console.log('  - Should show thumbnail row:', editorData.imageUrls && editorData.imageUrls.length > 0)
    console.log('  - Should show carousel indicator:', editorData.imageUrls && editorData.imageUrls.length > 1)
    
    if (editorData.imageUrls && editorData.imageUrls.length > 0) {
      console.log('\n✅ Should render carousel preview with:')
      console.log('  - Main preview image:', editorData.imageUrls[0])
      console.log('  - Thumbnail row with', editorData.imageUrls.length, 'images')
      if (editorData.imageUrls.length > 1) {
        console.log('  - Carousel indicator showing', editorData.imageUrls.length, 'images')
      }
    } else {
      console.log('\n❌ No carousel data to render')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testEditorLoading() 