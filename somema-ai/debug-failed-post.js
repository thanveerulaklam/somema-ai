const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugFailedPost() {
  console.log('🔍 Debugging Failed Post...')
  
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', '308b76a5-95b8-4cf7-ac97-27d82b569dbf')
      .single()
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    console.log('Failed post details:')
    console.log('ID:', post.id)
    console.log('Status:', post.status)
    console.log('Meta error:', post.meta_error)
    console.log('Meta errors:', post.meta_errors)
    console.log('User ID:', post.user_id)
    console.log('Platform:', post.platform)
    
    // Check user's Meta credentials
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('meta_credentials')
      .eq('user_id', post.user_id)
      .single()
    
    if (profileError) {
      console.error('Profile error:', profileError)
      return
    }
    
    console.log('\nUser Meta credentials:')
    console.log('Has credentials:', !!profile.meta_credentials)
    console.log('Connected pages:', profile.meta_credentials?.pages?.length || 0)
    
    if (profile.meta_credentials?.pages?.length > 0) {
      const page = profile.meta_credentials.pages[0]
      console.log('Page ID:', page.id)
      console.log('Page name:', page.name)
      console.log('Has access token:', !!page.access_token)
      console.log('Instagram accounts:', page.instagram_accounts?.length || 0)
      
      if (page.instagram_accounts?.length > 0) {
        console.log('Instagram account ID:', page.instagram_accounts[0].id)
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error)
  }
}

debugFailedPost() 