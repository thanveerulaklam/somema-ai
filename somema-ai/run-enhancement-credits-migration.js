// Run enhancement credits migration
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting enhancement credits migration...')
    
    // Read the migration SQL
    const migrationSQL = fs.readFileSync('./add-enhancement-credits.sql', 'utf8')
    
    console.log('📝 Running migration SQL...')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      return
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Verify the migration
    console.log('🔍 Verifying migration...')
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .eq('column_name', 'image_enhancement_credits')
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
      return
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Verification successful!')
      console.log('📊 Column details:', columns[0])
    } else {
      console.log('⚠️  Column not found in verification')
    }
    
    // Check existing users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, image_enhancement_credits')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Failed to check users:', usersError)
      return
    }
    
    console.log('👥 Sample users with credits:', users)
    
  } catch (error) {
    console.error('❌ Migration script failed:', error)
  }
}

runMigration()
