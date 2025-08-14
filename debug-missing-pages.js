require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMissingPages() {
  try {
    console.log('🔍 Debugging Missing Pages...');
    
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

    console.log(`\n🔍 Debugging with user: ${profileWithMostPages.user_id}`);

    // Expected pages from OAuth flow
    const expectedPages = [
      { name: 'K Fashion', id: '144583238732195' },
      { name: 'Catch The Letters', id: '375797345622256' },
      { name: 'ATM Global Enterprises', id: '796074550246753' },
      { name: 'Brand E Menswear', id: '193310037195933' },
      { name: 'Somema AI', id: '718043988057934' },
      { name: 'What If?', id: '326804884895438' },
      { name: 'M Zone Menswear', id: '1696602057019472' },
      { name: 'Brand E', id: '213221921863840' },
      { name: 'Below500.com', id: '112732073542349' },
      { name: 'Fit places', id: '189067927632415' },
      { name: 'Melt Messenger', id: '514079121795367' },
      { name: 'Salesify', id: '543577692177953' },
      { name: 'Cinemento IOS', id: '337314499476270' }
    ];

    console.log(`\n📋 Expected pages (from OAuth): ${expectedPages.length}`);
    expectedPages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
    });

    // Test different API endpoints
    console.log('\n🔄 Testing different API endpoints...');

    // 1. Test /me/accounts (current method)
    console.log('\n1️⃣ Testing /me/accounts...');
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${credentials.accessToken}`);
    const pagesData = await pagesResponse.json();
    
    if (pagesData.error) {
      console.error('Error fetching pages:', pagesData.error);
    } else {
      console.log(`✅ Found ${pagesData.data.length} pages via /me/accounts`);
      const foundPageIds = pagesData.data.map(page => page.id);
      
      // Check which expected pages are missing
      const missingPages = expectedPages.filter(page => !foundPageIds.includes(page.id));
      console.log(`❌ Missing pages: ${missingPages.length}`);
      missingPages.forEach(page => {
        console.log(`   - ${page.name} (ID: ${page.id})`);
      });
    }

    // 2. Test with different fields
    console.log('\n2️⃣ Testing /me/accounts with all fields...');
    const extendedResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${credentials.accessToken}`);
    const extendedData = await extendedResponse.json();
    
    if (extendedData.error) {
      console.error('Error fetching extended data:', extendedData.error);
    } else {
      console.log(`✅ Found ${extendedData.data.length} pages with extended fields`);
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

    // 4. Test if we can access specific missing pages directly
    console.log('\n4️⃣ Testing direct access to missing pages...');
    const missingPageIds = ['144583238732195', '514079121795367', '543577692177953', '337314499476270'];
    
    for (const pageId of missingPageIds) {
      try {
        const pageResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=id,name&access_token=${credentials.accessToken}`);
        const pageData = await pageResponse.json();
        
        if (pageData.error) {
          console.log(`❌ Page ${pageId}: ${pageData.error.message}`);
        } else {
          console.log(`✅ Page ${pageId}: ${pageData.name}`);
        }
      } catch (error) {
        console.log(`❌ Page ${pageId}: ${error.message}`);
      }
    }

    // 5. Test with different access token types
    console.log('\n5️⃣ Testing with page access tokens...');
    if (pagesData.data && pagesData.data.length > 0) {
      for (const page of pagesData.data.slice(0, 2)) { // Test first 2 pages
        console.log(`\n   Testing page: ${page.name} (ID: ${page.id})`);
        
        // Test if this page can access the missing pages
        const pageInfoResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=id,name,instagram_business_account&access_token=${page.access_token}`);
        const pageInfo = await pageInfoResponse.json();
        
        if (pageInfo.error) {
          console.log(`   ❌ Error: ${pageInfo.error.message}`);
        } else {
          console.log(`   ✅ Page info: ${pageInfo.name}`);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`- Expected pages: ${expectedPages.length}`);
    console.log(`- Found pages: ${pagesData.data?.length || 0}`);
    console.log(`- Missing pages: ${expectedPages.length - (pagesData.data?.length || 0)}`);

    if ((pagesData.data?.length || 0) < expectedPages.length) {
      console.log('\n⚠️  Missing pages detected!');
      console.log('Possible reasons:');
      console.log('1. Pages require different permissions');
      console.log('2. Pages are in different Facebook accounts');
      console.log('3. Pages have restricted access');
      console.log('4. OAuth scope is insufficient');
    }

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugMissingPages(); 