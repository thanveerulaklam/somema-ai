// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testScheduledPosts() {
  console.log('🔍 Testing Scheduled Posts...')
  
  try {
    // Check all posts
    const { data: allPosts, error: allError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (allError) {
      console.error('Error fetching posts:', allError)
      return
    }
    
    console.log('\n📋 All Posts:')
    allPosts?.forEach(post => {
      console.log(`- ID: ${post.id}`)
      console.log(`  Status: ${post.status}`)
      console.log(`  Scheduled for: ${post.scheduled_for}`)
      console.log(`  Platform: ${post.platform}`)
      console.log(`  User ID: ${post.user_id}`)
      console.log('  ---')
    })
    
    // Check scheduled posts specifically
    const { data: scheduledPosts, error: scheduledError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
    
    if (scheduledError) {
      console.error('Error fetching scheduled posts:', scheduledError)
      return
    }
    
    console.log('\n⏰ Scheduled Posts:')
    if (scheduledPosts?.length === 0) {
      console.log('No scheduled posts found.')
    } else {
      scheduledPosts.forEach(post => {
        console.log(`- ID: ${post.id}`)
        console.log(`  Scheduled for: ${post.scheduled_for}`)
        console.log(`  Platform: ${post.platform}`)
        console.log(`  User ID: ${post.user_id}`)
        
        // Check if scheduled time has passed
        const scheduledTime = new Date(post.scheduled_for)
        const now = new Date()
        const isOverdue = scheduledTime < now
        
        console.log(`  Is overdue: ${isOverdue}`)
        console.log(`  Time difference: ${(now - scheduledTime) / 1000} seconds`)
        console.log('  ---')
      })
}

    // Check user profiles with Meta credentials
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, meta_credentials')
      .not('meta_credentials', 'is', null)
    
    if (profileError) {
      console.error('Error fetching user profiles:', profileError)
      return
    }
    
    console.log('\n👤 Users with Meta Credentials:')
    userProfiles?.forEach(profile => {
      console.log(`- User ID: ${profile.user_id}`)
      console.log(`  Has credentials: ${!!profile.meta_credentials}`)
      if (profile.meta_credentials?.pages) {
        console.log(`  Connected pages: ${profile.meta_credentials.pages.length}`)
      }
      console.log('  ---')
    })
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testScheduledPosts() 