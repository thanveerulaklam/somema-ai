// Test OAuth URL generation for localhost
console.log('=== TESTING OAUTH URL GENERATION ===\n')

// Simulate the OAuth URL generation logic
const META_APP_ID = process.env.META_APP_ID || 'YOUR_APP_ID'
const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content,pages_manage_metadata,instagram_basic,instagram_content_publish,business_management'

// Test localhost redirect URI
const localhostRedirectUri = 'http://localhost:3000/api/meta/oauth'
const oauthState = Math.random().toString(36).substring(7)

const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(localhostRedirectUri)}&scope=${encodeURIComponent(scope)}&state=${oauthState}&auth_type=reauthenticate&response_type=code`

console.log('OAuth URL for localhost:')
console.log(authUrl)
console.log('\nDecoded redirect URI:', localhostRedirectUri)
console.log('\nDecoded scope:', scope)

console.log('\n=== CHECKLIST FOR META APP CONFIGURATION ===')
console.log('1. Go to Meta for Developers → Your App → Facebook Login → Settings')
console.log('2. Add to Valid OAuth Redirect URIs:')
console.log('   - http://localhost:3000/api/meta/oauth')
console.log('   - http://127.0.0.1:3000/api/meta/oauth')
console.log('3. Enable Client OAuth Login: ON')
console.log('4. Enable Web OAuth Login: ON')
console.log('5. In App Settings → Basic → App Domains, add:')
console.log('   - localhost')
console.log('   - 127.0.0.1')
console.log('\n6. Make sure your app is in Development mode for testing')
