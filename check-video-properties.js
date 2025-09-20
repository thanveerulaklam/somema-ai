const { exec } = require('child_process');
// Using built-in fetch (available in Node.js 18+)

async function checkVideoProperties() {
  console.log('🎬 Checking Video Properties');
  console.log('============================\n');
  
  const videoUrl = 'https://yfmypikqgegvookjzvyv.supabase.co/storage/v1/object/public/media/media/c99ec3d7-f5db-4003-ab22-45f7cda4f84a/1754316840957-87vbrp.mp4';
  
  try {
    // Download video to temp file
    console.log('📥 Downloading video for analysis...');
    const response = await fetch(videoUrl);
    const buffer = await response.arrayBuffer();
    const fs = require('fs');
    const tempFile = '/tmp/video_analysis.mp4';
    fs.writeFileSync(tempFile, Buffer.from(buffer));
    
    console.log('✅ Video downloaded successfully');
    
    // Use ffprobe to analyze video
    exec(`ffprobe -v quiet -print_format json -show_format -show_streams "${tempFile}"`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ ffprobe not available, trying alternative method...');
        console.log('Please install ffmpeg: brew install ffmpeg');
        return;
      }
      
      const videoInfo = JSON.parse(stdout);
      console.log('\n📊 Video Analysis Results:');
      console.log('==========================');
      
      const format = videoInfo.format;
      const videoStream = videoInfo.streams.find(s => s.codec_type === 'video');
      const audioStream = videoInfo.streams.find(s => s.codec_type === 'audio');
      
      console.log('📹 Video Stream:');
      console.log(`   Codec: ${videoStream?.codec_name || 'Unknown'}`);
      console.log(`   Resolution: ${videoStream?.width}x${videoStream?.height}`);
      console.log(`   Frame Rate: ${videoStream?.r_frame_rate || 'Unknown'}`);
      console.log(`   Duration: ${format?.duration || 'Unknown'} seconds`);
      
      console.log('\n🔊 Audio Stream:');
      console.log(`   Codec: ${audioStream?.codec_name || 'None'}`);
      console.log(`   Sample Rate: ${audioStream?.sample_rate || 'Unknown'}`);
      
      console.log('\n📁 File Info:');
      console.log(`   Size: ${(format?.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Bitrate: ${(format?.bit_rate / 1024).toFixed(2)} kbps`);
      
      // Check Instagram requirements
      console.log('\n✅ Instagram Reels Requirements Check:');
      console.log('=====================================');
      
      const width = parseInt(videoStream?.width);
      const height = parseInt(videoStream?.height);
      const duration = parseFloat(format?.duration);
      const codec = videoStream?.codec_name;
      const audioCodec = audioStream?.codec_name;
      
      // Aspect ratio check (should be 9:16 = 0.5625)
      const aspectRatio = width / height;
      const isVertical = aspectRatio < 1;
      const isCorrectRatio = Math.abs(aspectRatio - 0.5625) < 0.1;
      
      console.log(`Aspect Ratio: ${aspectRatio.toFixed(3)} (${width}:${height})`);
      console.log(`   Vertical: ${isVertical ? '✅' : '❌'} (should be vertical)`);
      console.log(`   Correct Ratio: ${isCorrectRatio ? '✅' : '❌'} (should be ~0.563)`);
      
      // Duration check
      console.log(`Duration: ${duration} seconds`);
      console.log(`   Within Limits: ${duration >= 3 && duration <= 90 ? '✅' : '❌'} (3-90 seconds)`);
      
      // Resolution check
      console.log(`Resolution: ${width}x${height}`);
      console.log(`   Minimum: ${width >= 1080 && height >= 1920 ? '✅' : '❌'} (1080x1920 minimum)`);
      
      // Codec check
      console.log(`Video Codec: ${codec}`);
      console.log(`   Supported: ${codec === 'h264' ? '✅' : '❌'} (should be h264)`);
      
      console.log(`Audio Codec: ${audioCodec}`);
      console.log(`   Supported: ${audioCodec === 'aac' ? '✅' : '❌'} (should be aac)`);
      
      // File size check
      const fileSizeMB = format?.size / 1024 / 1024;
      console.log(`File Size: ${fileSizeMB.toFixed(2)} MB`);
      console.log(`   Within Limits: ${fileSizeMB <= 100 ? '✅' : '❌'} (max 100MB)`);
      
      // Clean up
      fs.unlinkSync(tempFile);
      
      console.log('\n🔧 Recommendations:');
      if (!isVertical) {
        console.log('- Convert video to vertical format (9:16 aspect ratio)');
      }
      if (!isCorrectRatio) {
        console.log('- Adjust aspect ratio to exactly 9:16 (0.5625)');
      }
      if (duration < 3 || duration > 90) {
        console.log('- Adjust video duration to 3-90 seconds');
      }
      if (width < 1080 || height < 1920) {
        console.log('- Increase video resolution to minimum 1080x1920');
      }
      if (codec !== 'h264') {
        console.log('- Convert video to H.264 codec');
      }
      if (audioCodec !== 'aac') {
        console.log('- Convert audio to AAC codec');
      }
      
    });
    
  } catch (error) {
    console.error('❌ Error analyzing video:', error.message);
  }
}

checkVideoProperties(); 