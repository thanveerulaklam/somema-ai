require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAudioDetection() {
  try {
    console.log('🔧 Fixing audio detection for video...')
    
    // Find the specific video that's missing audioDetected
    const videoUrl = 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1756281229607-xvlu9.mp4'
    
    const { data: mediaFile, error } = await supabase
      .from('media')
      .select('*')
      .eq('file_path', videoUrl)
      .single()
    
    if (error) {
      console.error('❌ Error fetching media file:', error)
      return
    }
    
    console.log('📁 Found media file:', mediaFile.file_name)
    console.log('📊 Current metadata:', mediaFile.metadata)
    
    // Update the metadata to include audioDetected: true
    const updatedMetadata = {
      ...mediaFile.metadata,
      audioDetected: true,
      audioChecked: true,
      lastModified: Date.now()
    }
    
    console.log('📊 Updated metadata:', updatedMetadata)
    
    const { error: updateError } = await supabase
      .from('media')
      .update({ metadata: updatedMetadata })
      .eq('id', mediaFile.id)
    
    if (updateError) {
      console.error('❌ Error updating media file:', updateError)
      return
    }
    
    console.log('✅ Successfully updated audio detection for video!')
    console.log('🎵 Video now has audioDetected: true')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixAudioDetection()
