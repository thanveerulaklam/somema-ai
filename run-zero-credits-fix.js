// Fix existing users with zero post generation credits
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

async function fixZeroCredits() {
  try {
    console.log('🚀 Starting zero credits fix migration...')
    
    // First, let's check current state
    console.log('📊 Checking current user credits state...')
    
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, post_generation_credits, image_enhancement_credits, subscription_plan')
    
    if (profileError) {
      console.error('❌ Error fetching user profiles:', profileError)
      return
    }
    
    const zeroCreditUsers = userProfiles?.filter(user => 
      user.post_generation_credits === 0 || user.post_generation_credits === null
    ) || []
    
    console.log(`📈 Found ${userProfiles?.length || 0} total users`)
    console.log(`⚠️  Found ${zeroCreditUsers.length} users with zero post generation credits`)
    
    if (zeroCreditUsers.length === 0) {
      console.log('✅ No users with zero credits found. Migration not needed.')
      return
    }
    
    // Show which users will be updated
    console.log('👥 Users that will be updated:')
    zeroCreditUsers.forEach(user => {
      console.log(`  - User ID: ${user.user_id}, Current credits: ${user.post_generation_credits || 0}, Plan: ${user.subscription_plan || 'unknown'}`)
    })
    
    // Read and execute the migration SQL
    console.log('📝 Running migration SQL...')
    const migrationSQL = fs.readFileSync('./fix-zero-post-credits.sql', 'utf8')
    
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      return
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Verify the fix
    console.log('🔍 Verifying the fix...')
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('user_profiles')
      .select('user_id, post_generation_credits, image_enhancement_credits, subscription_plan')
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
      return
    }
    
    const stillZeroCredits = updatedProfiles?.filter(user => 
      user.post_generation_credits === 0 || user.post_generation_credits === null
    ) || []
    
    const defaultCreditsUsers = updatedProfiles?.filter(user => 
      user.post_generation_credits === 15
    ) || []
    
    console.log('📊 Migration Results:')
    console.log(`  - Total users: ${updatedProfiles?.length || 0}`)
    console.log(`  - Users with default credits (15): ${defaultCreditsUsers.length}`)
    console.log(`  - Users still with zero credits: ${stillZeroCredits.length}`)
    
    if (stillZeroCredits.length === 0) {
      console.log('🎉 All users now have proper default credits!')
    } else {
      console.log('⚠️  Some users still have zero credits:')
      stillZeroCredits.forEach(user => {
        console.log(`  - User ID: ${user.user_id}, Credits: ${user.post_generation_credits || 0}, Plan: ${user.subscription_plan || 'unknown'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error)
  }
}

// Run the migration
fixZeroCredits()
