// Load environment variables
require('dotenv').config({ path: '.env.local' })

const META_APP_ID = process.env.META_APP_ID
const META_APP_SECRET = process.env.META_APP_SECRET

console.log('🔧 Facebook App Configuration Test')
console.log('==================================')

console.log('\n📋 Current Configuration:')
console.log(`App ID: ${META_APP_ID || 'NOT SET'}`)
console.log(`App Secret: ${META_APP_SECRET ? 'SET' : 'NOT SET'}`)

if (!META_APP_ID || !META_APP_SECRET) {
  console.log('\n❌ Missing environment variables!')
  console.log('Please set META_APP_ID and META_APP_SECRET in your .env.local file')
  process.exit(1)
}

console.log('\n🔍 Testing Facebook App Access...')

async function testFacebookApp() {
  try {
    // Test 1: Check if app exists and is accessible
    const appResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}?access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const appData = await appResponse.json()
    
    console.log('\n1. App Info:')
    if (appData.error) {
      console.log('❌ App not accessible:', appData.error.message)
      console.log('   This could mean:')
      console.log('   - App ID is incorrect')
      console.log('   - App Secret is incorrect')
      console.log('   - App is not in development mode')
    } else {
      console.log('✅ App accessible:', appData.name)
      console.log('   App Type:', appData.type || 'Unknown')
      console.log('   App Status:', appData.status || 'Unknown')
    }

    // Test 2: Check app permissions
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/${META_APP_ID}/permissions?access_token=${META_APP_ID}|${META_APP_SECRET}`)
    const permissionsData = await permissionsResponse.json()
    
    console.log('\n2. App Permissions:')
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

    // Test 3: Check redirect URIs
    console.log('\n3. Redirect URI Configuration:')
    console.log('   You need to add these URIs to your Facebook app:')
    console.log('   - http://localhost:3000/api/meta/oauth (for development)')
    console.log('   - https://www.quely.ai/api/meta/oauth (for production)')
    console.log('\n   To add them:')
    console.log('   1. Go to https://developers.facebook.com/')
    console.log('   2. Select your app')
    console.log('   3. Go to Settings > Basic')
    console.log('   4. Add the URIs to "Valid OAuth Redirect URIs"')
    console.log('   5. Save changes')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFacebookApp() 