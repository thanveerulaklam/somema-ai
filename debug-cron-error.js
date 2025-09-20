// Debug Cron Job 500 Error
// This script helps identify what's causing the 500 error

console.log('🔍 Debugging Cron Job 500 Error...\n')

async function testCronEndpoint() {
  try {
    console.log('📡 Testing cron endpoint...')
    
    const response = await fetch('https://somema-ai.vercel.app/api/cron/post-scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`Status: ${response.status}`)
    console.log(`Status Text: ${response.statusText}`)
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('✅ Cron endpoint working correctly')
    } else {
      console.log('❌ Cron endpoint failed')
      console.log('Error details:', data.error || 'No error message')
      console.log('Logs:', data.logs || 'No logs')
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message)
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing database connection...')
  
  try {
    const response = await fetch('https://somema-ai.vercel.app/api/test-db', {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Database connection working')
      console.log('Tables found:', data.tables || 'No tables info')
    } else {
      console.log('❌ Database connection failed:', response.status)
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message)
  }
}

async function checkUserProfilesTable() {
  console.log('\n👥 Checking user_profiles table structure...')
  
  try {
    const response = await fetch('https://somema-ai.vercel.app/api/test-db?table=user_profiles', {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ user_profiles table exists')
      console.log('Columns:', data.columns || 'No columns info')
      
      // Check if meta_credentials column exists
      if (data.columns && data.columns.includes('meta_credentials')) {
        console.log('✅ meta_credentials column exists')
      } else {
        console.log('❌ meta_credentials column missing - need to run database migration')
      }
    } else {
      console.log('❌ Could not check user_profiles table:', response.status)
    }
    
  } catch (error) {
    console.log('❌ Table check failed:', error.message)
  }
}

async function runAllTests() {
  await testCronEndpoint()
  await testDatabaseConnection()
  await checkUserProfilesTable()
  
  console.log('\n🎯 Debug Summary:')
  console.log('If you see "meta_credentials column missing", run this SQL in Supabase:')
  console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS meta_credentials JSONB DEFAULT \'{}\';')
  console.log('')
  console.log('If you see "No Facebook pages connected", the user needs to:')
  console.log('1. Go to Settings')
  console.log('2. Connect Facebook/Instagram account')
  console.log('3. Grant necessary permissions')
}

runAllTests().catch(console.error) 