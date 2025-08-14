// Instagram Credentials Helper Script
// Run with: node get-instagram-credentials.js

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function getInstagramCredentials() {
  console.log('🔧 Instagram API Credentials Setup Helper')
  console.log('==========================================\n')
  
  console.log('📋 Prerequisites:')
  console.log('1. Instagram Business Account ✅')
  console.log('2. Facebook Page linked to Instagram ✅')
  console.log('3. Facebook Developer App created ✅')
  console.log('4. Instagram permissions added to app ✅\n')
  
  const hasPrerequisites = await question('Do you have all prerequisites ready? (y/n): ')
  
  if (hasPrerequisites.toLowerCase() !== 'y') {
    console.log('\n❌ Please complete the prerequisites first:')
    console.log('1. Convert Instagram to Business Account')
    console.log('2. Link Instagram to Facebook Page')
    console.log('3. Create Facebook Developer App')
    console.log('4. Add Instagram permissions to app')
    console.log('\nSee INSTAGRAM_API_SETUP.md for detailed instructions.')
    rl.close()
    return
  }
  
  console.log('\n✅ Great! Let\'s get your credentials...\n')
  
  // Get Facebook App credentials
  console.log('📱 Step 1: Facebook App Credentials')
  console.log('-----------------------------------')
  const appId = await question('Enter your Facebook App ID: ')
  const appSecret = await question('Enter your Facebook App Secret: ')
  
  console.log('\n🔗 Step 2: Generate Facebook Login URL')
  console.log('--------------------------------------')
  
  const redirectUri = await question('Enter your OAuth redirect URI (e.g., http://localhost:3000/api/meta/oauth): ')
  
  const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_content_publish,instagram_basic,pages_show_list,pages_read_engagement&response_type=code`
  
  console.log('\n🌐 Facebook Login URL:')
  console.log(loginUrl)
  console.log('\n📝 Instructions:')
  console.log('1. Open this URL in your browser')
  console.log('2. Login with your Facebook account')
  console.log('3. Grant the requested permissions')
  console.log('4. Copy the authorization code from the redirect URL')
  
  const authCode = await question('\nEnter the authorization code from the redirect URL: ')
  
  console.log('\n🔄 Step 3: Exchange Code for Access Token')
  console.log('------------------------------------------')
  
  console.log('Making request to exchange code for access token...')
  
  try {
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: authCode
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      console.log('❌ Error getting access token:', tokenData.error)
      rl.close()
      return
    }
    
    const accessToken = tokenData.access_token
    console.log('✅ Access token obtained successfully!')
    
    console.log('\n📄 Step 4: Get Instagram Business Account ID')
    console.log('--------------------------------------------')
    
    console.log('Getting your Instagram Business Account ID...')
    
    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesResponse.json()
    
    if (pagesData.error) {
      console.log('❌ Error getting pages:', pagesData.error)
      rl.close()
      return
    }
    
    console.log('\n📋 Your Facebook Pages:')
    pagesData.data.forEach((page, index) => {
      console.log(`${index + 1}. ${page.name} (ID: ${page.id})`)
    })
    
    const pageIndex = await question('\nSelect the page linked to your Instagram (enter number): ')
    const selectedPage = pagesData.data[parseInt(pageIndex) - 1]
    
    if (!selectedPage) {
      console.log('❌ Invalid page selection')
      rl.close()
      return
    }
    
    // Get Instagram account for the selected page
    const instagramResponse = await fetch(`https://graph.facebook.com/v18.0/${selectedPage.id}?fields=instagram_business_account&access_token=${accessToken}`)
    const instagramData = await instagramResponse.json()
    
    if (instagramData.error) {
      console.log('❌ Error getting Instagram account:', instagramData.error)
      rl.close()
      return
    }
    
    if (!instagramData.instagram_business_account) {
      console.log('❌ No Instagram Business Account found for this page')
      console.log('Make sure your Instagram account is linked to this Facebook page')
      rl.close()
      return
    }
    
    const instagramAccountId = instagramData.instagram_business_account.id
    
    console.log('\n✅ Instagram Business Account ID found!')
    console.log(`📸 Instagram Account ID: ${instagramAccountId}`)
    
    // Get Instagram account details
    const accountResponse = await fetch(`https://graph.instagram.com/v12.0/${instagramAccountId}?fields=id,username,name&access_token=${accessToken}`)
    const accountData = await accountResponse.json()
    
    if (accountData.username) {
      console.log(`📸 Instagram Username: @${accountData.username}`)
      console.log(`📸 Instagram Name: ${accountData.name}`)
    }
    
    console.log('\n🎉 SUCCESS! Your Instagram API credentials:')
    console.log('==========================================')
    console.log(`INSTAGRAM_ACCESS_TOKEN=${accessToken}`)
    console.log(`INSTAGRAM_BUSINESS_ACCOUNT_ID=${instagramAccountId}`)
    console.log(`META_APP_ID=${appId}`)
    console.log(`META_APP_SECRET=${appSecret}`)
    
    console.log('\n📝 Add these to your .env.local file:')
    console.log('--------------------------------------')
    console.log(`INSTAGRAM_ACCESS_TOKEN=${accessToken}`)
    console.log(`INSTAGRAM_BUSINESS_ACCOUNT_ID=${instagramAccountId}`)
    console.log(`META_APP_ID=${appId}`)
    console.log(`META_APP_SECRET=${appSecret}`)
    
    console.log('\n🧪 Test your setup:')
    console.log('node test-instagram-api.js')
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message)
  }
  
  rl.close()
}

// Run the helper
getInstagramCredentials().catch(console.error) 