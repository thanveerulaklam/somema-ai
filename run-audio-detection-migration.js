const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runAudioDetectionMigration() {
  try {
    console.log('🚀 Starting audio detection migration...')
    
    // Get all video files that don't have audio detection metadata
    const { data: videos, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .like('mime_type', 'video/%')
      .or('metadata->audioChecked.is.null,metadata->audioChecked.eq.false')

    if (fetchError) {
      console.error('❌ Error fetching videos:', fetchError)
      return
    }

    console.log(`📊 Found ${videos?.length || 0} videos without audio detection`)
    
    if (!videos || videos.length === 0) {
      console.log('✅ All videos already have audio detection metadata')
      return
    }

    // Update each video with audio detection metadata
    for (const video of videos) {
      const { error: updateError } = await supabase
        .from('media')
        .update({
          metadata: {
            ...video.metadata,
            audioDetected: false,
            audioChecked: false
          }
        })
        .eq('id', video.id)

      if (updateError) {
        console.error(`❌ Error updating video ${video.file_name}:`, updateError)
      } else {
        console.log(`✅ Updated video: ${video.file_name}`)
      }
    }

    console.log('✅ Audio detection migration completed successfully')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runAudioDetectionMigration()
