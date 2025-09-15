// Test Debug Payment Endpoint
// Run with: node test-debug-payment.js

require('dotenv').config({ path: '.env.local' });

async function testDebugPayment() {
  console.log('🔍 Testing Debug Payment Endpoint');
  console.log('==================================');
  console.log('');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Test data - replace with actual values from a failed payment
  const testData = {
    razorpay_order_id: 'order_test_123456789',
    razorpay_payment_id: 'pay_test_123456789',
    razorpay_signature: 'test_signature_123456789'
  };

  console.log('📋 Test Data:');
  console.log('Order ID:', testData.razorpay_order_id);
  console.log('Payment ID:', testData.razorpay_payment_id);
  console.log('Signature:', testData.razorpay_signature);
  console.log('');

  try {
    console.log('🚀 Sending request to debug endpoint...');
    
    const response = await fetch(`${baseUrl}/api/debug-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Debug request successful!');
      console.log('');
      console.log('📋 Debug Results:');
      console.log('================');
      
      if (result.debug) {
        console.log('Input Validation:');
        console.log('  - Has Order ID:', result.debug.inputValidation?.hasOrderId);
        console.log('  - Has Payment ID:', result.debug.inputValidation?.hasPaymentId);
        console.log('  - Has Signature:', result.debug.inputValidation?.hasSignature);
        console.log('');

        console.log('Environment Check:');
        Object.entries(result.debug.envCheck || {}).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value ? '✅ Set' : '❌ Missing'}`);
        });
        console.log('');

        console.log('Signature Verification:');
        console.log('  - Match:', result.debug.signatureVerification?.match);
        console.log('  - Expected:', result.debug.signatureVerification?.expectedSignature);
        console.log('  - Received:', result.debug.signatureVerification?.receivedSignature);
        console.log('');

        console.log('Razorpay API Test:');
        console.log('  - Success:', result.debug.razorpayApiTest?.success);
        if (result.debug.razorpayApiTest?.error) {
          console.log('  - Error:', result.debug.razorpayApiTest.error);
        }
        if (result.debug.razorpayApiTest?.paymentDetails) {
          console.log('  - Payment Details:');
          console.log('    - ID:', result.debug.razorpayApiTest.paymentDetails.id);
          console.log('    - Status:', result.debug.razorpayApiTest.paymentDetails.status);
          console.log('    - Amount:', result.debug.razorpayApiTest.paymentDetails.amount);
        }
      }
    } else {
      console.log('❌ Debug request failed!');
      console.log('Error:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }

  } catch (error) {
    console.log('❌ Request failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure your app is running (npm run dev)');
    console.log('2. Check that NEXT_PUBLIC_APP_URL is set correctly');
    console.log('3. Verify the debug endpoint is accessible');
  }

  console.log('');
  console.log('📝 Instructions:');
  console.log('1. Replace the test data above with actual values from your failed payment');
  console.log('2. Make sure your app is running');
  console.log('3. Check the results to identify the issue');
  console.log('');
  console.log('🔍 To get actual payment data:');
  console.log('1. Make a test payment');
  console.log('2. Check browser console for payment response');
  console.log('3. Copy the razorpay_order_id, razorpay_payment_id, and razorpay_signature');
  console.log('4. Replace the test data above and run this script again');
}

// Run the test
testDebugPayment().catch(console.error);
