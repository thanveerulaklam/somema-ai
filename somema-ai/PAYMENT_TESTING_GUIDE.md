# 💳 Razorpay Payment Testing Guide

This guide will help you test payments in both development and production environments.

## 🔧 Test Environment Setup

### 1. Razorpay Test Credentials

First, get your test credentials from Razorpay Dashboard:

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Switch to **Test Mode** (toggle in top-right)
3. Go to **Settings > API Keys**
4. Generate new test keys if needed

### 2. Environment Variables for Testing

Add these to your `.env.local` file:

```bash
# Razorpay Test Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
```

## 🧪 Test Payment Methods

### 1. Test Card Numbers

Use these Razorpay test card numbers:

#### ✅ Successful Payments
```bash
# Visa
4111 1111 1111 1111

# Mastercard  
5555 5555 5555 4444

# RuPay
5081 5900 0000 0000

# American Express
3782 822463 10005
```

#### ❌ Failed Payments
```bash
# Insufficient Funds
4000 0000 0000 0002

# Card Declined
4000 0000 0000 0069

# Invalid Card
4000 0000 0000 0119
```

### 2. Test Payment Details

For all test cards, use:
- **CVV**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)
- **Name**: Any name (e.g., Test User)

## 🚀 Testing Scenarios

### Scenario 1: Successful Subscription Payment

1. **Go to Pricing Page**: `/pricing`
2. **Select a Plan**: Choose any paid plan (Starter, Growth, or Scale)
3. **Click Subscribe**: This will create an order and open Razorpay checkout
4. **Use Test Card**: Enter `4111 1111 1111 1111`
5. **Complete Payment**: Use any CVV and future expiry
6. **Expected Result**: 
   - Payment successful alert
   - Redirect to dashboard
   - Subscription activated in database

### Scenario 2: Failed Payment

1. **Follow steps 1-3** from Scenario 1
2. **Use Failed Card**: Enter `4000 0000 0000 0002`
3. **Expected Result**: 
   - Payment failed alert
   - Stay on pricing page
   - No subscription changes

### Scenario 3: Top-up Purchase

1. **Go to Settings**: `/settings`
2. **Find Top-up Section**: Look for enhancement credits
3. **Select Top-up**: Choose any enhancement package
4. **Use Test Card**: Enter `4111 1111 1111 1111`
5. **Expected Result**: 
   - Credits added to account
   - Success message

## 🔍 Debugging Payment Issues

### 1. Use Debug Endpoint

Test payment verification with actual data:

```javascript
// Test with your payment data
fetch('/api/debug-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    razorpay_order_id: 'order_XXXXXXXXXXXXXX',
    razorpay_payment_id: 'pay_XXXXXXXXXXXXXX',
    razorpay_signature: 'signature_XXXXXXXXXXXXXX'
  })
})
.then(res => res.json())
.then(data => console.log('Debug result:', data));
```

### 2. Check Server Logs

After a payment attempt, check your server logs for detailed information:

```bash
# Look for these log patterns:
🔍 Payment verification request received
📋 Payment verification data: { orderId: '...', paymentId: '...', signature: '...' }
✅ Razorpay credentials are configured
🔐 Signature verification: { expectedSignature: '...', receivedSignature: '...', match: true/false }
```

### 3. Test Script

Run the local test script:

```bash
cd somema-ai
node test-payment-debug.js
```

## 🎯 Common Test Cases

### Test Case 1: Signature Verification
- **Purpose**: Verify payment signature validation
- **Steps**: Use correct test card, check logs for signature match
- **Expected**: `match: true` in logs

### Test Case 2: API Connection
- **Purpose**: Test Razorpay API connectivity
- **Steps**: Make a payment, check for API fetch logs
- **Expected**: Payment details fetched successfully

### Test Case 3: Database Integration
- **Purpose**: Verify order creation and updates
- **Steps**: Complete payment, check database
- **Expected**: Order status updated to 'completed'

### Test Case 4: Subscription Activation
- **Purpose**: Test subscription activation flow
- **Steps**: Pay for subscription plan
- **Expected**: User profile updated with new plan

## 🚨 Troubleshooting

### Issue: "Payment verification failed"

**Possible Causes:**
1. Wrong Razorpay credentials
2. Signature mismatch
3. Payment not captured
4. Database connection issues

**Debug Steps:**
1. Check environment variables
2. Use debug endpoint
3. Verify payment status in Razorpay dashboard
4. Check server logs

### Issue: "Order not found"

**Possible Causes:**
1. Order not created in database
2. Wrong order ID
3. Database connection issues

**Debug Steps:**
1. Check `payment_orders` table
2. Verify order creation logs
3. Test database connection

### Issue: "Invalid payment signature"

**Possible Causes:**
1. Wrong `RAZORPAY_KEY_SECRET`
2. Incorrect signature generation
3. Order/Payment ID mismatch

**Debug Steps:**
1. Verify environment variables
2. Check signature generation logic
3. Compare expected vs received signatures

## 📊 Monitoring Test Results

### 1. Razorpay Dashboard
- Check **Payments** section for test transactions
- Verify payment status and details
- Monitor webhook events

### 2. Database Verification
```sql
-- Check recent orders
SELECT * FROM payment_orders 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check recent payments
SELECT * FROM payments 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check user subscriptions
SELECT user_id, subscription_plan, subscription_status 
FROM user_profiles 
WHERE updated_at > NOW() - INTERVAL '1 hour';
```

### 3. Server Logs
Look for these success indicators:
- ✅ Payment signature verified successfully
- ✅ Payment verified with Razorpay API
- ✅ Order found in database
- 🎉 Payment verification completed successfully!

## 🔄 Production Testing

### 1. Switch to Live Mode
```bash
# Update environment variables
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

### 2. Test with Real Cards
- Use real credit/debit cards
- Test with small amounts first
- Monitor all transactions carefully

### 3. Webhook Testing
- Update webhook URL to production domain
- Test webhook events
- Monitor webhook logs

## 📝 Test Checklist

- [ ] Test credentials configured
- [ ] Test card payments working
- [ ] Failed payments handled correctly
- [ ] Subscription activation working
- [ ] Top-up purchases working
- [ ] Database updates correct
- [ ] Webhook events received
- [ ] Error handling working
- [ ] Logs showing detailed info
- [ ] Production credentials ready

## 🆘 Getting Help

If you encounter issues:

1. **Check the debug endpoint** with your payment data
2. **Review server logs** for detailed error information
3. **Verify Razorpay dashboard** for payment status
4. **Test with different cards** to isolate issues
5. **Use the test script** for local debugging

Remember: Test mode transactions don't charge real money, so you can test extensively without any cost!
