const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  try {
    console.log('Running carousel migration...')
    
    // Add media_urls column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'media_urls'
            ) THEN
                ALTER TABLE posts ADD COLUMN media_urls JSONB DEFAULT '[]';
            END IF;
        END $$;
      `
    })
    
    if (alterError) {
      console.error('Error adding column:', alterError)
      return
    }
    
    // Update existing posts to migrate single media_url to media_urls array
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE posts 
        SET media_urls = CASE 
            WHEN media_url IS NOT NULL AND media_url != '' 
            THEN jsonb_build_array(media_url)
            ELSE '[]'::jsonb
        END
        WHERE media_urls IS NULL OR media_urls = '[]'::jsonb;
      `
    })
    
    if (updateError) {
      console.error('Error updating posts:', updateError)
      return
    }
    
    // Create index for better performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_posts_media_urls ON posts USING GIN (media_urls);
      `
    })
    
    if (indexError) {
      console.error('Error creating index:', indexError)
      return
    }
    
    console.log('Carousel migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigration() 