require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugOAuthPages() {
  try {
    console.log('🔍 Debugging OAuth Pages Issue...');
    
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
    console.log(`📊 Current stored pages: ${credentials.pages?.length || 0}`);

    // Expected pages from OAuth flow (what should be shown)
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

    // Test what /me/accounts actually returns
    console.log('\n🔄 Testing /me/accounts endpoint...');
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${credentials.accessToken}`);
    const pagesData = await pagesResponse.json();
    
    if (pagesData.error) {
      console.error('Error fetching pages:', pagesData.error);
    } else {
      console.log(`✅ /me/accounts returned ${pagesData.data.length} pages:`);
      pagesData.data.forEach((page, index) => {
        console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
      });
    }

    // Test what's stored in the database
    console.log('\n💾 Testing stored pages in database...');
    if (credentials.pages) {
      console.log(`✅ Database has ${credentials.pages.length} pages:`);
      credentials.pages.forEach((page, index) => {
        console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
      });
    } else {
      console.log('❌ No pages stored in database');
    }

    // Test what the /api/meta/connect endpoint returns
    console.log('\n🔌 Testing /api/meta/connect endpoint...');
    try {
      const connectResponse = await fetch('http://localhost:3000/api/meta/connect', {
        headers: {
          'Authorization': `Bearer ${profileWithMostPages.user_id}`
        }
      });
      
      if (connectResponse.ok) {
        const connectData = await connectResponse.json();
        console.log(`✅ /api/meta/connect returned ${connectData.available?.length || 0} pages:`);
        if (connectData.available) {
          connectData.available.forEach((page, index) => {
            console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
          });
        }
      } else {
        console.log('❌ /api/meta/connect failed:', connectResponse.status);
      }
    } catch (error) {
      console.log('❌ Error testing /api/meta/connect:', error.message);
    }

    // Test direct access to missing pages
    console.log('\n🎯 Testing direct access to missing pages...');
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

    // Test user permissions
    console.log('\n🔐 Testing user permissions...');
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

    console.log('\n📊 Summary:');
    console.log(`- Expected pages: ${expectedPages.length}`);
    console.log(`- /me/accounts returned: ${pagesData.data?.length || 0}`);
    console.log(`- Database stored: ${credentials.pages?.length || 0}`);
    console.log(`- Missing pages: ${expectedPages.length - (pagesData.data?.length || 0)}`);

    if ((pagesData.data?.length || 0) < expectedPages.length) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('The /me/accounts endpoint is not returning all accessible pages.');
      console.log('This suggests that some pages require different permissions or access methods.');
      console.log('\n🔧 SOLUTION NEEDED:');
      console.log('We need to manually check and add the missing pages that are accessible but not returned by /me/accounts.');
    }

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugOAuthPages(); 