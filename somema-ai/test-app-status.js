require('dotenv').config({ path: '.env.local' })

const META_APP_ID = process.env.META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET

if (!META_APP_ID || !META_APP_SECRET) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

console.log('🔍 Testing App Status for "Feature unavailable" Issue')
console.log('=====================================================\n')

async function testAppStatus() {
  try {
    // Test 1: Get basic app info
    console.log('1. Basic App Information...')
    const appResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}?access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const appData = await appResponse.json()
    
    if (appData.error) {
      console.log('❌ App error:', appData.error.message)
      return
    }
    
    console.log('✅ App Name:', appData.name)
    console.log('✅ App ID:', appData.id)
    console.log('✅ App Type:', appData.type || 'Unknown')
    console.log('')

    // Test 2: Check app settings
    console.log('2. App Settings...')
    const settingsResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}?fields=name,id,type,status,app_domains,website_url,privacy_policy_url,terms_of_service_url&access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const settingsData = await settingsResponse.json()
    
    if (settingsData.error) {
      console.log('❌ Settings error:', settingsData.error.message)
    } else {
      console.log('✅ App Status:', settingsData.status || 'Unknown')
      console.log('✅ App Domains:', settingsData.app_domains || 'None')
      console.log('✅ Website URL:', settingsData.website_url || 'None')
      console.log('✅ Privacy Policy:', settingsData.privacy_policy_url || 'None')
      console.log('✅ Terms of Service:', settingsData.terms_of_service_url || 'None')
    }
    console.log('')

    // Test 3: Check Facebook Login product
    console.log('3. Facebook Login Product...')
    const loginResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}/products?access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const loginData = await loginResponse.json()
    
    if (loginData.error) {
      console.log('❌ Products error:', loginData.error.message)
    } else {
      const facebookLogin = loginData.data?.find(product => product.name === 'Facebook Login')
      if (facebookLogin) {
        console.log('✅ Facebook Login product found')
        console.log('   Product ID:', facebookLogin.id)
        console.log('   Product Name:', facebookLogin.name)
      } else {
        console.log('❌ Facebook Login product not found')
        console.log('   Available products:', loginData.data?.map(p => p.name).join(', ') || 'None')
      }
    }
    console.log('')

    // Test 4: Check OAuth redirect URIs
    console.log('4. OAuth Redirect URIs...')
    const redirectResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}/oauth/redirect_uris?access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const redirectData = await redirectResponse.json()
    
    if (redirectData.error) {
      console.log('❌ Redirect URIs error:', redirectData.error.message)
    } else {
      console.log('✅ Redirect URIs:')
      redirectData.data?.forEach(uri => {
        console.log('   -', uri.uri)
      })
    }
    console.log('')

    // Test 5: Test OAuth URL with different parameters
    console.log('5. Testing OAuth URL Variations...')
    
    const testUrls = [
      // Basic OAuth URL
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent('https://www.quely.ai/api/meta/oauth')}&scope=pages_show_list&response_type=code`,
      
      // OAuth URL with minimal scope
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent('https://www.quely.ai/api/meta/oauth')}&scope=public_profile&response_type=code`,
      
      // OAuth URL with display=popup
      `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent('https://www.quely.ai/api/meta/oauth')}&scope=pages_show_list&response_type=code&display=popup`
    ]
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i]
      console.log(`   Test ${i + 1}: ${url.includes('public_profile') ? 'Minimal scope' : url.includes('display=popup') ? 'Popup display' : 'Basic'}`)
      
      try {
        const response = await fetch(url, { 
          method: 'GET',
          redirect: 'manual'
        })
        
        console.log(`   Status: ${response.status}`)
        const location = response.headers.get('location')
        if (location) {
          if (location.includes('login.php')) {
            console.log('   ✅ Redirecting to login')
          } else if (location.includes('error')) {
            console.log('   ❌ Error in redirect')
          } else {
            console.log('   ⚠️  Other redirect')
          }
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
      console.log('')
    }

    // Test 6: Check if app is in development mode
    console.log('6. Development Mode Check...')
    console.log('   Note: If app is in development mode, only developers and test users can access it')
    console.log('   This could cause "Feature unavailable" for new users')
    console.log('   Check your Facebook Developer Console: https://developers.facebook.com/apps/')
    console.log('')

    console.log('📋 Troubleshooting Steps:')
    console.log('=========================')
    console.log('1. Go to https://developers.facebook.com/apps/')
    console.log('2. Select your app (Quely)')
    console.log('3. Check if app is in "Development" or "Live" mode')
    console.log('4. If in Development mode, switch to Live mode')
    console.log('5. Verify all permissions are approved')
    console.log('6. Check if redirect URIs include: https://www.quely.ai/api/meta/oauth')
    console.log('7. Clear browser cache and try again')
    console.log('8. Test with incognito/private browsing mode')
    console.log('')

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testAppStatus() 