require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInstagramAccounts() {
  try {
    console.log('🔍 Testing Instagram accounts...');
    
    // Get all user profiles with Meta credentials
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('meta_credentials')
      .not('meta_credentials', 'is', null);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log(`Found ${profiles.length} profiles with Meta credentials`);

    for (const profile of profiles) {
      const credentials = profile.meta_credentials;
      console.log('\n📋 Profile Meta Credentials:');
      console.log('- Access Token:', credentials.accessToken ? 'Present' : 'Missing');
      console.log('- Pages:', credentials.pages?.length || 0);
      console.log('- Connected Accounts:', credentials.connected?.length || 0);

      if (credentials.pages) {
        console.log('\n📄 Facebook Pages:');
        credentials.pages.forEach((page, index) => {
          console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
          console.log(`   Instagram Accounts: ${page.instagram_accounts?.length || 0}`);
          
          if (page.instagram_accounts) {
            page.instagram_accounts.forEach((insta, instaIndex) => {
              console.log(`   - ${instaIndex + 1}. ${insta.username} (ID: ${insta.id})`);
            });
          }
        });
      }

      if (credentials.connected) {
        console.log('\n🔗 Connected Accounts:');
        credentials.connected.forEach((connection, index) => {
          console.log(`${index + 1}. Page ID: ${connection.pageId}, Instagram ID: ${connection.instagramId}`);
        });
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testInstagramAccounts(); 