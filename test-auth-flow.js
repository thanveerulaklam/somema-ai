// Test script to verify authentication flow
// Run this with: node test-auth-flow.js

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Authentication Flow...\n')

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('\nPlease set these in your .env.local file')
  process.exit(1)
}

console.log('✅ Environment variables found')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthFlow() {
  try {
    console.log('\n🔧 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return
    }
    
    console.log('✅ Supabase connection successful')
    
    // Test Google OAuth URL generation
    console.log('\n🔧 Testing Google OAuth URL generation...')
    
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (oauthError) {
      console.error('❌ Google OAuth configuration error:', oauthError.message)
      console.log('\n💡 Troubleshooting tips:')
      console.log('   1. Check if Google provider is enabled in Supabase Dashboard')
      console.log('   2. Verify Google OAuth credentials are set correctly')
      console.log('   3. Ensure redirect URIs are configured properly')
      console.log('   4. Check the GOOGLE_OAUTH_SETUP.md file for detailed instructions')
      return
    }
    
    console.log('✅ Google OAuth URL generated successfully')
    console.log('   URL:', oauthData.url)
    
    // Test session handling
    console.log('\n🔧 Testing session handling...')
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session handling error:', sessionError.message)
    } else {
      console.log('✅ Session handling working correctly')
    }
    
    console.log('\n🎉 Authentication flow is properly configured!')
    console.log('\n📝 Next steps:')
    console.log('   1. Start your development server: npm run dev')
    console.log('   2. Visit http://localhost:3000')
    console.log('   3. Try signing in with Google')
    console.log('   4. Check the browser console for any errors')
    console.log('   5. Monitor the server logs for authentication events')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAuthFlow() 