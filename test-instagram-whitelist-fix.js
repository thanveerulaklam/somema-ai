const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInstagramWhitelistFix() {
  console.log('🧪 Testing Instagram Whitelist Fix...')
  
  try {
    // Get the most recent user with Meta credentials
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, meta_credentials')
      .not('meta_credentials', 'is', null)
      .limit(1)
    
    if (userError || !users || users.length === 0) {
      console.error('No users with Meta credentials found')
      return
    }
    
    const user = users[0]
    console.log('Using user ID:', user.user_id)
    
    const credentials = user.meta_credentials
    console.log('Meta credentials found:', !!credentials)
    
    if (!credentials.pages || credentials.pages.length === 0) {
      console.error('No Facebook pages found')
      return
    }
    
    const page = credentials.pages[0]
    console.log('Using Facebook page:', page.name)
    console.log('Page ID:', page.id)
    console.log('Has access token:', !!page.access_token)
    
    if (!page.instagram_accounts || page.instagram_accounts.length === 0) {
      console.error('No Instagram accounts found for this page')
      return
    }
    
    const instagramAccount = page.instagram_accounts[0]
    console.log('Instagram account ID:', instagramAccount.id)
    console.log('Instagram username:', instagramAccount.username)
    
    // Test Instagram posting with a simple text post (no media)
    console.log('\n📝 Testing Instagram text post...')
    
    const testPostData = {
      caption: 'Test post from Quely app - Testing whitelist fix',
      hashtags: ['test', 'quely', 'instagram'],
      mediaUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=800&fit=crop', // Add a valid image URL
      scheduledTime: null // Immediate post
    }
    
    // Make the API call to test Instagram posting
    const response = await fetch('http://localhost:3003/api/meta/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.user_id}`
      },
      body: JSON.stringify({
        caption: testPostData.caption,
        hashtags: testPostData.hashtags,
        mediaUrl: testPostData.mediaUrl,
        platform: 'instagram',
        selectedPageId: page.id
      })
    })
    
    const result = await response.json()
    console.log('\n📊 Instagram Post Result:')
    console.log('Status:', response.status)
    console.log('Success:', result.success)
    console.log('Error:', result.error)
    console.log('Result:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('🎉 SUCCESS! Instagram post was published!')
      console.log('Post ID:', result.result?.postId)
    } else {
      console.log('❌ FAILED! Instagram post failed.')
      console.log('Error:', result.error)
      
      // Check if it's a whitelist error
      if (result.error && result.error.includes('whitelist')) {
        console.log('\n🔧 WHITELIST ERROR DETECTED')
        console.log('This means your Instagram account needs to be whitelisted by Meta.')
        console.log('Solutions:')
        console.log('1. Contact Meta support to whitelist your Instagram account')
        console.log('2. Use Facebook posting instead (which works perfectly)')
        console.log('3. Try posting immediately instead of scheduling')
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testInstagramWhitelistFix() 