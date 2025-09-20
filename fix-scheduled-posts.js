// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixScheduledPosts() {
  console.log('🔧 Fixing Scheduled Posts...')
  
  try {
    // Find posts that have scheduled_for dates but status is not 'scheduled'
    const { data: postsToFix, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .not('scheduled_for', 'is', null)
      .neq('status', 'scheduled')
      .neq('status', 'published')
      .neq('status', 'failed')
    
    if (fetchError) {
      console.error('Error fetching posts to fix:', fetchError)
      return
    }
    
    console.log(`Found ${postsToFix?.length || 0} posts that need to be fixed:`)
    
    if (postsToFix && postsToFix.length > 0) {
      for (const post of postsToFix) {
        console.log(`- ID: ${post.id}`)
        console.log(`  Current status: ${post.status}`)
        console.log(`  Scheduled for: ${post.scheduled_for}`)
        console.log(`  Platform: ${post.platform}`)
        
        // Check if the scheduled time has passed
        const scheduledTime = new Date(post.scheduled_for)
        const now = new Date()
        const isOverdue = scheduledTime < now
        
        console.log(`  Is overdue: ${isOverdue}`)
        
        // Update the post status to 'scheduled'
        const { error: updateError } = await supabase
          .from('posts')
          .update({ 
            status: 'scheduled',
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id)
        
        if (updateError) {
          console.error(`  ❌ Failed to update post ${post.id}:`, updateError.message)
        } else {
          console.log(`  ✅ Updated post ${post.id} to status 'scheduled'`)
        }
        
        console.log('  ---')
      }
    } else {
      console.log('No posts need to be fixed.')
    }
    
    // Now check for posts that are overdue and should be published
    console.log('\n⏰ Checking for overdue posts...')
    const now = new Date().toISOString()
    const { data: overduePosts, error: overdueError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
    
    if (overdueError) {
      console.error('Error fetching overdue posts:', overdueError)
      return
    }
    
    console.log(`Found ${overduePosts?.length || 0} overdue posts:`)
    
    if (overduePosts && overduePosts.length > 0) {
      for (const post of overduePosts) {
        console.log(`- ID: ${post.id}`)
        console.log(`  Scheduled for: ${post.scheduled_for}`)
        console.log(`  Platform: ${post.platform}`)
        console.log(`  User ID: ${post.user_id}`)
        
        const scheduledTime = new Date(post.scheduled_for)
        const now = new Date()
        const timeDiff = (now - scheduledTime) / 1000 / 60 // minutes
        
        console.log(`  Overdue by: ${timeDiff.toFixed(1)} minutes`)
        console.log('  ---')
      }
    }
    
    console.log('\n✅ Fix completed!')
    console.log('Next steps:')
    console.log('1. The cron job should now pick up the fixed posts')
    console.log('2. Check your social media accounts for the posts')
    console.log('3. Monitor the cron job logs for any errors')
    
  } catch (error) {
    console.error('Fix failed:', error)
  }
}

fixScheduledPosts() 