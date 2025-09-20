# Razorpay Invoice + GST Setup Guide

This guide will help you set up Razorpay Invoice API with GST compliance for both business and non-business clients.

## Overview

The Razorpay Invoice + GST integration provides:
- **Automatic GST calculation** based on customer type and location
- **Business vs Individual client detection**
- **Proper tax compliance** for Indian businesses
- **Invoice generation and management**
- **Webhook handling** for payment events

## Database Setup

### 1. Run the Invoice Schema

**Option A: Using the API endpoint (Recommended)**
```bash
curl -X POST https://yourdomain.com/api/setup-invoice-db
```

**Option B: Manual SQL execution**
Execute the following SQL file in your Supabase SQL editor:

```sql
-- Run the razorpay-invoice-schema.sql file
```

**Option C: Using the setup script**
```bash
node setup-invoice-database.js
```

**If you get "column does not exist" errors, run the fix:**
```bash
curl -X POST https://yourdomain.com/api/fix-user-profiles
```

This creates the following tables:
- `invoices` - Main invoice records
- `invoice_items` - Line items for each invoice
- `gst_registrations` - Business GST registrations
- `tax_settings` - Configurable tax rates
- `user_profiles` - User profile information (separate from auth.users)

### 2. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Razorpay Configuration (existing)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Additional for Invoice API
RAZORPAY_INVOICE_WEBHOOK_SECRET=your_invoice_webhook_secret
```

## Razorpay Dashboard Setup

### 1. Enable Invoice API

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings > API Keys**
3. Ensure your API keys have **Invoice** permissions
4. If not, regenerate keys with Invoice access

### 2. Configure Webhooks

1. Go to **Settings > Webhooks**
2. Add a new webhook with URL: `https://yourdomain.com/api/invoices/webhook`
3. Select the following events:
   - `invoice.paid`
   - `invoice.cancelled`
   - `invoice.expired`
4. Copy the webhook secret

### 3. Business Profile Setup

1. Go to **Settings > Business Profile**
2. Complete your business information:
   - Business name
   - GST number (if applicable)
   - Business address
   - Contact information

## GST Compliance Features

### Customer Type Detection

The system automatically detects customer type based on:
- Explicit customer type selection
- Presence of GST number
- Business name provided
- Business address information

### GST Calculation Logic

```typescript
// Individual clients: No GST
if (customerType === 'individual') {
  gstApplicable = false;
}

// Business clients: GST applicable
if (customerType === 'business') {
  gstApplicable = true;
  gstRate = 18.00; // Standard GST rate
  
  // Intra-state: CGST (9%) + SGST (9%)
  // Inter-state: IGST (18%)
}
```

### Tax Components

- **CGST (Central GST)**: 9% for intra-state transactions
- **SGST (State GST)**: 9% for intra-state transactions  
- **IGST (Integrated GST)**: 18% for inter-state transactions

## API Endpoints

### 1. Create Invoice
```
POST /api/invoices/create
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "planId": "starter|growth|scale",
  "billingCycle": "monthly|yearly",
  "customerType": "individual|business",
  "businessInfo": {
    "businessName": "Company Name",
    "gstNumber": "22AAAAA0000A1Z5",
    "businessAddress": {
      "line1": "Address Line 1",
      "city": "City",
      "state": "State",
      "pincode": "123456"
    }
  },
  "billingInfo": {
    "address": "Billing Address",
    "city": "City",
    "state": "State",
    "pincode": "123456"
  }
}
```

### 2. Send Invoice
```
POST /api/invoices/send
```

**Request Body:**
```json
{
  "invoiceId": "invoice-uuid",
  "razorpayInvoiceId": "inv_razorpay_id"
}
```

### 3. List Invoices
```
GET /api/invoices/list?userId=user-uuid&status=all&limit=10&offset=0
```

### 4. Invoice Webhook
```
POST /api/invoices/webhook
```

## Usage Flow

### 1. Customer Subscription

1. Customer selects a plan on `/pricing`
2. System redirects to `/invoices/create`
3. Customer fills invoice form with business/personal details
4. System creates invoice with proper GST calculation
5. Invoice is sent to customer via email
6. Customer pays through Razorpay invoice link
7. Webhook updates subscription status

### 2. Business vs Individual Handling

**Individual Clients:**
- No GST applied
- Simple billing address required
- Direct payment processing

**Business Clients:**
- GST applied (18%)
- Business details required
- GST number validation
- Proper tax breakdown in invoice

## UI Components

### 1. InvoiceForm Component
- Customer type selection (Individual/Business)
- Business information form
- Billing address form
- GST validation
- Form submission handling

### 2. InvoiceList Component
- Invoice listing with status
- Filter by status
- Send invoice functionality
- View invoice links
- Pagination support

## Testing

### 1. Test Mode
Use Razorpay test credentials for development:
- Test API keys
- Test webhook endpoints
- Test invoice creation

### 2. Test Scenarios

**Individual Client:**
```json
{
  "customerType": "individual",
  "businessInfo": {},
  "billingInfo": {
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Business Client with GST:**
```json
{
  "customerType": "business",
  "businessInfo": {
    "businessName": "Test Company",
    "gstNumber": "22AAAAA0000A1Z5",
    "businessAddress": {
      "line1": "456 Business Ave",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001"
    }
  }
}
```

### 3. GST Validation

Test GST number formats:
- Valid: `22AAAAA0000A1Z5`
- Invalid: `22AAAAA0000A1Z` (too short)
- Invalid: `22AAAAA0000A1Z6` (wrong checksum)

## Production Deployment

### 1. Switch to Live Mode
- Update Razorpay credentials to live keys
- Update webhook URLs to production domain
- Test with real payment methods

### 2. GST Compliance
- Ensure business GST number is registered
- Verify tax calculations
- Test invoice generation
- Validate webhook processing

### 3. Monitoring
- Monitor invoice creation success rates
- Track payment completion rates
- Monitor webhook delivery
- Check GST calculation accuracy

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Data Validation**: Validate all input data
3. **GST Number Validation**: Implement proper GST number format validation
4. **Access Control**: Ensure users can only access their own invoices
5. **HTTPS**: Use HTTPS in production for all API calls

## Troubleshooting

### Common Issues

1. **Invoice Creation Fails**
   - Check Razorpay API credentials
   - Verify webhook configuration
   - Check database connection

2. **GST Calculation Errors**
   - Verify customer type detection
   - Check business information validation
   - Validate address information

3. **Webhook Not Received**
   - Check webhook URL accessibility
   - Verify webhook secret
   - Check Razorpay dashboard for webhook logs

### Debug Commands

```bash
# Test invoice creation
curl -X POST https://yourdomain.com/api/invoices/create \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","planId":"starter","billingCycle":"monthly"}'

# Test webhook
curl -X POST https://yourdomain.com/api/invoices/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{"event":"invoice.paid","payload":{"invoice":{"id":"test"}}}'
```

## Support

For issues related to:
- **Razorpay API**: Contact Razorpay support
- **GST Compliance**: Consult with tax advisor
- **Technical Issues**: Check application logs and database

## Additional Resources

- [Razorpay Invoice API Documentation](https://razorpay.com/docs/api/invoices/)
- [GST Compliance Guide](https://www.gst.gov.in/)
- [Supabase Documentation](https://supabase.com/docs)
