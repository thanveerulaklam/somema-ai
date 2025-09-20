require('dotenv').config({ path: '.env.local' })

const META_APP_ID = process.env.META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'https://www.quely.ai/api/meta/oauth'

if (!META_APP_ID || !META_APP_SECRET) {
  console.error('❌ Missing required environment variables:')
  console.error('   META_APP_ID:', META_APP_ID ? '✅ Set' : '❌ Missing')
  console.error('   META_APP_SECRET:', META_APP_SECRET ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

console.log('🔍 Debugging OAuth "Feature unavailable" Issue')
console.log('=============================================\n')

console.log('📋 Current Configuration:')
console.log('   App ID:', META_APP_ID)
console.log('   App Secret:', META_APP_SECRET ? '✅ Set' : '❌ Missing')
console.log('   Redirect URI:', META_REDIRECT_URI)
console.log('')

async function debugOAuthIssue() {
  try {
    // Test 1: Check if app exists and is accessible
    console.log('1. Testing App Accessibility...')
    const appResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}?access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const appData = await appResponse.json()
    
    if (appData.error) {
      console.log('❌ App not accessible:', appData.error.message)
      console.log('   Error code:', appData.error.code)
      console.log('   Error subcode:', appData.error.error_subcode)
      console.log('')
      console.log('🔧 Possible solutions:')
      console.log('   - Check if app is in development mode')
      console.log('   - Verify App ID and App Secret are correct')
      console.log('   - Ensure app has Facebook Login product added')
    } else {
      console.log('✅ App accessible:', appData.name)
      console.log('   App Type:', appData.type || 'Unknown')
      console.log('   App Status:', appData.status || 'Unknown')
      console.log('   App Mode:', appData.mode || 'Unknown')
    }

    // Test 2: Check app permissions
    console.log('\n2. Testing App Permissions...')
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}/permissions?access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const permissionsData = await permissionsResponse.json()
    
    if (permissionsData.error) {
      console.log('❌ Could not fetch permissions:', permissionsData.error.message)
    } else {
      const requiredPermissions = [
        'pages_manage_posts',
        'pages_read_engagement', 
        'pages_show_list',
        'instagram_basic',
        'instagram_content_publish'
      ]
      
      console.log('Current permissions:')
      permissionsData.data?.forEach(perm => {
        const status = perm.status === 'granted' ? '✅' : '❌'
        console.log(`   ${status} ${perm.permission}: ${perm.status}`)
      })
      
      console.log('\nRequired permissions:')
      requiredPermissions.forEach(perm => {
        const found = permissionsData.data?.find(p => p.permission === perm)
        const status = found && found.status === 'granted' ? '✅' : '❌'
        console.log(`   ${status} ${perm}`)
      })
    }

    // Test 3: Generate OAuth URL and test it
    console.log('\n3. Testing OAuth URL...')
    const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,instagram_basic,instagram_manage_insights,instagram_content_publish'
    const state = 'test_' + Date.now()
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`
    
    console.log('Generated OAuth URL:')
    console.log(oauthUrl)
    console.log('')
    
    // Test the OAuth URL
    const oauthResponse = await fetch(oauthUrl, { 
      method: 'GET',
      redirect: 'manual' // Don't follow redirects
    })
    
    console.log('OAuth URL Response:')
    console.log('   Status:', oauthResponse.status)
    console.log('   Status Text:', oauthResponse.statusText)
    console.log('   Location Header:', oauthResponse.headers.get('location'))
    
    if (oauthResponse.status === 302) {
      const location = oauthResponse.headers.get('location')
      if (location && location.includes('login.php')) {
        console.log('✅ OAuth URL is working - redirecting to Facebook login')
      } else if (location && location.includes('error')) {
        console.log('❌ OAuth URL has error in redirect')
        console.log('   Redirect URL:', location)
      }
    } else if (oauthResponse.status === 200) {
      const body = await oauthResponse.text()
      if (body.includes('Feature unavailable')) {
        console.log('❌ "Feature unavailable" error detected')
        console.log('')
        console.log('🔧 This usually means:')
        console.log('   - App is still in development mode')
        console.log('   - App review is not complete')
        console.log('   - App needs to be switched to live mode')
        console.log('   - App needs additional configuration')
      } else {
        console.log('✅ OAuth URL returned 200 OK')
      }
    }

    // Test 4: Check app review status
    console.log('\n4. Checking App Review Status...')
    const reviewResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}?fields=review_status&access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const reviewData = await reviewResponse.json()
    
    if (reviewData.error) {
      console.log('❌ Could not fetch review status:', reviewData.error.message)
    } else {
      console.log('✅ Review status:', reviewData.review_status || 'Unknown')
    }

    // Test 5: Check app mode
    console.log('\n5. Checking App Mode...')
    const modeResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}?fields=mode&access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const modeData = await modeResponse.json()
    
    if (modeData.error) {
      console.log('❌ Could not fetch app mode:', modeData.error.message)
    } else {
      console.log('✅ App mode:', modeData.mode || 'Unknown')
      if (modeData.mode === 'development') {
        console.log('⚠️  App is in development mode - this may cause "Feature unavailable" for new users')
        console.log('   Solution: Switch app to live mode in Facebook Developer Console')
      }
    }

    console.log('\n📋 Summary:')
    console.log('==========')
    console.log('If you see "Feature unavailable" error:')
    console.log('1. Check if app is in live mode (not development)')
    console.log('2. Verify all permissions are approved')
    console.log('3. Ensure app review is complete')
    console.log('4. Check if redirect URIs are correctly configured')
    console.log('5. Try clearing browser cache and cookies')
    console.log('6. Test with a different browser or incognito mode')

  } catch (error) {
    console.error('❌ Debug error:', error.message)
  }
}

debugOAuthIssue() 