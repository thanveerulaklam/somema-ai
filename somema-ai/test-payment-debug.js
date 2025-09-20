// Test script to debug payment verification issues
// Run this with: node test-payment-debug.js

const crypto = require('crypto');

// Test data - replace with actual values from your failed payment
const testData = {
  razorpay_order_id: 'order_XXXXXXXXXXXXXX', // Replace with actual order ID
  razorpay_payment_id: 'pay_XXXXXXXXXXXXXX', // Replace with actual payment ID
  razorpay_signature: 'signature_XXXXXXXXXXXXXX', // Replace with actual signature
  razorpay_key_secret: 'your_razorpay_key_secret_here' // Replace with actual secret
};

console.log('🔍 Payment Verification Debug Test');
console.log('=====================================');

// Test 1: Signature verification
console.log('\n1. Testing Signature Verification:');
const body = testData.razorpay_order_id + "|" + testData.razorpay_payment_id;
const expectedSignature = crypto
  .createHmac("sha256", testData.razorpay_key_secret)
  .update(body.toString())
  .digest("hex");

console.log('Order ID:', testData.razorpay_order_id);
console.log('Payment ID:', testData.razorpay_payment_id);
console.log('Body for signature:', body);
console.log('Expected signature:', expectedSignature);
console.log('Received signature:', testData.razorpay_signature);
console.log('Signatures match:', expectedSignature === testData.razorpay_signature);

// Test 2: Environment variables check
console.log('\n2. Environment Variables Check:');
console.log('RAZORPAY_KEY_ID exists:', !!process.env.RAZORPAY_KEY_ID);
console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID exists:', !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

// Test 3: Razorpay API test
console.log('\n3. Testing Razorpay API Connection:');
try {
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'test_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret',
  });
  console.log('✅ Razorpay instance created successfully');
} catch (error) {
  console.log('❌ Razorpay instance creation failed:', error.message);
}

console.log('\n📝 Instructions:');
console.log('1. Replace the test data above with actual values from your failed payment');
console.log('2. Make sure your .env.local file has the correct Razorpay credentials');
console.log('3. Check that the payment is actually captured in Razorpay dashboard');
console.log('4. Verify the order was created in your database');
