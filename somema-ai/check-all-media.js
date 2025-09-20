require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllMedia() {
  try {
    console.log('🔍 Checking all media files...')
    
    // First, let's see if we can access the media table at all
    const { data: allMedia, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching media files:', error)
      return
    }
    
    console.log(`📁 Found ${allMedia.length} total media files:`)
    
    allMedia.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.file_name}`)
      console.log(`   Type: ${file.mime_type}`)
      console.log(`   Path: ${file.file_path}`)
      console.log(`   Metadata:`, file.metadata)
      console.log(`   User ID: ${file.user_id}`)
      console.log(`   Created: ${file.created_at}`)
    })
    
    // Now check videos specifically
    const videos = allMedia.filter(file => file.mime_type.startsWith('video/'))
    console.log(`\n🎬 Found ${videos.length} video files:`)
    
    videos.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.file_name}`)
      console.log(`   Path: ${file.file_path}`)
      console.log(`   Metadata:`, file.metadata)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAllMedia()
