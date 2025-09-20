// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFacebookPost() {
  console.log('🧪 Testing Facebook Post...')
  
  try {
    // Get a user with Meta credentials
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, meta_credentials')
      .not('meta_credentials', 'is', null)
      .limit(1)
    
    if (profileError || !userProfiles || userProfiles.length === 0) {
      console.error('No users with Meta credentials found')
      return
    }
    
    const userProfile = userProfiles[0]
    console.log('Testing with user:', userProfile.user_id)
    
    // Create a test post
    const testPost = {
      user_id: userProfile.user_id,
      caption: '🧪 Test post from Somema - Testing Facebook posting functionality! #TestPost #Somema',
      hashtags: ['#TestPost', '#Somema', '#FacebookTest'],
      platform: 'facebook',
      status: 'scheduled',
      scheduled_for: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
      created_at: new Date().toISOString()
    }
    
    console.log('Creating test post...')
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(testPost)
      .select()
      .single()
    
    if (postError) {
      console.error('Failed to create test post:', postError)
      return
    }
    
    console.log('✅ Test post created:', post.id)
    console.log('Scheduled for:', testPost.scheduled_for)
    console.log('Status:', post.status)
    
    console.log('\n📋 Next Steps:')
    console.log('1. Wait 2 minutes for the cron job to process this post')
    console.log('2. Check your Facebook page for the test post')
    console.log('3. If it works, use this approach for your screencast')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testFacebookPost() 