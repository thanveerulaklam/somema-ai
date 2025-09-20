// Migrate single image posts to have media_urls array
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateSinglePosts() {
  try {
    console.log('=== MIGRATING SINGLE IMAGE POSTS ===')
    
    // Find all posts that have media_url but empty or missing media_urls
    const { data: postsToMigrate, error } = await supabase
      .from('posts')
      .select('id, media_url, media_urls')
      .not('media_url', 'is', null)
      .or('media_urls.is.null,media_urls.eq.[]')
    
    if (error) {
      console.error('Error fetching posts to migrate:', error)
      return
    }
    
    console.log(`Found ${postsToMigrate.length} posts to migrate`)
    
    if (postsToMigrate.length === 0) {
      console.log('No posts need migration')
      return
    }
    
    // Migrate each post
    for (const post of postsToMigrate) {
      console.log(`\nMigrating post ${post.id}:`)
      console.log(`  - media_url: ${post.media_url}`)
      console.log(`  - current media_urls: ${post.media_urls}`)
      
      // Update the post to have media_urls array with the single image
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          media_urls: [post.media_url]
        })
        .eq('id', post.id)
      
      if (updateError) {
        console.error(`  ❌ Error updating post ${post.id}:`, updateError)
      } else {
        console.log(`  ✅ Successfully migrated post ${post.id}`)
      }
    }
    
    console.log('\n=== MIGRATION COMPLETE ===')
    
    // Verify the migration
    console.log('\n=== VERIFYING MIGRATION ===')
    const { data: verifyPosts, error: verifyError } = await supabase
      .from('posts')
      .select('id, media_url, media_urls')
      .limit(5)
    
    if (verifyError) {
      console.error('Error verifying migration:', verifyError)
    } else {
      console.log('Sample posts after migration:')
      verifyPosts.forEach((p, index) => {
        console.log(`Post ${index + 1}:`, {
          id: p.id,
          media_url: p.media_url,
          media_urls: p.media_urls,
          media_urls_length: p.media_urls?.length || 0
        })
      })
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

migrateSinglePosts() 