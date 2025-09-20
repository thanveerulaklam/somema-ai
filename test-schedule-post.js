const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testSchedulePost() {
  console.log('🧪 Testing Post Scheduling...')
  
  try {
    // Get the most recent user
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1)
    
    if (userError || !users || users.length === 0) {
      console.error('No users found')
      return
    }
    
    const userId = users[0].user_id
    console.log('Using user ID:', userId)
    
    // Schedule a test post for 2 minutes from now
    const scheduledTime = new Date(Date.now() + 2 * 60 * 1000).toISOString()
    console.log('Scheduling for:', scheduledTime)
    
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        caption: 'Test scheduled post from script',
        hashtags: ['test', 'scheduled'],
        platform: 'both',
        status: 'scheduled',
        scheduled_for: scheduledTime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating test post:', error)
      return
    }
    
    console.log('✅ Test post created:')
    console.log('ID:', post.id)
    console.log('Status:', post.status)
    console.log('Scheduled for:', post.scheduled_for)
    console.log('Platform:', post.platform)
    
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
      console.log('Meta error:', updatedPost.meta_error)
      
    }, 2 * 60 * 1000)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testSchedulePost() 