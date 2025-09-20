require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMediaFiles() {
  try {
    console.log('🔍 Checking all media files...')
    
    const { data: mediaFiles, error } = await supabase
      .from('media')
      .select('*')
      .like('mime_type', 'video/%')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching media files:', error)
      return
    }
    
    console.log(`📁 Found ${mediaFiles.length} video files:`)
    
    mediaFiles.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.file_name}`)
      console.log(`   Path: ${file.file_path}`)
      console.log(`   Metadata:`, file.metadata)
      console.log(`   Created: ${file.created_at}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkMediaFiles()
