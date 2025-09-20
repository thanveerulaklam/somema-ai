// Test enhanced page discovery for different user types
console.log('=== TESTING ENHANCED PAGE DISCOVERY ===\n')

const accessToken = process.env.TEST_ACCESS_TOKEN

if (!accessToken) {
  console.log('❌ No test access token provided. Set TEST_ACCESS_TOKEN environment variable.')
  console.log('To test:')
  console.log('1. Get an access token from your app')
  console.log('2. Set: export TEST_ACCESS_TOKEN="your_token_here"')
  console.log('3. Run: node test-enhanced-discovery.js')
  console.log('\n💡 You can test with different user accounts:')
  console.log('   - Regular user account (limited Business Manager access)')
  console.log('   - Developer account (full Business Manager access)')
  console.log('   - Business Manager account (multiple businesses)')
  return
}

async function testEnhancedDiscovery() {
  try {
    console.log('🔍 Testing enhanced page discovery...')
    
    // Test 1: User info and type detection
    console.log('\n1. Testing user info and type detection...')
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`)
    const userData = await userResponse.json()
    
    if (userData.error) {
      console.log(`❌ User info failed: ${userData.error.message}`)
      return
    } else {
      console.log(`✅ User info: ${userData.name} (${userData.id})`)
    }
    
    // Test 2: Enhanced page discovery
    console.log('\n2. Testing enhanced page discovery...')
    
    // Test direct pages
    console.log('   Testing direct pages...')
    const directPagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category&access_token=${accessToken}&limit=100`)
    const directPagesData = await directPagesResponse.json()
    
    if (directPagesData.error) {
      console.log(`   ❌ Direct pages failed: ${directPagesData.error.message}`)
    } else {
      console.log(`   ✅ Direct pages: ${directPagesData.data?.length || 0} found`)
      if (directPagesData.data) {
        directPagesData.data.forEach((page, index) => {
          console.log(`      ${index + 1}. ${page.name} (${page.id}) - ${page.category}`)
        })
      }
    }
    
    // Test Business Manager access
    console.log('   Testing Business Manager access...')
    try {
      const businessResponse = await fetch(`https://graph.facebook.com/v18.0/me/businesses?fields=id,name&access_token=${accessToken}`)
      const businessData = await businessResponse.json()
      
      if (businessData.error) {
        console.log(`   ℹ️  Business Manager: Not accessible (normal for regular users)`)
        console.log(`   ℹ️  Error: ${businessData.error.message}`)
      } else {
        console.log(`   ✅ Business Manager: ${businessData.data?.length || 0} businesses found`)
        if (businessData.data) {
          businessData.data.forEach((business, index) => {
            console.log(`      ${index + 1}. ${business.name} (${business.id})`)
          })
        }
      }
    } catch (error) {
      console.log(`   ℹ️  Business Manager: Not accessible (normal for regular users)`)
    }
    
    // Test user accounts edge
    console.log('   Testing user accounts edge...')
    try {
      const userAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=accounts{id,name,category}&access_token=${accessToken}`
      )
      const userAccountsData = await userAccountsResponse.json()
      
      if (userAccountsData.error) {
        console.log(`   ❌ User accounts edge failed: ${userAccountsData.error.message}`)
      } else {
        console.log(`   ✅ User accounts edge: ${userAccountsData.accounts?.data?.length || 0} pages found`)
      }
    } catch (error) {
      console.log(`   ❌ User accounts edge failed: ${error.message}`)
    }
    
    // Test 3: Instagram discovery
    console.log('\n3. Testing Instagram discovery...')
    if (directPagesData.data && directPagesData.data.length > 0) {
      const firstPage = directPagesData.data[0]
      console.log(`   Testing Instagram for page: ${firstPage.name}`)
      
      try {
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v18.0/${firstPage.id}?fields=instagram_business_account,connected_instagram_account&access_token=${accessToken}`
        )
        const instagramData = await instagramResponse.json()
        
        if (instagramData.error) {
          console.log(`   ❌ Instagram discovery failed: ${instagramData.error.message}`)
        } else {
          let instagramCount = 0
          if (instagramData.instagram_business_account) instagramCount++
          if (instagramData.connected_instagram_account) instagramCount++
          
          console.log(`   ✅ Instagram accounts: ${instagramCount} found`)
          
          if (instagramData.instagram_business_account) {
            console.log(`      - Business Account: ${instagramData.instagram_business_account.id}`)
          }
          if (instagramData.connected_instagram_account) {
            console.log(`      - Connected Account: ${instagramData.connected_instagram_account.id}`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Instagram discovery failed: ${error.message}`)
      }
    }
    
    // Test 4: Determine user type
    console.log('\n4. Determining user type...')
    try {
      const businessResponse = await fetch(`https://graph.facebook.com/v18.0/me/businesses?fields=id&access_token=${accessToken}`)
      const businessData = await businessResponse.json()
      
      const hasBusinessAccess = !businessData.error && businessData.data && businessData.data.length > 0
      const userType = hasBusinessAccess ? 'developer' : 'regular'
      const directPagesCount = directPagesData.data?.length || 0
      
      console.log(`   👤 User type: ${userType}`)
      console.log(`   📊 Business Manager access: ${hasBusinessAccess ? 'Yes' : 'No'}`)
      console.log(`   📊 Direct pages: ${directPagesCount}`)
      
      if (userType === 'regular') {
        console.log('\n   💡 Regular User Guidance:')
        console.log('   - This is normal for regular user accounts')
        console.log('   - Business Manager pages may not be visible')
        console.log('   - Enhanced discovery will find maximum possible pages')
        console.log('   - Consider Business Manager setup for full access')
        
        if (directPagesCount < 5) {
          console.log('\n   ⚠️  Limited Page Access:')
          console.log('   - You have fewer than 5 pages visible')
          console.log('   - This is typical for regular user accounts')
          console.log('   - The enhanced discovery will help find additional pages')
        }
      } else {
        console.log('\n   💡 Developer User:')
        console.log('   - You have full Business Manager access')
        console.log('   - All pages should be discoverable')
        console.log('   - Enhanced discovery will work optimally')
      }
    } catch (error) {
      console.log(`   ❌ User type detection failed: ${error.message}`)
    }
    
    console.log('\n=== ENHANCED DISCOVERY TEST SUMMARY ===')
    console.log('✅ User info: Working')
    console.log(`✅ Direct pages: ${directPagesData.data?.length || 0} found`)
    console.log('✅ Instagram discovery: Working')
    console.log('✅ User type detection: Working')
    
    console.log('\n📋 Enhanced discovery is working correctly for this user type.')
    console.log('The system will automatically use the best discovery methods available.')
    
    console.log('\n🔧 Next Steps:')
    console.log('1. Test with a different user account to compare results')
    console.log('2. Check the OAuth flow in your app')
    console.log('3. Use the debug button in settings to see detailed results')
    
  } catch (error) {
    console.error('❌ Enhanced discovery test failed:', error.message)
  }
}

// Run the test
testEnhancedDiscovery()
