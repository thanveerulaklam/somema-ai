const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInstagramSchedulingFix() {
  console.log('🧪 Testing Instagram Scheduling Fix...')
  
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
    
    // Schedule a test post for 2 minutes from now (both platforms)
    const scheduledTime = new Date(Date.now() + 2 * 60 * 1000).toISOString()
    console.log('Scheduling for:', scheduledTime)
    
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.user_id,
        caption: 'Test scheduled post from Quely app - Testing Instagram scheduling fix! 🎉',
        hashtags: ['test', 'quely', 'instagram', 'scheduling'],
        platform: 'both', // Both Facebook and Instagram
        status: 'scheduled',
        scheduled_for: scheduledTime,
        page_id: page.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating test post:', error)
      return
    }
    
    console.log('✅ Test scheduled post created:')
    console.log('ID:', post.id)
    console.log('Status:', post.status)
    console.log('Scheduled for:', post.scheduled_for)
    console.log('Platform:', post.platform)
    console.log('Page ID:', post.page_id)
    
    // Wait 2 minutes and check if it gets processed
    console.log('\n⏰ Waiting 2 minutes for cron job to process...')
    setTimeout(async () => {
      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', post.id)
        .single()
      
      if (updateError) {
        console.error('Error fetching updated post:', updateError)
        return
      }
      
      console.log('\n📊 Post after 2 minutes:')
      console.log('Status:', updatedPost.status)
      console.log('Posted at:', updatedPost.posted_at)
      console.log('Meta post ID:', updatedPost.meta_post_id)
      console.log('Meta post IDs:', updatedPost.meta_post_ids)
      console.log('Meta error:', updatedPost.meta_error)
      console.log('Meta errors:', updatedPost.meta_errors)
      
      if (updatedPost.status === 'published') {
        console.log('🎉 SUCCESS! Scheduled post was published to both platforms!')
        if (updatedPost.meta_post_ids) {
          console.log('Facebook Post ID:', updatedPost.meta_post_ids.facebook)
          console.log('Instagram Post ID:', updatedPost.meta_post_ids.instagram)
        }
      } else if (updatedPost.status === 'failed') {
        console.log('❌ FAILED! Check the errors above.')
        if (updatedPost.meta_errors) {
          console.log('Facebook error:', updatedPost.meta_errors.facebook)
          console.log('Instagram error:', updatedPost.meta_errors.instagram)
        }
      } else {
        console.log('⏳ Still scheduled - cron job may not have run yet.')
      }
      
    }, 2 * 60 * 1000)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testInstagramSchedulingFix() 