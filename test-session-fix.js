const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('✅ Environment variables found')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'quely-ai-web',
    },
  },
})

async function testSessionHandling() {
  try {
    console.log('\n🔧 Testing session handling...')
    
    // Test getting current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('⚠️  Session error (expected if not logged in):', sessionError.message)
    } else if (session) {
      console.log('✅ Active session found')
      console.log('   User ID:', session.user.id)
      console.log('   Expires at:', new Date(session.expires_at * 1000).toLocaleString())
    } else {
      console.log('ℹ️  No active session found')
    }
    
    // Test getting current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('⚠️  User error (expected if not logged in):', userError.message)
    } else if (user) {
      console.log('✅ Current user found:', user.email)
    } else {
      console.log('ℹ️  No current user found')
    }
    
    // Test session refresh (this might fail if no session exists)
    console.log('\n🔧 Testing session refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      if (refreshError.message.includes('Invalid Refresh Token') || 
          refreshError.message.includes('Refresh Token Not Found')) {
        console.log('ℹ️  No valid refresh token (expected if not logged in)')
      } else {
        console.log('⚠️  Refresh error:', refreshError.message)
      }
    } else {
      console.log('✅ Session refresh successful')
    }
    
    console.log('\n🎉 Session handling test completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Try logging in through the web app')
    console.log('   2. Check if the middleware handles session refresh')
    console.log('   3. Test accessing protected routes')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSessionHandling()
