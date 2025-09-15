// Quick test for different user accounts
console.log('=== QUICK USER ACCOUNT TEST ===\n')

// Test different user scenarios
const testScenarios = [
  {
    name: 'Regular User (Limited Access)',
    description: 'User with no Business Manager access, few pages',
    expectedResults: {
      businessAccess: false,
      pageCount: '< 5',
      userType: 'regular',
      guidance: 'should show'
    }
  },
  {
    name: 'Developer User (Full Access)',
    description: 'User with Business Manager access, many pages',
    expectedResults: {
      businessAccess: true,
      pageCount: '> 5',
      userType: 'developer',
      guidance: 'should not show'
    }
  },
  {
    name: 'Business Manager User (Multiple Businesses)',
    description: 'User with multiple businesses and many pages',
    expectedResults: {
      businessAccess: true,
      pageCount: '> 10',
      userType: 'developer',
      guidance: 'should not show'
    }
  }
]

console.log('📋 Test Scenarios:')
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`)
  console.log(`   ${scenario.description}`)
  console.log(`   Expected: ${scenario.expectedResults.userType} user, ${scenario.expectedResults.pageCount} pages`)
  console.log('')
})

console.log('🧪 How to Test:')
console.log('')
console.log('1. Get access tokens from different user accounts:')
console.log('   - Regular Facebook account (not developer)')
console.log('   - Facebook developer account')
console.log('   - Account with Business Manager access')
console.log('')
console.log('2. Test each account:')
console.log('   export TEST_ACCESS_TOKEN="token_here"')
console.log('   node test-enhanced-discovery.js')
console.log('')
console.log('3. Compare results with expected outcomes above')
console.log('')
console.log('4. Test OAuth flow in your app:')
console.log('   - Regular user: Should NOT see "Businesses" section')
console.log('   - Developer user: Should see "Businesses" section')
console.log('   - Business Manager user: Should see multiple businesses')
console.log('')
console.log('5. Check settings page for user guidance:')
console.log('   - Regular user with < 5 pages: Should see warning')
console.log('   - Developer user: Should NOT see warning')
console.log('   - Business Manager user: Should NOT see warning')
console.log('')
console.log('6. Use debug button to verify discovery methods')
console.log('')

// Check if we have a token to test with
const accessToken = process.env.TEST_ACCESS_TOKEN

if (accessToken) {
  console.log('🔍 Token detected! Running quick test...')
  console.log('')
  
  // Import the test function
  const { testEnhancedDiscovery } = require('./test-enhanced-discovery.js')
  
  // Run the test
  testEnhancedDiscovery()
} else {
  console.log('💡 To run a quick test:')
  console.log('   export TEST_ACCESS_TOKEN="your_token_here"')
  console.log('   node quick-user-test.js')
  console.log('')
  console.log('📚 See USER_TESTING_GUIDE.md for detailed testing instructions')
}
