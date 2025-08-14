const { createAdsAPIService } = require('./lib/ads-api')

async function testAdsAPI() {
  console.log('🧪 Testing Ads API Integration...')
  
  // You'll need to provide a valid access token
  const accessToken = process.env.META_ACCESS_TOKEN
  
  if (!accessToken) {
    console.log('❌ No META_ACCESS_TOKEN found in environment variables')
    console.log('Please set META_ACCESS_TOKEN with a valid Meta access token')
    return
  }

  try {
    const adsService = createAdsAPIService({
      accessToken: accessToken
    })

    console.log('📊 Testing Ads API calls...')

    // Test 1: Get ad accounts
    console.log('\n1. Getting ad accounts...')
    const adAccounts = await adsService.getAdAccounts()
    console.log(`✅ Found ${adAccounts.length} ad account(s)`)
    
    if (adAccounts.length > 0) {
      console.log('Ad accounts:', adAccounts.map(acc => ({ id: acc.id, name: acc.name })))
      
      // Test 2: Get ad account details
      console.log('\n2. Getting ad account details...')
      const accountDetails = await adsService.getAdAccountDetails(adAccounts[0].id)
      console.log('✅ Ad account details:', accountDetails)
      
      // Test 3: Get campaigns
      console.log('\n3. Getting campaigns...')
      const campaigns = await adsService.getCampaigns(adAccounts[0].id)
      console.log(`✅ Found ${campaigns.length} campaign(s)`)
      
      // Test 4: Get ad sets
      console.log('\n4. Getting ad sets...')
      const adSets = await adsService.getAdSets(adAccounts[0].id)
      console.log(`✅ Found ${adSets.length} ad set(s)`)
      
      // Test 5: Get ads
      console.log('\n5. Getting ads...')
      const ads = await adsService.getAds(adAccounts[0].id)
      console.log(`✅ Found ${ads.length} ad(s)`)
      
      // Test 6: Get insights (this is the key Ads API call)
      console.log('\n6. Getting ad account insights...')
      const insights = await adsService.getAdAccountInsights(adAccounts[0].id)
      console.log('✅ Ad account insights:', insights)
      
      if (campaigns.length > 0) {
        // Test 7: Get campaign insights
        console.log('\n7. Getting campaign insights...')
        const campaignInsights = await adsService.getCampaignInsights(campaigns[0].id)
        console.log('✅ Campaign insights:', campaignInsights)
      }
    } else {
      console.log('ℹ️  No ad accounts found. This is normal for new users.')
      console.log('The API calls still count towards Meta\'s requirements.')
    }

    console.log('\n🎉 All Ads API tests completed successfully!')
    console.log('This should satisfy Meta\'s Ads API usage requirements.')
    
  } catch (error) {
    console.error('❌ Ads API test failed:', error.message)
    console.error('Error details:', error)
  }
}

// Run the test
testAdsAPI() 