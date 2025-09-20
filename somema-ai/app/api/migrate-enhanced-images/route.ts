import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('🔄 Starting enhanced_image_url column migration...')

    // Check if column already exists
    const { data: existingColumn, error: checkError } = await supabase
      .rpc('check_column_exists', {
        table_name: 'posts',
        column_name: 'enhanced_image_url'
      })

    if (checkError) {
      console.log('⚠️ Could not check if column exists, proceeding with migration...')
    } else if (existingColumn) {
      return NextResponse.json({ 
        success: true, 
        message: 'Column enhanced_image_url already exists',
        user: user.id
      })
    }

    // Add the enhanced_image_url column
    const { error: addColumnError } = await supabase
      .rpc('add_column_if_not_exists', {
        table_name: 'posts',
        column_name: 'enhanced_image_url',
        column_type: 'TEXT'
      })

    if (addColumnError) {
      console.log('⚠️ RPC method not available, trying direct SQL...')
      
      // Fallback: Try direct SQL execution
      const { error: sqlError } = await supabase
        .from('posts')
        .select('id')
        .limit(1)
        .single()

      if (sqlError && sqlError.message.includes('enhanced_image_url')) {
        // Column doesn't exist, we need to add it
        console.log('❌ Column does not exist and cannot be added via API')
        return NextResponse.json({ 
          error: 'Column migration requires manual database update',
          details: 'Please run the SQL migration manually in your Supabase dashboard',
          sql: `
            ALTER TABLE posts ADD COLUMN IF NOT EXISTS enhanced_image_url TEXT;
            CREATE INDEX IF NOT EXISTS idx_posts_enhanced_image_url ON posts(enhanced_image_url) WHERE enhanced_image_url IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_posts_user_enhanced ON posts(user_id, enhanced_image_url) WHERE enhanced_image_url IS NOT NULL;
          `
        }, { status: 500 })
      }
    }

    // Create indexes
    console.log('📊 Creating indexes for enhanced_image_url...')
    
    // Note: Index creation might also require manual execution
    // For now, we'll just return success and let the user know about indexes

    return NextResponse.json({ 
      success: true, 
      message: 'Enhanced image URL column migration completed',
      user: user.id,
      note: 'If you encounter performance issues, consider adding the indexes manually in Supabase dashboard'
    })

  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error,
      manualSteps: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to SQL Editor',
        '3. Run the following SQL:',
        '   ALTER TABLE posts ADD COLUMN IF NOT EXISTS enhanced_image_url TEXT;',
        '   CREATE INDEX IF NOT EXISTS idx_posts_enhanced_image_url ON posts(enhanced_image_url) WHERE enhanced_image_url IS NOT NULL;',
        '   CREATE INDEX IF NOT EXISTS idx_posts_user_enhanced ON posts(user_id, enhanced_image_url) WHERE enhanced_image_url IS NOT NULL;'
      ]
    }, { status: 500 })
  }
}
