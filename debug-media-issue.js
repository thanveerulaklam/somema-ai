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

async function debugMediaIssue() {
  try {
    console.log('🔍 Debugging media issue...')
    console.log('📊 Supabase URL:', supabaseUrl)
    console.log('🔑 Anon Key available:', !!supabaseAnonKey)
    
    // Check if we can connect to Supabase
    const { data, error } = await supabase
      .from('media')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Database connection error:', error)
      return
    }

    console.log('✅ Database connection successful')
    
    // Get all media files without user filter
    const { data: allMedia, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .limit(10)

    if (mediaError) {
      console.error('❌ Error fetching media:', mediaError)
      return
    }

    console.log(`📊 Total media files in database: ${allMedia?.length || 0}`)
    
    if (allMedia && allMedia.length > 0) {
      console.log('\n📄 Media files found:')
      allMedia.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.file_name}`)
        console.log(`   - User ID: ${item.user_id}`)
        console.log(`   - MIME Type: ${item.mime_type}`)
        console.log(`   - File Size: ${item.file_size} bytes`)
        console.log(`   - Created: ${item.created_at}`)
        console.log(`   - Metadata:`, item.metadata)
      })
    }
    
    // Check if there are any videos specifically
    const { data: videos, error: videoError } = await supabase
      .from('media')
      .select('*')
      .like('mime_type', 'video/%')

    if (videoError) {
      console.error('❌ Error fetching videos:', videoError)
      return
    }

    console.log(`\n🎥 Videos found: ${videos?.length || 0}`)
    
    if (videos && videos.length > 0) {
      videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.file_name}`)
        console.log(`   - Audio checked: ${video.metadata?.audioChecked || false}`)
        console.log(`   - Audio detected: ${video.metadata?.audioDetected || 'unknown'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugMediaIssue()
