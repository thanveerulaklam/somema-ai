const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...')
    
    // Check if there are any users with media
    const { data: usersWithMedia, error: userError } = await supabase
      .from('media')
      .select('user_id, file_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (userError) {
      console.error('❌ Error fetching users with media:', userError)
      return
    }

    console.log(`📊 Users with media: ${usersWithMedia?.length || 0}`)
    
    if (usersWithMedia && usersWithMedia.length > 0) {
      console.log('\n👤 Users found:')
      const uniqueUsers = [...new Set(usersWithMedia.map(item => item.user_id))]
      uniqueUsers.forEach((userId, index) => {
        const userMedia = usersWithMedia.filter(item => item.user_id === userId)
        console.log(`\n${index + 1}. User ID: ${userId}`)
        console.log(`   - Media files: ${userMedia.length}`)
        userMedia.forEach(media => {
          console.log(`     - ${media.file_name} (${media.created_at})`)
        })
      })
    } else {
      console.log('❌ No users with media found')
    }
    
    // Check if there are any media files at all (without user filter)
    const { data: allMedia, error: allMediaError } = await supabase
      .from('media')
      .select('*')

    if (allMediaError) {
      console.error('❌ Error fetching all media:', allMediaError)
      return
    }

    console.log(`\n📊 Total media files in database: ${allMedia?.length || 0}`)
    
    if (allMedia && allMedia.length > 0) {
      console.log('\n📄 All media files:')
      allMedia.forEach((item, index) => {
        console.log(`${index + 1}. ${item.file_name} (User: ${item.user_id})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error)
  }
}

testAuth()
