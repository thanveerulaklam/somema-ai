const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Test users with different access tokens
const testUsers = [
  {
    name: 'Test User 1',
    accessToken: 'EAASMj0wCrc4BPLpdZCwZAEpor1PIqZBdGLZAJQMosDlAFJNJbU9M1ZCK9aPe3WsRNhoTDMnBlIBov9xihOk9FJkcZCAvZAteK7IiKz6IIN9ZBLo9hiDZA4ZCg2vkynXirng6j3oC4AhdGcg2oU85f9Q5yfcD36ZC3IH7SgsH2VFQEKKjCdpoQTD2OPXwfU4QerpBZAbYOTjFPXrm5ZCGAOOn84snlGxW1cZAhL10T10zeXIQZBTylLpkFbefmBypZAFZCBpw35AZDZD',
    description: 'Main test user'
  },
  {
    name: 'Test User 2',
    accessToken: 'YOUR_SECOND_ACCESS_TOKEN_HERE',
    description: 'Second test user (add your token)'
  },
  {
    name: 'Test User 3',
    accessToken: 'YOUR_THIRD_ACCESS_TOKEN_HERE',
    description: 'Third test user (add your token)'
  }
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testMetaConnection(accessToken, userName) {
  console.log(`\n🧪 Testing Meta connection for ${userName}...`)
  
  try {
    // Test token validation
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`)
    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      console.log(`❌ Token validation failed for ${userName}:`, tokenData.error.message)
      return false
    }
    
    console.log(`✅ Token valid for ${userName} (User ID: ${tokenData.id})`)
    
    // Test getting Facebook pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesResponse.json()
    
    if (pagesData.error) {
      console.log(`❌ Failed to get pages for ${userName}:`, pagesData.error.message)
      return false
    }
    
    console.log(`📄 Found ${pagesData.data.length} Facebook pages for ${userName}:`)
    pagesData.data.forEach(page => {
      console.log(`   - ${page.name} (ID: ${page.id})`)
    })
    
    // Test Instagram accounts for each page
    for (const page of pagesData.data) {
      const instagramResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
      )
      const instagramData = await instagramResponse.json()
      
      if (instagramData.instagram_business_account) {
        console.log(`📸 Instagram account found for ${page.name}: ${instagramData.instagram_business_account.id}`)
      } else {
        console.log(`📸 No Instagram account connected to ${page.name}`)
      }
    }
    
    return true
    
  } catch (error) {
    console.log(`❌ Error testing ${userName}:`, error.message)
    return false
  }
}

async function testPosting(accessToken, userName) {
  console.log(`\n📝 Testing posting for ${userName}...`)
  
  try {
    // Get pages first
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesResponse.json()
    
    if (!pagesData.data || pagesData.data.length === 0) {
      console.log(`❌ No pages available for ${userName}`)
      return false
    }
    
    const page = pagesData.data[0] // Use first page
    
    // Test posting to Facebook
    const postData = {
      message: `Test post from Somema.ai - ${new Date().toISOString()}`,
      access_token: page.access_token
    }
    
    const postResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    })
    
    const postResult = await postResponse.json()
    
    if (postResult.error) {
      console.log(`❌ Failed to post for ${userName}:`, postResult.error.message)
      return false
    }
    
    console.log(`✅ Successfully posted for ${userName}! Post ID: ${postResult.id}`)
    return true
    
  } catch (error) {
    console.log(`❌ Error posting for ${userName}:`, error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Meta API Integration Tests...\n')
  
  let successfulConnections = 0
  let successfulPosts = 0
  
  for (const user of testUsers) {
    if (user.accessToken === 'YOUR_SECOND_ACCESS_TOKEN_HERE' || 
        user.accessToken === 'YOUR_THIRD_ACCESS_TOKEN_HERE') {
      console.log(`⏭️  Skipping ${user.name} - no access token provided`)
      continue
    }
    
    const connectionSuccess = await testMetaConnection(user.accessToken, user.name)
    if (connectionSuccess) {
      successfulConnections++
      
      // Test posting (optional - uncomment to test)
      // const postSuccess = await testPosting(user.accessToken, user.name)
      // if (postSuccess) successfulPosts++
    }
  }
  
  console.log(`\n📊 Test Results:`)
  console.log(`✅ Successful connections: ${successfulConnections}/${testUsers.length}`)
  console.log(`✅ Successful posts: ${successfulPosts}/${testUsers.length}`)
  
  if (successfulConnections > 0) {
    console.log(`\n🎉 Meta API integration is working!`)
    console.log(`\nNext steps:`)
    console.log(`1. Start the development server: npm run dev`)
    console.log(`2. Go to http://localhost:3000/settings`)
    console.log(`3. Connect your Meta account using the access token`)
    console.log(`4. Test posting from the Post Editor`)
  } else {
    console.log(`\n❌ Meta API integration needs attention`)
  }
}

// Run the tests
runTests().catch(console.error) 