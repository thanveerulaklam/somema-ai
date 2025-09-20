// Test Instagram API Integration
// Run with: node test-instagram-api.js

const { createInstagramAPIService } = require('./lib/instagram-api')

async function testInstagramAPI() {
  console.log('🧪 Testing Instagram API Integration...')
  
  // You'll need to replace these with actual values
  const credentials = {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || 'your_instagram_access_token',
    instagramBusinessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || 'your_instagram_business_account_id'
  }
  
  if (!credentials.accessToken || credentials.accessToken === 'your_instagram_access_token') {
    console.log('❌ Please set INSTAGRAM_ACCESS_TOKEN environment variable')
    return
  }
  
  if (!credentials.instagramBusinessAccountId || credentials.instagramBusinessAccountId === 'your_instagram_business_account_id') {
    console.log('❌ Please set INSTAGRAM_BUSINESS_ACCOUNT_ID environment variable')
    return
  }
  
  try {
    const instagramService = createInstagramAPIService(credentials)
    
    // Test 1: Validate token and get account info
    console.log('\n📋 Test 1: Validating token and getting account info...')
    const validation = await instagramService.validateToken()
    
    if (validation.valid) {
      console.log('✅ Token is valid!')
      console.log('📸 Account info:', {
        username: validation.account?.username,
        name: validation.account?.name,
        followers: validation.account?.followersCount,
        mediaCount: validation.account?.mediaCount
      })
    } else {
      console.log('❌ Token validation failed:', validation.error)
      return
    }
    
    // Test 2: Get recent media
    console.log('\n📷 Test 2: Getting recent media...')
    const recentMedia = await instagramService.getRecentMedia(5)
    console.log(`✅ Found ${recentMedia.length} recent posts`)
    
    // Test 3: Test posting (commented out to avoid actual posting)
    console.log('\n📝 Test 3: Testing post creation (dry run)...')
    console.log('⚠️  Skipping actual posting to avoid spam')
    console.log('✅ Instagram API integration is ready!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testInstagramAPI().catch(console.error) 