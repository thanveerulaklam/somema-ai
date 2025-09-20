// Test script for image enhancement API
const fetch = require('node-fetch');

async function testEnhanceImage() {
  try {
    console.log('🧪 Testing image enhancement API...');
    
    // Test with a sample image URL (you can replace this with any image URL)
    const testImageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop';
    
    const response = await fetch('http://localhost:3000/api/enhance-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        productDescription: 'Red Nike sneakers on white background'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Image enhancement successful!');
    console.log('📊 Response:', {
      success: data.success,
      hasEnhancedImage: !!data.enhancedImageUrl,
      imageUrlLength: data.enhancedImageUrl?.length || 0
    });
    
    if (data.enhancedImageUrl) {
      console.log('🖼️ Enhanced image URL starts with:', data.enhancedImageUrl.substring(0, 50) + '...');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEnhanceImage(); 