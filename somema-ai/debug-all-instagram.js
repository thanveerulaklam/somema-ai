require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAllInstagram() {
  try {
    console.log('🔍 Comprehensive Instagram Debug...');
    
    // Get the user profile with the most pages (the one with 9 pages)
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

    console.log(`\n🔍 Debugging profile with ${profileWithMostPages.meta_credentials.pages?.length || 0} pages...`);
    console.log(`User ID: ${profileWithMostPages.user_id}`);

    const credentials = profileWithMostPages.meta_credentials;
    
    if (!credentials.accessToken) {
      console.error('No access token found');
      return;
    }

    console.log('\n📋 Current stored data:');
    console.log('- Access Token:', credentials.accessToken ? 'Present' : 'Missing');
    console.log('- Pages stored:', credentials.pages?.length || 0);
    console.log('- Connected accounts:', credentials.connected?.length || 0);

    // Fetch fresh data from Meta API
    console.log('\n🔄 Fetching fresh data from Meta API...');
    
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${credentials.accessToken}`);
    const pagesData = await pagesResponse.json();
    
    if (pagesData.error) {
      console.error('Error fetching pages:', pagesData.error);
      return;
    }

    console.log(`\n📄 Fresh Facebook Pages from API (${pagesData.data.length}):`);
    pagesData.data.forEach((page, index) => {
      console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
    });

    // Check each page for Instagram accounts
    console.log('\n📸 Checking Instagram accounts for each page...');
    
    const pagesWithInstagram = [];
    
    for (const page of pagesData.data) {
      console.log(`\n🔍 Checking: ${page.name} (ID: ${page.id})`);
      
      try {
        // Check for Instagram business account
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${credentials.accessToken}`
        );
        const instagramData = await instagramResponse.json();
        
        console.log(`   Instagram business account:`, instagramData.instagram_business_account ? 'Found' : 'Not found');
        
        if (instagramData.instagram_business_account) {
          // Get Instagram account details
          const instagramDetailsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${instagramData.instagram_business_account.id}?fields=id,username,name&access_token=${credentials.accessToken}`
          );
          const instagramDetails = await instagramDetailsResponse.json();
          
          if (!instagramDetails.error) {
            console.log(`   ✅ Instagram: ${instagramDetails.username} (ID: ${instagramDetails.id})`);
            pagesWithInstagram.push({
              ...page,
              instagram_accounts: [instagramDetails]
            });
          } else {
            console.log(`   ❌ Error getting Instagram details:`, instagramDetails.error);
          }
        } else {
          // Check if there are any other Instagram-related fields
          console.log(`   Checking for other Instagram fields...`);
          const detailedResponse = await fetch(
            `https://graph.facebook.com/v18.0/${page.id}?fields=id,name,instagram_business_account,connected_instagram_account&access_token=${credentials.accessToken}`
          );
          const detailedData = await detailedResponse.json();
          console.log(`   Detailed page data:`, JSON.stringify(detailedData, null, 2));
        }
        
      } catch (error) {
        console.error(`   ❌ Error checking page ${page.name}:`, error);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Total Facebook pages: ${pagesData.data.length}`);
    console.log(`- Pages with Instagram: ${pagesWithInstagram.length}`);
    console.log(`- Total Instagram accounts found: ${pagesWithInstagram.reduce((total, page) => total + page.instagram_accounts.length, 0)}`);

    // Show all Instagram accounts found
    console.log(`\n📸 All Instagram accounts found:`);
    pagesWithInstagram.forEach((page, index) => {
      console.log(`${index + 1}. ${page.name} → ${page.instagram_accounts[0].username}`);
    });

    // Check if Meltmessenger and salesify_app are in the page names
    console.log(`\n🔍 Looking for specific pages:`);
    const meltmessengerPage = pagesData.data.find(page => 
      page.name.toLowerCase().includes('meltmessenger') || 
      page.name.toLowerCase().includes('melt') ||
      page.name.toLowerCase().includes('messenger')
    );
    
    const salesifyPage = pagesData.data.find(page => 
      page.name.toLowerCase().includes('salesify') || 
      page.name.toLowerCase().includes('sales')
    );

    if (meltmessengerPage) {
      console.log(`✅ Found Meltmessenger page: ${meltmessengerPage.name} (ID: ${meltmessengerPage.id})`);
    } else {
      console.log(`❌ Meltmessenger page not found in current pages`);
    }

    if (salesifyPage) {
      console.log(`✅ Found Salesify page: ${salesifyPage.name} (ID: ${salesifyPage.id})`);
    } else {
      console.log(`❌ Salesify page not found in current pages`);
    }

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugAllInstagram(); 