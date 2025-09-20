# 🧪 UPI AutoPay Testing Guide

## 📱 **Test UPI Credentials**

### **Test UPI IDs (Similar to Test Cards)**
```
✅ Success: success@razorpay
❌ Failure: failure@razorpay  
⏳ Pending: pending@razorpay
```

### **Test Phone Numbers**
```
📞 Primary: 9999999999
📞 Alternative: 9876543210
```

### **Test Email Addresses**
```
📧 success@razorpay.com
📧 failure@razorpay.com
📧 pending@razorpay.com
```

## 🎯 **Step-by-Step Testing Process**

### **1. Test UPI AutoPay Subscription Creation**

1. **Go to Pricing Page**: `https://www.quely.ai/pricing`
2. **Select a Plan**: Choose Starter or Growth plan
3. **Click "Subscribe with UPI AutoPay"**: This should be the primary button
4. **Fill Test Details**:
   - Email: `test@example.com`
   - Phone: `9999999999`
   - Name: `Test User`
5. **Submit**: Should redirect to Razorpay UPI AutoPay page

### **2. Test UPI AutoPay Setup Flow**

1. **Razorpay UPI Page**: You'll see UPI AutoPay setup page
2. **Enter Test UPI ID**: Use `success@razorpay`
3. **Complete Setup**: Follow the UPI app simulation
4. **Redirect**: Should redirect to dashboard with `?subscription=pending&method=upi-autopay`

### **3. Test Dashboard UPI Status Banner**

1. **Check Dashboard**: `https://www.quely.ai/dashboard?subscription=pending&method=upi-autopay`
2. **Verify Banner**: Should show blue UPI AutoPay status banner
3. **Test Actions**:
   - "I'll Complete Setup Later" - Should dismiss banner
   - "Open UPI App" - Should open Razorpay dashboard

### **4. Test Webhook Events**

Monitor these webhook events in your logs:

```
📤 subscription.authenticated - UPI mandate created
📤 subscription.activated - UPI subscription activated  
📤 subscription.charged - First UPI payment successful
📤 payment.captured - UPI payment captured
```

## 🔧 **Test Scenarios**

### **Scenario 1: Successful UPI AutoPay**
```
1. Create subscription with success@razorpay
2. Complete UPI setup in test environment
3. Verify subscription becomes active
4. Check credits are allocated
5. Verify dashboard shows success message
```

### **Scenario 2: Failed UPI AutoPay**
```
1. Create subscription with failure@razorpay
2. UPI setup fails
3. Verify subscription remains pending
4. Check dashboard shows appropriate message
5. Verify no credits allocated
```

### **Scenario 3: Pending UPI AutoPay**
```
1. Create subscription with pending@razorpay
2. UPI setup is pending user action
3. Verify subscription status is pending
4. Check dashboard shows UPI AutoPay banner
5. Verify user can complete setup later
```

## 🛠️ **Manual Testing Commands**

### **Run Automated Test Script**
```bash
node test-upi-autopay.js
```

### **Test Specific Endpoints**
```bash
# Test subscription creation
curl -X POST https://www.quely.ai/api/payments/create-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "starter",
    "payment_method": "upi-autopay",
    "user_details": {
      "email": "test@example.com",
      "phone": "9999999999",
      "name": "Test User"
    }
  }'

# Test dashboard with UPI status
curl "https://www.quely.ai/dashboard?subscription=pending&method=upi-autopay"
```

## 📊 **Expected Results**

### **✅ Success Indicators**
- UPI AutoPay subscription created successfully
- Dashboard shows UPI AutoPay status banner
- Webhook events processed correctly
- Credits allocated after successful payment
- User redirected to dashboard with correct parameters

### **❌ Failure Indicators**
- "Invalid webhook signature" errors
- Dashboard shows regular interface (no UPI banner)
- Subscription creation fails
- Webhook events not processed
- Credits not allocated

## 🔍 **Debugging Tips**

### **Check Webhook Configuration**
1. **Razorpay Dashboard**: Settings → Webhooks
2. **Webhook URL**: `https://quely.ai/api/payments/razorpay-webhook`
3. **Events Enabled**: All subscription and payment events
4. **Webhook Secret**: Must be set in Vercel environment variables

### **Check Environment Variables**
```bash
# Required in Vercel
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### **Check Database Schema**
```sql
-- Ensure these columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name IN ('payment_method', 'upi_mandate_id', 'mandate_status');
```

## 📱 **UPI AutoPay vs Credit Card Testing**

| Feature | Credit Card | UPI AutoPay |
|---------|-------------|-------------|
| Test Mode | `4111 1111 1111 1111` | `success@razorpay` |
| Setup | Immediate | Requires UPI app approval |
| Webhooks | `payment.captured` | `subscription.authenticated` |
| Status | Active immediately | Pending → Active |
| Dashboard | Success message | UPI AutoPay banner |

## 🎉 **Success Checklist**

- [ ] UPI AutoPay subscription creation works
- [ ] Dashboard shows UPI AutoPay status banner
- [ ] Webhook events are processed correctly
- [ ] Test UPI IDs work as expected
- [ ] User can complete UPI setup
- [ ] Credits are allocated after successful payment
- [ ] Dashboard updates after UPI activation

## 🚨 **Common Issues & Solutions**

### **Issue: "Invalid webhook signature"**
**Solution**: Check `RAZORPAY_WEBHOOK_SECRET` in Vercel environment variables

### **Issue: Dashboard shows regular interface**
**Solution**: Check URL parameters are being passed correctly

### **Issue: UPI AutoPay not available**
**Solution**: Ensure Razorpay account has UPI AutoPay enabled

### **Issue: Test UPI IDs not working**
**Solution**: Use exact test credentials: `success@razorpay`, `failure@razorpay`

---

**Happy Testing! 🧪📱**
