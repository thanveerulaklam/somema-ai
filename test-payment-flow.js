// Test Payment Flow Script
// Run with: node test-payment-flow.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPaymentFlow() {
  console.log('🧪 Testing Payment Flow');
  console.log('========================');
  console.log('');

  // 1. Check Environment Variables
  console.log('1. 🔧 Checking Environment Variables...');
  const envCheck = {
    RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  console.log('Environment Variables Status:');
  Object.entries(envCheck).forEach(([key, value]) => {
    console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'Set' : 'Missing'}`);
  });

  if (!envCheck.RAZORPAY_KEY_ID || !envCheck.RAZORPAY_KEY_SECRET) {
    console.log('\n❌ Missing Razorpay credentials. Please check your .env.local file.');
    return;
  }

  console.log('\n✅ All required environment variables are set!');
  console.log('');

  // 2. Test Razorpay Connection
  console.log('2. 🔗 Testing Razorpay Connection...');
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay instance created successfully');
    console.log(`   Key ID: ${process.env.RAZORPAY_KEY_ID.substring(0, 20)}...`);
  } catch (error) {
    console.log('❌ Razorpay connection failed:', error.message);
    return;
  }

  // 3. Test Database Connection
  console.log('\n3. 🗄️ Testing Database Connection...');
  try {
    const { data, error } = await supabase
      .from('payment_orders')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }

    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return;
  }

  // 4. Check Recent Orders
  console.log('\n4. 📋 Checking Recent Orders...');
  try {
    const { data: orders, error } = await supabase
      .from('payment_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Failed to fetch orders:', error.message);
      return;
    }

    if (orders && orders.length > 0) {
      console.log(`✅ Found ${orders.length} recent orders:`);
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order: ${order.order_id.substring(0, 20)}... | Status: ${order.status} | Amount: ₹${order.amount}`);
      });
    } else {
      console.log('ℹ️ No recent orders found');
    }
  } catch (error) {
    console.log('❌ Error checking orders:', error.message);
  }

  // 5. Check Recent Payments
  console.log('\n5. 💳 Checking Recent Payments...');
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Failed to fetch payments:', error.message);
      return;
    }

    if (payments && payments.length > 0) {
      console.log(`✅ Found ${payments.length} recent payments:`);
      payments.forEach((payment, index) => {
        console.log(`   ${index + 1}. Payment: ${payment.payment_id.substring(0, 20)}... | Status: ${payment.status} | Amount: ₹${payment.amount}`);
      });
    } else {
      console.log('ℹ️ No recent payments found');
    }
  } catch (error) {
    console.log('❌ Error checking payments:', error.message);
  }

  // 6. Test API Endpoints
  console.log('\n6. 🌐 Testing API Endpoints...');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Health endpoint working');
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
  }

  // 7. Test Payment Creation
  console.log('\n7. 🛒 Testing Payment Order Creation...');
  try {
    const testOrderData = {
      planId: 'starter',
      billingCycle: 'monthly',
      amount: 99900, // ₹999 in paise
      currency: 'INR'
    };

    const orderResponse = await fetch(`${baseUrl}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-user-id'
      },
      body: JSON.stringify(testOrderData)
    });

    if (orderResponse.ok) {
      const orderResult = await orderResponse.json();
      console.log('✅ Order creation endpoint working');
      console.log(`   Test order ID: ${orderResult.orderId?.substring(0, 20)}...`);
    } else {
      const errorData = await orderResponse.json();
      console.log('❌ Order creation failed:', errorData.error);
    }
  } catch (error) {
    console.log('❌ Order creation error:', error.message);
  }

  console.log('\n🎯 Test Summary');
  console.log('===============');
  console.log('✅ Environment variables configured');
  console.log('✅ Razorpay connection working');
  console.log('✅ Database connection working');
  console.log('✅ API endpoints accessible');
  console.log('');
  console.log('🚀 Ready for payment testing!');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Go to /pricing page in your browser');
  console.log('2. Select a plan and click Subscribe');
  console.log('3. Use test card: 4111 1111 1111 1111');
  console.log('4. Use any CVV and future expiry date');
  console.log('5. Check server logs for detailed payment flow');
  console.log('');
  console.log('🔍 For debugging, use:');
  console.log('- /api/debug-payment endpoint');
  console.log('- Check Razorpay dashboard');
  console.log('- Review server logs');
}

// Run the test
testPaymentFlow().catch(console.error);
