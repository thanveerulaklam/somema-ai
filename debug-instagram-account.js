require('dotenv').config({ path: '.env.local' });

async function checkInstagramAccount() {
  console.log('🔍 Checking Instagram Account Status');
  console.log('====================================\n');
  
  // Test credentials from your logs
  const testCredentials = {
    accessToken: 'EAAStBjAuXhQBPA4DPi1DbJluhcDHZBNDdLZCjDYxY8F2XtRSOxUlALhqYA7ZCgxkIzB4iXJqIQk2h0vqZBHCDPgvbDu0JfdEmInpKWHEITmQRJofMr7JxUGrnDQQkZAXCZA5RJZCfCQqE0FtLfcEgBnLxPTmLYC8HrDP58qws4OFzrNZA1uUc438Rl1cW8XKX3B14eSxCebCsQVXnGIAwCG6',
    instagramBusinessAccountId: '17841408548414463'
  };
  
  try {
    console.log('📱 Instagram Business Account ID:', testCredentials.instagramBusinessAccountId);
    console.log('🔑 Access Token (first 20 chars):', testCredentials.accessToken.substring(0, 20) + '...');
    
    // Check account info
    console.log('\n📊 Checking Account Information...');
    const accountResponse = await fetch(`https://graph.facebook.com/v18.0/${testCredentials.instagramBusinessAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${testCredentials.accessToken}`);
    const accountData = await accountResponse.json();
    
    if (accountData.error) {
      console.log('❌ Account info error:', accountData.error);
    } else {
      console.log('✅ Account info retrieved successfully');
      console.log('   Username:', accountData.username);
      console.log('   Name:', accountData.name);
      console.log('   Followers:', accountData.followers_count);
      console.log('   Media count:', accountData.media_count);
    }
    
    // Check permissions
    console.log('\n🔐 Checking Permissions...');
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${testCredentials.accessToken}`);
    const permissionsData = await permissionsResponse.json();
    
    if (permissionsData.error) {
      console.log('❌ Permissions check error:', permissionsData.error);
    } else {
      console.log('✅ Permissions retrieved successfully');
      console.log('   Available permissions:');
      permissionsData.data.forEach(perm => {
        console.log(`   - ${perm.permission}: ${perm.status}`);
      });
      
      // Check for Instagram permissions
      const instagramPerms = permissionsData.data.filter(p => p.permission.includes('instagram'));
      if (instagramPerms.length > 0) {
        console.log('\n📸 Instagram-specific permissions:');
        instagramPerms.forEach(perm => {
          console.log(`   - ${perm.permission}: ${perm.status}`);
        });
      } else {
        console.log('\n⚠️  No Instagram-specific permissions found');
      }
    }
    
    // Test media creation (without actually posting)
    console.log('\n🎬 Testing Media Creation API...');
    const testMediaData = {
      media_type: 'VIDEO',
      video_url: 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1754316840957-87vbrp.mp4',
      caption: 'Test video for debugging',
      access_token: testCredentials.accessToken
    };
    
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${testCredentials.instagramBusinessAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMediaData)
    });
    
    const mediaData = await mediaResponse.json();
    console.log('Media creation response status:', mediaResponse.status);
    
    if (mediaData.error) {
      console.log('❌ Media creation error:', mediaData.error);
      console.log('   Error code:', mediaData.error.code);
      console.log('   Error message:', mediaData.error.message);
      console.log('   Error subcode:', mediaData.error.error_subcode);
    } else {
      console.log('✅ Media creation successful');
      console.log('   Media ID:', mediaData.id);
      
      // Check media status
      console.log('\n📊 Checking Media Status...');
      const statusResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaData.id}?fields=status_code&access_token=${testCredentials.accessToken}`);
      const statusData = await statusResponse.json();
      
      if (statusData.error) {
        console.log('❌ Status check error:', statusData.error);
      } else {
        console.log('✅ Status check successful');
        console.log('   Status:', statusData.status_code);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during Instagram account check:', error.message);
  }
  
  console.log('\n📋 Instagram Account Requirements:');
  console.log('- Instagram Business account (not personal)');
  console.log('- Connected to Facebook Page');
  console.log('- Proper permissions granted');
  console.log('- Account not restricted or banned');
  console.log('- Content meets community guidelines');
  
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Ensure Instagram account is Business type');
  console.log('2. Check if account is connected to Facebook Page');
  console.log('3. Verify permissions are granted');
  console.log('4. Check if account has any restrictions');
  console.log('5. Ensure video meets Instagram requirements');
}

checkInstagramAccount(); 