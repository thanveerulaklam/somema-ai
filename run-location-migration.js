const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runLocationMigration() {
  try {
    console.log('🚀 Starting location fields migration...')
    
    // Read the SQL migration file
    const fs = require('fs')
    const sql = fs.readFileSync('./add-location-fields.sql', 'utf8')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      return
    }
    
    console.log('✅ Location fields migration completed successfully!')
    console.log('Added columns: city, state, country to user_profiles table')
    
    // Verify the new columns exist
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'user_profiles')
      .in('column_name', ['city', 'state', 'country'])
    
    if (columnError) {
      console.error('❌ Error verifying columns:', columnError)
      return
    }
    
    console.log('\n📋 New columns added:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runLocationMigration()
