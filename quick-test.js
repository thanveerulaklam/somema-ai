const fs = require('fs')
const path = require('path')

console.log('=== QUICK TEST - Page Discovery Fix ===\n')

// Test 1: Check if all required files exist
console.log('1. Checking required files...')
const requiredFiles = [
  'app/api/meta/oauth/route.ts',
  'lib/meta-api.ts',
  'app/api/meta/connect/route.ts',
  'app/api/meta/debug-pages/route.ts',
  'components/MetaConnection.tsx'
]

let allFilesExist = true
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file))
  console.log(`   ${exists ? '✅' : '❌'} ${file}`)
  if (!exists) allFilesExist = false
})

if (allFilesExist) {
  console.log('   ✅ All required files found')
} else {
  console.log('   ❌ Some files are missing')
}

// Test 2: Check OAuth scope in oauth route
console.log('\n2. Checking OAuth scope...')
try {
  const oauthFile = fs.readFileSync(path.join(__dirname, 'app/api/meta/oauth/route.ts'), 'utf8')
  const scopeMatch = oauthFile.match(/const scope = '([^']+)'/)
  
  if (scopeMatch) {
    const scope = scopeMatch[1]
    const requiredPermissions = [
      'pages_manage_posts',
      'pages_read_engagement', 
      'pages_show_list',
      'pages_read_user_content',
      'pages_manage_metadata',
      'instagram_basic',
      'instagram_content_publish',
      'business_management'
    ]
    
    const missingPermissions = requiredPermissions.filter(perm => !scope.includes(perm))
    
    if (missingPermissions.length === 0) {
      console.log('   ✅ OAuth scope includes all required permissions')
      console.log(`   📋 Scope: ${scope}`)
    } else {
      console.log('   ❌ Missing permissions in OAuth scope:')
      missingPermissions.forEach(perm => console.log(`      - ${perm}`))
    }
  } else {
    console.log('   ❌ Could not find OAuth scope in file')
  }
} catch (error) {
  console.log('   ❌ Error reading OAuth file:', error.message)
}

// Test 3: Check if pagination is implemented
console.log('\n3. Checking pagination implementation...')
try {
  const metaApiFile = fs.readFileSync(path.join(__dirname, 'lib/meta-api.ts'), 'utf8')
  
  const hasPagination = metaApiFile.includes('paging?.next') || metaApiFile.includes('data.paging')
  const hasWhileLoop = metaApiFile.includes('while (nextUrl)')
  
  if (hasPagination && hasWhileLoop) {
    console.log('   ✅ Pagination is implemented in Meta API service')
  } else {
    console.log('   ❌ Pagination may not be fully implemented')
  }
} catch (error) {
  console.log('   ❌ Error reading Meta API file:', error.message)
}

// Test 4: Check if Instagram discovery methods are implemented
console.log('\n4. Checking Instagram discovery methods...')
try {
  const oauthFile = fs.readFileSync(path.join(__dirname, 'app/api/meta/oauth/route.ts'), 'utf8')
  
  const hasBusinessAccount = oauthFile.includes('instagram_business_account')
  const hasConnectedAccount = oauthFile.includes('connected_instagram_account')
  const hasInstagramEdge = oauthFile.includes('instagram_accounts?fields=')
  
  if (hasBusinessAccount && hasConnectedAccount && hasInstagramEdge) {
    console.log('   ✅ All Instagram discovery methods are implemented')
    console.log('      - Instagram Business Account')
    console.log('      - Connected Instagram Account')
    console.log('      - Instagram Edge')
  } else {
    console.log('   ❌ Some Instagram discovery methods may be missing')
  }
} catch (error) {
  console.log('   ❌ Error checking Instagram discovery:', error.message)
}

// Test 5: Check if debug functionality is implemented
console.log('\n5. Checking debug functionality...')
try {
  const debugFile = fs.readFileSync(path.join(__dirname, 'app/api/meta/debug-pages/route.ts'), 'utf8')
  const connectionFile = fs.readFileSync(path.join(__dirname, 'components/MetaConnection.tsx'), 'utf8')
  
  const hasDebugEndpoint = debugFile.includes('DEBUG PAGES ENDPOINT') || debugFile.includes('debug-pages')
  const hasDebugButton = connectionFile.includes("'Debug Pages'") || connectionFile.includes('runDebug')
  
  if (hasDebugEndpoint && hasDebugButton) {
    console.log('   ✅ Debug functionality is implemented')
    console.log('      - Debug endpoint: /api/meta/debug-pages')
    console.log('      - Debug button in UI')
  } else {
    console.log('   ❌ Debug functionality may be incomplete')
    console.log('      - Debug endpoint found:', hasDebugEndpoint)
    console.log('      - Debug button found:', hasDebugButton)
  }
} catch (error) {
  console.log('   ❌ Error checking debug functionality:', error.message)
}

// Test 6: Check if multiple page discovery methods are implemented
console.log('\n6. Checking page discovery methods...')
try {
  const oauthFile = fs.readFileSync(path.join(__dirname, 'app/api/meta/oauth/route.ts'), 'utf8')
  
  const hasMeAccounts = oauthFile.includes('/me/accounts')
  const hasBusinessPages = oauthFile.includes('/me/businesses')
  const hasUserAccounts = oauthFile.includes('fields=accounts{')
  
  if (hasMeAccounts && hasBusinessPages && hasUserAccounts) {
    console.log('   ✅ All page discovery methods are implemented')
    console.log('      - /me/accounts (direct pages)')
    console.log('      - /me/businesses (business manager)')
    console.log('      - User accounts edge')
  } else {
    console.log('   ❌ Some page discovery methods may be missing')
  }
} catch (error) {
  console.log('   ❌ Error checking page discovery methods:', error.message)
}

console.log('\n=== QUICK TEST SUMMARY ===')
console.log('This test verifies that all the necessary code changes are in place.')
console.log('To fully test the functionality, you need to:')
console.log('1. Get an access token from your Meta app')
console.log('2. Run: export TEST_ACCESS_TOKEN="your_token"')
console.log('3. Run: node test-current-permissions.js')
console.log('4. Test the OAuth flow manually in your app')
console.log('\nSee TESTING_GUIDE.md for detailed testing instructions.')
