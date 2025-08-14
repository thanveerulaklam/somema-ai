require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMissingPages() {
  try {
    console.log('🔧 Adding Missing Pages...');
    
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

    console.log(`\n🔧 Adding missing pages for user: ${profileWithMostPages.user_id}`);

    // Missing pages that are accessible but not returned by /me/accounts
    const missingPages = [
      { name: 'K Fashion', id: '144583238732195' },
      { name: 'Melt Messenger', id: '514079121795367' },
      { name: 'Salesify', id: '543577692177953' },
      { name: 'Cinemento IOS', id: '337314499476270' }
    ];

    console.log(`\n📋 Adding ${missingPages.length} missing pages...`);

    // Get current pages
    const currentPages = credentials.pages || [];
    const updatedPages = [...currentPages];

    // Add missing pages
    for (const missingPage of missingPages) {
      console.log(`\n🔍 Processing: ${missingPage.name} (ID: ${missingPage.id})`);
      
      try {
        // Get page details
        const pageResponse = await fetch(`https://graph.facebook.com/v18.0/${missingPage.id}?fields=id,name,category,category_list,tasks&access_token=${credentials.accessToken}`);
        const pageData = await pageResponse.json();
        
        if (pageData.error) {
          console.log(`❌ Error getting page details: ${pageData.error.message}`);
          continue;
        }

        // Check for Instagram business account
        const instagramResponse = await fetch(`https://graph.facebook.com/v18.0/${missingPage.id}?fields=instagram_business_account&access_token=${credentials.accessToken}`);
        const instagramData = await instagramResponse.json();
        
        let instagramAccounts = [];
        if (instagramData.instagram_business_account) {
          // Get Instagram account details
          const instagramDetailsResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramData.instagram_business_account.id}?fields=id,username,name&access_token=${credentials.accessToken}`);
          const instagramDetails = await instagramDetailsResponse.json();
          
          if (!instagramDetails.error) {
            instagramAccounts = [instagramDetails];
            console.log(`✅ Instagram: ${instagramDetails.username} (ID: ${instagramDetails.id})`);
          }
        }

        // Create page object
        const pageObject = {
          id: pageData.id,
          name: pageData.name,
          category: pageData.category,
          category_list: pageData.category_list,
          tasks: pageData.tasks,
          access_token: credentials.accessToken, // Use user access token since we don't have page access token
          instagram_accounts: instagramAccounts
        };

        // Check if page already exists
        const existingPageIndex = updatedPages.findIndex(page => page.id === missingPage.id);
        if (existingPageIndex >= 0) {
          console.log(`⚠️  Page already exists, updating...`);
          updatedPages[existingPageIndex] = pageObject;
        } else {
          console.log(`✅ Adding new page: ${pageData.name}`);
          updatedPages.push(pageObject);
        }

      } catch (error) {
        console.error(`❌ Error processing ${missingPage.name}:`, error);
      }
    }

    // Create connected accounts list - automatically connect all available pages and Instagram accounts
    const connectedAccounts = [];
    for (const page of updatedPages) {
      if (page.instagram_accounts && page.instagram_accounts.length > 0) {
        for (const instagramAccount of page.instagram_accounts) {
          connectedAccounts.push({
            pageId: page.id,
            instagramId: instagramAccount.id
          });
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Total pages: ${updatedPages.length}`);
    console.log(`- Connected Instagram accounts: ${connectedAccounts.length}`);

    // Update the database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        meta_credentials: {
          accessToken: credentials.accessToken,
          pages: updatedPages,
          connected: connectedAccounts
        }
      })
      .eq('user_id', profileWithMostPages.user_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    } else {
      console.log(`✅ Successfully updated profile!`);
      console.log(`\n📄 All pages now:`);
      updatedPages.forEach((page, index) => {
        console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
        if (page.instagram_accounts && page.instagram_accounts.length > 0) {
          page.instagram_accounts.forEach((insta, instaIndex) => {
            console.log(`   📸 ${insta.username} (ID: ${insta.id})`);
          });
        }
      });
      
      console.log(`\n🔗 Connected accounts: ${connectedAccounts.length}`);
      connectedAccounts.forEach((connection, index) => {
        const page = updatedPages.find(p => p.id === connection.pageId);
        const insta = page?.instagram_accounts?.find(i => i.id === connection.instagramId);
        console.log(`${index + 1}. ${page?.name} → ${insta?.username}`);
      });
    }

  } catch (error) {
    console.error('Add missing pages failed:', error);
  }
}

addMissingPages(); 