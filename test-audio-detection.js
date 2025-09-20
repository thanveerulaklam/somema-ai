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

async function testAudioDetection() {
  try {
    console.log('🔍 Testing audio detection...')
    
    // Get all video files
    const { data: videos, error } = await supabase
      .from('media')
      .select('*')
      .like('mime_type', 'video/%')

    if (error) {
      console.error('❌ Error fetching videos:', error)
      return
    }

    console.log(`📊 Found ${videos?.length || 0} video files`)
    
    if (videos && videos.length > 0) {
      videos.forEach((video, index) => {
        console.log(`\n📹 Video ${index + 1}: ${video.file_name}`)
        console.log(`   - MIME Type: ${video.mime_type}`)
        console.log(`   - File Size: ${video.file_size} bytes`)
        console.log(`   - Metadata:`, video.metadata)
        
        if (video.metadata?.audioChecked) {
          console.log(`   - Audio Detected: ${video.metadata.audioDetected ? '✅ Yes' : '❌ No'}`)
        } else {
          console.log(`   - Audio Status: ⏳ Not checked yet`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAudioDetection()
