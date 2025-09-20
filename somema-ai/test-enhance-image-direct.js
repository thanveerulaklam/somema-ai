// Test script for direct file upload image enhancement API
const fs = require('fs');
const FormData = require('form-data');

async function testDirectFileUpload() {
  try {
    console.log('🧪 Testing direct file upload image enhancement API...');
    
    // Create a test image file (you can replace this with any image file)
    const testImagePath = './test-image.jpg';
    
    // If test image doesn't exist, create a simple one or use a placeholder
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️  Test image not found. Please place a test image at ./test-image.jpg');
      console.log('   Or update the path in this script to point to an existing image file.');
      return;
    }
    
    // Create FormData with the image file
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    formData.append('productDescription', 'Test product for enhancement');
    
    console.log('📤 Uploading image file directly...');
    
    const response = await fetch('http://localhost:3002/api/enhance-image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Enhanced image URL:', data.enhancedImageUrl);
    console.log('📊 Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDirectFileUpload(); 