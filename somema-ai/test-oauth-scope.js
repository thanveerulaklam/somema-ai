require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOAuthScope() {
  try {
    console.log('🔍 Testing OAuth Scope and Permissions...');
    
    // Get the user profile with Meta credentials
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, meta_credentials')
      .not('meta_credentials', 'is', null);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    // Find the profile with the most pages
    const profileWithMostPages = profiles.reduce((max, profile) => {
      const pageCount = profile.meta_credentials.pages?.length || 0;
      const maxPageCount = max.meta_credentials.pages?.length || 0;
      return pageCount > maxPageCount ? profile : max;
    });

    const credentials = profileWithMostPages.meta_credentials;
    
    if (!credentials.accessToken) {
      console.error('No access token found');
      return;
    }

    console.log(`\n🔍 Testing with user: ${profileWithMostPages.user_id}`);
    console.log(`Current pages found: ${credentials.pages?.length || 0}`);

    // Test different API endpoints to see what we can access
    console.log('\n📋 Testing different API endpoints...');

    // 1. Test basic pages endpoint
    console.log('\n1️⃣ Testing /me/accounts...');
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${credentials.accessToken}`);
    const pagesData = await pagesResponse.json();
    
    if (pagesData.error) {
      console.error('Error fetching pages:', pagesData.error);
    } else {
      console.log(`✅ Found ${pagesData.data.length} pages via /me/accounts`);
      pagesData.data.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.name} (ID: ${page.id})`);
      });
    }

    // 2. Test with different fields
    console.log('\n2️⃣ Testing /me/accounts with extended fields...');
    const extendedResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${credentials.accessToken}`);
    const extendedData = await extendedResponse.json();
    
    if (extendedData.error) {
      console.error('Error fetching extended data:', extendedData.error);
    } else {
      console.log(`✅ Found ${extendedData.data.length} pages with extended fields`);
      extendedData.data.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.name} (ID: ${page.id})`);
        if (page.instagram_business_account) {
          console.log(`      📸 Instagram: ${page.instagram_business_account.id}`);
        }
      });
    }

    // 3. Test user permissions
    console.log('\n3️⃣ Testing user permissions...');
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${credentials.accessToken}`);
    const permissionsData = await permissionsResponse.json();
    
    if (permissionsData.error) {
      console.error('Error fetching permissions:', permissionsData.error);
    } else {
      console.log('✅ User permissions:');
      permissionsData.data.forEach(permission => {
        console.log(`   - ${permission.permission}: ${permission.status}`);
      });
    }

    // 4. Test user info
    console.log('\n4️⃣ Testing user info...');
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${credentials.accessToken}`);
    const userData = await userResponse.json();
    
    if (userData.error) {
      console.error('Error fetching user info:', userData.error);
    } else {
      console.log(`✅ User: ${userData.name} (ID: ${userData.id})`);
    }

    // 5. Test with different access token types
    console.log('\n5️⃣ Testing page access tokens...');
    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data.slice(0, 3)) { // Test first 3 pages
        console.log(`\n   Testing page: ${page.name}`);
        
        // Test page info with page access token
        const pageInfoResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=id,name,instagram_business_account&access_token=${page.access_token}`);
        const pageInfo = await pageInfoResponse.json();
        
        if (pageInfo.error) {
          console.log(`   ❌ Error: ${pageInfo.error.message}`);
        } else {
          console.log(`   ✅ Page info: ${pageInfo.name}`);
          if (pageInfo.instagram_business_account) {
            console.log(`   📸 Instagram connected: ${pageInfo.instagram_business_account.id}`);
          }
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`- Pages via /me/accounts: ${pagesData.data?.length || 0}`);
    console.log(`- Pages via extended fields: ${extendedData.data?.length || 0}`);
    console.log(`- Expected pages from OAuth: 13`);
    console.log(`- Missing pages: ${13 - (pagesData.data?.length || 0)}`);

    if ((pagesData.data?.length || 0) < 13) {
      console.log('\n⚠️  Missing pages detected!');
      console.log('This could be due to:');
      console.log('1. Insufficient OAuth permissions');
      console.log('2. Pages not accessible with current access token');
      console.log('3. Pages require additional permissions');
      console.log('4. Some pages might be in different accounts');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOAuthScope(); 