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

async function testAllMedia() {
  try {
    console.log('🔍 Testing all media files...')
    
    // Get all media files
    const { data: media, error } = await supabase
      .from('media')
      .select('*')

    if (error) {
      console.error('❌ Error fetching media:', error)
      return
    }

    console.log(`📊 Found ${media?.length || 0} media files`)
    
    if (media && media.length > 0) {
      media.forEach((item, index) => {
        console.log(`\n📄 Media ${index + 1}: ${item.file_name}`)
        console.log(`   - MIME Type: ${item.mime_type}`)
        console.log(`   - File Size: ${item.file_size} bytes`)
        console.log(`   - URL: ${item.file_path}`)
        console.log(`   - Metadata:`, item.metadata)
        
        if (item.mime_type?.startsWith('video/')) {
          console.log(`   - Type: 🎥 VIDEO`)
          if (item.metadata?.audioChecked) {
            console.log(`   - Audio Detected: ${item.metadata.audioDetected ? '✅ Yes' : '❌ No'}`)
          } else {
            console.log(`   - Audio Status: ⏳ Not checked yet`)
          }
        } else if (item.mime_type?.startsWith('image/')) {
          console.log(`   - Type: 🖼️ IMAGE`)
        } else {
          console.log(`   - Type: 📁 FILE`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAllMedia()
