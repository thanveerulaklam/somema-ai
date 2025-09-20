#!/usr/bin/env node

/**
 * Comprehensive Cost Testing Script
 * Tests 10 post generations and 10 image enhancements to get accurate average costs
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Comprehensive Cost Testing Script');
console.log('=====================================');
console.log('');

console.log('📋 This script will help you test:');
console.log('1. 10 Post Generations (to get average cost)');
console.log('2. 10 Image Enhancements (to get average cost)');
console.log('');

console.log('🔍 What we\'ll measure:');
console.log('- Token usage for each operation');
console.log('- Processing time');
console.log('- Exact costs based on OpenAI pricing');
console.log('- Average costs across all tests');
console.log('');

console.log('📊 Expected API Endpoints to Test:');
console.log('- POST /api/generate-content (for post generation)');
console.log('- POST /api/enhance-image (for image enhancement)');
console.log('');

console.log('🚀 Testing Instructions:');
console.log('');

console.log('STEP 1: Test Post Generation (10 times)');
console.log('========================================');
console.log('1. Go to your app: http://localhost:3000');
console.log('2. Navigate to: /ai/generate');
console.log('3. Generate 10 different posts with different prompts');
console.log('4. Watch terminal logs for cost information');
console.log('');

console.log('STEP 2: Test Image Enhancement (10 times)');
console.log('==========================================');
console.log('1. Go to: /posts/editor');
console.log('2. Upload 10 different images (various sizes/types)');
console.log('3. Click "Enhance Image" for each one');
console.log('4. Watch terminal logs for cost information');
console.log('');

console.log('📝 Test Images to Use (for variety):');
console.log('- Small image (< 100KB)');
console.log('- Medium image (100KB - 500KB)');
console.log('- Large image (> 500KB)');
console.log('- Different formats (JPG, PNG)');
console.log('- Different content (products, people, landscapes)');
console.log('');

console.log('📝 Test Prompts for Post Generation:');
console.log('- Fashion/Clothing posts');
console.log('- Food/Restaurant posts');
console.log('- Tech/Electronics posts');
console.log('- Home/Interior posts');
console.log('- Beauty/Cosmetics posts');
console.log('- Travel/Lifestyle posts');
console.log('- Fitness/Health posts');
console.log('- Business/Professional posts');
console.log('- Art/Creative posts');
console.log('- Seasonal/Holiday posts');
console.log('');

console.log('📊 What to Record:');
console.log('==================');
console.log('For each test, note down:');
console.log('- Input tokens');
console.log('- Output tokens');
console.log('- Total tokens');
console.log('- Processing time');
console.log('- Calculated cost');
console.log('');

console.log('💰 Cost Calculation Formula:');
console.log('============================');
console.log('Input Cost = (Input Tokens ÷ 1,000,000) × $10');
console.log('Output Cost = (Output Tokens ÷ 1,000,000) × $40');
console.log('Total Cost = Input Cost + Output Cost');
console.log('');

console.log('📈 Expected Log Format:');
console.log('=======================');
console.log('Look for these in your terminal:');
console.log('');
console.log('For Post Generation:');
console.log('  - "🚀 Starting content generation..."');
console.log('  - "📊 Request details:"');
console.log('  - "💰 Usage Information:"');
console.log('  - "📋 Final Summary:"');
console.log('');
console.log('For Image Enhancement:');
console.log('  - "🚀 Starting OpenAI image enhancement request..."');
console.log('  - "📊 Request details:"');
console.log('  - "💰 Usage Information:"');
console.log('  - "💰 Cost Analysis:"');
console.log('  - "🎉 Image Enhancement Complete!"');
console.log('');

console.log('📋 Results Template:');
console.log('====================');
console.log('Copy this template and fill it out:');
console.log('');
console.log('POST GENERATION RESULTS:');
console.log('Test 1: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 2: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 3: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 4: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 5: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 6: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 7: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 8: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 9: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 10: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('');
console.log('Average Post Generation Cost: $___');
console.log('');
console.log('IMAGE ENHANCEMENT RESULTS:');
console.log('Test 1: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 2: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 3: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 4: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 5: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 6: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 7: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 8: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 9: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('Test 10: Input: ___ tokens, Output: ___ tokens, Cost: $___');
console.log('');
console.log('Average Image Enhancement Cost: $___');
console.log('');

console.log('🎯 Ready to start testing!');
console.log('Make sure your app is running (npm run dev)');
console.log('Start with post generation, then move to image enhancement.');
console.log('');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✅ Found package.json - you\'re in the right directory');
} else {
  console.log('❌ package.json not found - make sure you\'re in the somema-ai directory');
}
