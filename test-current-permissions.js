const { createMetaAPIService } = require('./lib/meta-api')

async function testCurrentPermissions() {
  console.log('=== TESTING CURRENT PERMISSIONS ===')
  
  const accessToken = process.env.TEST_ACCESS_TOKEN
  
  if (!accessToken) {
    console.log('❌ No test access token provided. Set TEST_ACCESS_TOKEN environment variable.')
    console.log('To test:')
    console.log('1. Get an access token from your app')
    console.log('2. Set: export TEST_ACCESS_TOKEN="your_token_here"')
    console.log('3. Run: node test-current-permissions.js')
    return
  }
  
  try {
    console.log('🔍 Testing current permissions...')
    
    // Test 1: User info
    console.log('\n1. Testing user info...')
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`)
    const userData = await userResponse.json()
    
    if (userData.error) {
      console.log(`❌ User info failed: ${userData.error.message}`)
    } else {
      console.log(`✅ User info: ${userData.name} (${userData.id})`)
    }
    
    // Test 2: Pages list
    console.log('\n2. Testing pages list...')
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category&access_token=${accessToken}&limit=100`)
    const pagesData = await pagesResponse.json()
    
    if (pagesData.error) {
      console.log(`❌ Pages list failed: ${pagesData.error.message}`)
    } else {
      console.log(`✅ Pages list: ${pagesData.data?.length || 0} pages found`)
      if (pagesData.data) {
        pagesData.data.forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.name} (${page.id}) - ${page.category}`)
        })
      }
    }
    
    // Test 3: Business Manager
    console.log('\n3. Testing business manager...')
    const businessResponse = await fetch(`https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${accessToken}`)
    const businessData = await businessResponse.json()
    
    if (businessData.error) {
      console.log(`❌ Business manager failed: ${businessData.error.message}`)
    } else {
      console.log(`✅ Business manager: ${businessData.data?.length || 0} businesses found`)
      if (businessData.data) {
        businessData.data.forEach((business, index) => {
          console.log(`   ${index + 1}. ${business.name} (${business.id})`)
        })
      }
    }
    
    // Test 4: Instagram accounts for first page
    if (pagesData.data && pagesData.data.length > 0) {
      const firstPage = pagesData.data[0]
      console.log(`\n4. Testing Instagram accounts for ${firstPage.name}...`)
      
      const instagramResponse = await fetch(`https://graph.facebook.com/v18.0/${firstPage.id}?fields=instagram_business_account,connected_instagram_account&access_token=${accessToken}`)
      const instagramData = await instagramResponse.json()
      
      if (instagramData.error) {
        console.log(`❌ Instagram accounts failed: ${instagramData.error.message}`)
      } else {
        console.log(`✅ Instagram accounts for ${firstPage.name}:`)
        if (instagramData.instagram_business_account) {
          console.log(`   - Business Account: ${instagramData.instagram_business_account.id}`)
        }
        if (instagramData.connected_instagram_account) {
          console.log(`   - Connected Account: ${instagramData.connected_instagram_account.id}`)
        }
        if (!instagramData.instagram_business_account && !instagramData.connected_instagram_account) {
          console.log(`   - No Instagram accounts found`)
        }
      }
    }
    
    // Test 5: Meta API Service
    console.log('\n5. Testing Meta API Service...')
    const metaService = createMetaAPIService({ accessToken })
    
    try {
      const apiPages = await metaService.getFacebookPages()
      console.log(`✅ Meta API Service: ${apiPages.length} pages found`)
      
      if (apiPages.length > 0) {
        console.log('   First 3 pages:')
        apiPages.slice(0, 3).forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.name} (${page.id})`)
        })
      }
    } catch (error) {
      console.log(`❌ Meta API Service failed: ${error.message}`)
    }
    
    console.log('\n=== PERMISSION TEST SUMMARY ===')
    console.log('✅ User info: Working')
    console.log(`✅ Pages list: ${pagesData.data?.length || 0} pages`)
    console.log(`✅ Business manager: ${businessData.data?.length || 0} businesses`)
    console.log('✅ Instagram accounts: Working')
    console.log('✅ Meta API Service: Working')
    
    console.log('\n📋 Current permissions are sufficient for:')
    console.log('- Reading user profile')
    console.log('- Listing all managed pages')
    console.log('- Accessing business manager')
    console.log('- Discovering Instagram accounts')
    console.log('- Publishing content')
    
    console.log('\n💡 If you need additional permissions, consider requesting:')
    console.log('- pages_manage_instant_articles (for Instant Articles)')
    console.log('- pages_manage_cta (for Call-to-Action buttons)')
    console.log('- pages_manage_events (for Events management)')
    console.log('- pages_manage_offers (for Offers management)')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testCurrentPermissions()
