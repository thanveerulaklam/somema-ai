const { createMetaAPIService } = require('./lib/meta-api')

async function testPageDiscovery() {
  console.log('=== TESTING PAGE DISCOVERY IMPROVEMENTS ===')
  
  // This would be used with a real access token
  const accessToken = process.env.TEST_ACCESS_TOKEN
  
  if (!accessToken) {
    console.log('❌ No test access token provided. Set TEST_ACCESS_TOKEN environment variable.')
    console.log('To test:')
    console.log('1. Get an access token from your app')
    console.log('2. Set: export TEST_ACCESS_TOKEN="your_token_here"')
    console.log('3. Run: node test-page-discovery.js')
    return
  }
  
  try {
    const metaService = createMetaAPIService({ accessToken })
    
    console.log('Testing Facebook pages discovery...')
    const pages = await metaService.getFacebookPages()
    console.log(`✅ Found ${pages.length} Facebook pages`)
    
    console.log('\nTesting Instagram account discovery...')
    for (const page of pages.slice(0, 3)) { // Test first 3 pages
      console.log(`\nTesting page: ${page.name} (${page.id})`)
      const instagramAccounts = await metaService.getInstagramAccounts(page.id)
      console.log(`✅ Found ${instagramAccounts.length} Instagram accounts`)
      
      for (const insta of instagramAccounts) {
        console.log(`  - ${insta.username} (${insta.id})`)
      }
    }
    
    console.log('\n=== TEST COMPLETE ===')
    console.log(`📊 Total pages: ${pages.length}`)
    console.log(`📊 Pages with Instagram: ${pages.filter(p => p.instagram_accounts?.length > 0).length}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testPageDiscovery()
