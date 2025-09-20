const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testScheduledInstagramFallback() {
  console.log('🧪 Testing Scheduled Instagram Fallback...')
  
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
    
    // Create a test scheduled post for 2 minutes from now
    const scheduledTime = new Date(Date.now() + 2 * 60 * 1000).toISOString()
    console.log('Scheduling for:', scheduledTime)
    
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.user_id,
        caption: 'Test scheduled Instagram post with fallback mechanism',
        hashtags: ['test', 'scheduled', 'fallback', 'instagram'],
        platform: 'instagram',
        status: 'scheduled',
        scheduled_for: scheduledTime,
        page_id: '1696602057019472',
        media_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=800&fit=crop'
      })
      .select()
      .single()
    
    if (postError) {
      console.error('Failed to create test post:', postError)
      return
    }
    
    console.log('✅ Test scheduled post created:')
    console.log('ID:', post.id)
    console.log('Status:', post.status)
    console.log('Scheduled for:', post.scheduled_for)
    console.log('Platform:', post.platform)
    console.log('Page ID:', post.page_id)
    
    console.log('\n⏰ Waiting 2 minutes for cron job to process...')
    
    // Wait 2 minutes
    await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000))
    
    // Check post status after cron job
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post.id)
      .single()
    
    if (updateError) {
      console.error('Failed to get updated post:', updateError)
      return
    }
    
    console.log('\n📊 Post after 2 minutes:')
    console.log('Status:', updatedPost.status)
    console.log('Posted at:', updatedPost.posted_at)
    console.log('Meta post ID:', updatedPost.meta_post_id)
    console.log('Meta post IDs:', updatedPost.meta_post_ids)
    console.log('Meta error:', updatedPost.meta_error)
    console.log('Meta errors:', updatedPost.meta_errors)
    
    if (updatedPost.status === 'scheduled') {
      console.log('⏳ Still scheduled - cron job may not have run yet.')
      console.log('Manually triggering cron job...')
      
      // Manually trigger cron job
      const response = await fetch('http://localhost:3000/api/cron/post-scheduler', {
        method: 'POST'
      })
      
      const result = await response.json()
      console.log('Cron job result:', JSON.stringify(result, null, 2))
      
      // Check post status again
      const { data: finalPost, error: finalError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', post.id)
        .single()
      
      if (!finalError) {
        console.log('\n📊 Final post status:')
        console.log('Status:', finalPost.status)
        console.log('Posted at:', finalPost.posted_at)
        console.log('Meta post ID:', finalPost.meta_post_id)
        console.log('Meta error:', finalPost.meta_error)
        
        if (finalPost.status === 'published') {
          console.log('🎉 SUCCESS! Instagram fallback worked!')
        } else if (finalPost.status === 'failed') {
          console.log('❌ FAILED! Instagram fallback did not work.')
          console.log('Error:', finalPost.meta_error)
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testScheduledInstagramFallback() 