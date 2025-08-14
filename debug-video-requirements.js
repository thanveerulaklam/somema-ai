// Using built-in fetch (available in Node.js 18+)

// Instagram video requirements
const INSTAGRAM_REQUIREMENTS = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxDuration: 60, // 60 seconds for regular posts
  maxReelsDuration: 90, // 90 seconds for reels
  supportedFormats: ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv'],
  aspectRatio: {
    min: 1.91, // 16:9
    max: 4/5   // 4:5
  }
};

async function checkVideoRequirements(videoUrl) {
  console.log('🔍 Checking video requirements for:', videoUrl);
  
  try {
    // Get video file info
    const response = await fetch(videoUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    console.log('\n📊 Video File Analysis:');
    console.log('Content-Type:', contentType);
    console.log('File Size:', contentLength ? `${(contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown');
    
    if (contentLength) {
      const sizeInMB = contentLength / 1024 / 1024;
      if (sizeInMB > INSTAGRAM_REQUIREMENTS.maxFileSize / 1024 / 1024) {
        console.log('❌ File size too large for Instagram');
        console.log(`   Current: ${sizeInMB.toFixed(2)} MB`);
        console.log(`   Maximum: ${(INSTAGRAM_REQUIREMENTS.maxFileSize / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.log('✅ File size within Instagram limits');
      }
    }
    
    // Check file extension
    const fileExtension = videoUrl.split('.').pop()?.toLowerCase();
    console.log('File Extension:', fileExtension);
    
    if (fileExtension && INSTAGRAM_REQUIREMENTS.supportedFormats.includes(`.${fileExtension}`)) {
      console.log('✅ File format supported by Instagram');
    } else {
      console.log('❌ File format may not be supported');
      console.log('   Supported formats:', INSTAGRAM_REQUIREMENTS.supportedFormats.join(', '));
    }
    
    // Try to get video metadata (this might not work for all URLs)
    try {
      const videoResponse = await fetch(videoUrl);
      const buffer = await videoResponse.buffer();
      console.log('\n📹 Video Buffer Size:', `${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Basic format detection
      if (buffer.length > 0) {
        console.log('✅ Video file is accessible and readable');
      }
    } catch (error) {
      console.log('⚠️  Could not read video buffer:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking video:', error.message);
  }
  
  console.log('\n📋 Instagram Video Requirements:');
  console.log('- Maximum file size: 100MB');
  console.log('- Maximum duration: 60 seconds (regular posts)');
  console.log('- Maximum duration: 90 seconds (reels)');
  console.log('- Supported formats: MP4, MOV, AVI, WMV, FLV, WEBM, MKV');
  console.log('- Aspect ratio: 16:9 to 4:5');
  console.log('- Minimum resolution: 600x600');
  console.log('- Maximum resolution: 1080x1350');
  
  console.log('\n🔧 Recommendations:');
  console.log('1. Ensure video is under 100MB');
  console.log('2. Keep duration under 60 seconds for regular posts');
  console.log('3. Use MP4 format for best compatibility');
  console.log('4. Check aspect ratio (should be between 16:9 and 4:5)');
  console.log('5. Ensure Instagram Business account is properly connected');
}

// Test with the video URL from your logs
const testVideoUrl = 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1754316840957-87vbrp.mp4';

console.log('🎬 Instagram Video Requirements Debug Tool');
console.log('==========================================\n');

checkVideoRequirements(testVideoUrl); 