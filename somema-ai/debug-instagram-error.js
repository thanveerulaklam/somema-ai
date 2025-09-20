require('dotenv').config({ path: '.env.local' });

async function debugInstagramError() {
  console.log('🔍 Detailed Instagram Error Debug');
  console.log('==================================\n');
  
  const testCredentials = {
    accessToken: 'EAAStBjAuXhQBPA4DPi1DbJluhcDHZBNDdLZCjDYxY8F2XtRSOxUlALhqYA7ZCgxkIzB4iXJqIQk2h0vqZBHCDPgvbDu0JfdEmInpKWHEITmQRJofMr7JxUGrnDQQkZAXCZA5RJZCfCQqE0FtLfcEgBnLxPTmLYC8HrDP58qws4OFzrNZA1uUc438Rl1cW8XKX3B14eSxCebCsQVXnGIAwCG6',
    instagramBusinessAccountId: '17841408548414463'
  };
  
  const videoUrl = 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1754316840957-87vbrp.mp4';
  
  try {
    console.log('📱 Testing Instagram Media Creation...');
    
    // Test 1: Try with REELS
    console.log('\n🎬 Test 1: REELS media type');
    const reelsData = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: 'Test video for debugging',
      access_token: testCredentials.accessToken
    };
    
    const reelsResponse = await fetch(`https://graph.facebook.com/v18.0/${testCredentials.instagramBusinessAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reelsData)
    });
    
    const reelsResult = await reelsResponse.json();
    console.log('REELS Response Status:', reelsResponse.status);
    console.log('REELS Response:', JSON.stringify(reelsResult, null, 2));
    
    if (reelsResult.id) {
      console.log('✅ REELS media created successfully');
      
      // Check status with different fields
      console.log('\n📊 Checking REELS status with different fields...');
      
      const statusFields = [
        'status_code',
        'status_code,processing_info',
        'status_code,error',
        'status_code,processing_info,error',
        'id,status_code',
        'id,status_code,processing_info'
      ];
      
      for (const fields of statusFields) {
        try {
          const statusResponse = await fetch(`https://graph.facebook.com/v18.0/${reelsResult.id}?fields=${fields}&access_token=${testCredentials.accessToken}`);
          const statusData = await statusResponse.json();
          console.log(`\nFields "${fields}":`, JSON.stringify(statusData, null, 2));
        } catch (error) {
          console.log(`Fields "${fields}" failed:`, error.message);
        }
      }
    }
    
    // Test 2: Try with VIDEO (deprecated but let's see the error)
    console.log('\n🎬 Test 2: VIDEO media type (deprecated)');
    const videoData = {
      media_type: 'VIDEO',
      video_url: videoUrl,
      caption: 'Test video for debugging',
      access_token: testCredentials.accessToken
    };
    
    const videoResponse = await fetch(`https://graph.facebook.com/v18.0/${testCredentials.instagramBusinessAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoData)
    });
    
    const videoResult = await videoResponse.json();
    console.log('VIDEO Response Status:', videoResponse.status);
    console.log('VIDEO Response:', JSON.stringify(videoResult, null, 2));
    
    // Test 3: Try with different video URL format
    console.log('\n🎬 Test 3: Different video URL format');
    const altVideoData = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: 'Test video for debugging',
      access_token: testCredentials.accessToken,
      // Try adding additional parameters
      published: false
    };
    
    const altResponse = await fetch(`https://graph.facebook.com/v18.0/${testCredentials.instagramBusinessAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(altVideoData)
    });
    
    const altResult = await altResponse.json();
    console.log('Alternative Response Status:', altResponse.status);
    console.log('Alternative Response:', JSON.stringify(altResult, null, 2));
    
    // Test 4: Check Instagram account capabilities
    console.log('\n📱 Test 4: Instagram Account Capabilities');
    const capabilitiesResponse = await fetch(`https://graph.facebook.com/v18.0/${testCredentials.instagramBusinessAccountId}?fields=id,username,name,media_count,account_type&access_token=${testCredentials.accessToken}`);
    const capabilitiesData = await capabilitiesResponse.json();
    console.log('Account Capabilities:', JSON.stringify(capabilitiesData, null, 2));
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  }
  
  console.log('\n📋 Instagram Reels Requirements:');
  console.log('- Video duration: 3-90 seconds');
  console.log('- Aspect ratio: 9:16 (vertical)');
  console.log('- Resolution: 1080x1920 (minimum)');
  console.log('- File size: Up to 100MB');
  console.log('- Format: MP4 with H.264 codec');
  console.log('- Frame rate: 30fps or less');
  console.log('- Audio: AAC codec');
  
  console.log('\n🔧 Possible Issues:');
  console.log('1. Video aspect ratio not 9:16 (vertical)');
  console.log('2. Video duration too long/short');
  console.log('3. Video resolution too low');
  console.log('4. Video codec not supported');
  console.log('5. Instagram account restrictions');
  console.log('6. Video content violates guidelines');
}

debugInstagramError(); 