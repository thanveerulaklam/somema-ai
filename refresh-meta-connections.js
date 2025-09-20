require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshMetaConnections() {
  try {
    console.log('🔄 Refreshing Meta connections...');
    
    // Get all user profiles with Meta credentials
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, meta_credentials')
      .not('meta_credentials', 'is', null);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log(`Found ${profiles.length} profiles with Meta credentials`);

    for (const profile of profiles) {
      const credentials = profile.meta_credentials;
      
      if (!credentials.accessToken) {
        console.log(`Skipping profile ${profile.user_id} - no access token`);
        continue;
      }

      console.log(`\n🔄 Refreshing connections for user ${profile.user_id}...`);

      try {
        // Fetch all Facebook pages
        const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${credentials.accessToken}`);
        const pagesData = await pagesResponse.json();
        
        if (pagesData.error) {
          console.error('Error fetching pages:', pagesData.error);
          continue;
        }

        console.log(`Found ${pagesData.data.length} Facebook pages`);

        // Fetch Instagram accounts for each page
        const pagesWithInstagram = await Promise.all(
          pagesData.data.map(async (page) => {
            const instagramResponse = await fetch(
              `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${credentials.accessToken}`
            );
            const instagramData = await instagramResponse.json();
            
            let instagramAccounts = [];
            if (instagramData.instagram_business_account) {
              // Get Instagram account details
              const instagramDetailsResponse = await fetch(
                `https://graph.facebook.com/v18.0/${instagramData.instagram_business_account.id}?fields=id,username,name&access_token=${credentials.accessToken}`
              );
              const instagramDetails = await instagramDetailsResponse.json();
              
              if (!instagramDetails.error) {
                instagramAccounts = [instagramDetails];
              }
            }
            
            return {
              ...page,
              instagram_accounts: instagramAccounts
            };
          })
        );

        // Create connected accounts list - automatically connect all available pages and Instagram accounts
        const connectedAccounts = [];
        for (const page of pagesWithInstagram) {
          if (page.instagram_accounts && page.instagram_accounts.length > 0) {
            for (const instagramAccount of page.instagram_accounts) {
              connectedAccounts.push({
                pageId: page.id,
                instagramId: instagramAccount.id
              });
            }
          }
        }

        console.log(`Found ${connectedAccounts.length} Instagram accounts to connect`);

        // Update the database
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            meta_credentials: {
              accessToken: credentials.accessToken,
              pages: pagesWithInstagram,
              connected: connectedAccounts
            }
          })
          .eq('user_id', profile.user_id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        } else {
          console.log(`✅ Successfully updated profile for user ${profile.user_id}`);
          console.log(`   - Pages: ${pagesWithInstagram.length}`);
          console.log(`   - Connected Instagram accounts: ${connectedAccounts.length}`);
          
          // Show details
          pagesWithInstagram.forEach((page, index) => {
            console.log(`   ${index + 1}. ${page.name} (ID: ${page.id})`);
            if (page.instagram_accounts && page.instagram_accounts.length > 0) {
              page.instagram_accounts.forEach((insta, instaIndex) => {
                console.log(`      - ${insta.username} (ID: ${insta.id})`);
              });
            }
          });
        }

      } catch (error) {
        console.error(`Error refreshing connections for user ${profile.user_id}:`, error);
      }
    }

    console.log('\n✅ Meta connections refresh completed!');

  } catch (error) {
    console.error('Refresh failed:', error);
  }
}

refreshMetaConnections(); 