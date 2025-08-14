# Razorpay Integration Setup Guide

This guide will help you set up Razorpay payment integration for Somema AI.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

## Getting Razorpay Credentials

1. **Create a Razorpay Account**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Sign up for a new account or log in to existing account

2. **Get API Keys**
   - Navigate to Settings > API Keys
   - Generate a new key pair
   - Copy the Key ID and Key Secret

3. **Set Up Webhook**
   - Go to Settings > Webhooks
   - Add a new webhook with URL: `https://yourdomain.com/api/payments/razorpay-webhook`
   - Select the following events:
     - `payment.captured`
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.halted`
     - `subscription.cancelled`
   - Copy the webhook secret

## Database Setup

Run the payment schema to create the required tables:

```sql
-- Execute the payment-schema.sql file in your Supabase SQL editor
```

## Subscription Plans

The current setup includes 4 subscription plans:

1. **Free Plan** - ₹0 / $0
   - Basic content creation
   - Limited AI generations (5/month)
   - 1 social media account
   - Basic analytics

2. **Starter Plan** - ₹999 / $12
   - Advanced AI content generation
   - Up to 5 social media accounts
   - Priority support
   - Advanced analytics

3. **Professional Plan** - ₹1,999 / $24
   - Unlimited AI generations
   - Up to 15 social media accounts
   - Team collaboration
   - Advanced scheduling

4. **Enterprise Plan** - ₹4,999 / $60
   - Unlimited everything
   - Unlimited social accounts
   - Dedicated account manager
   - Custom integrations

## Payment Flow

1. User selects a plan on `/pricing` page
2. System creates a Razorpay order via `/api/payments/create-order`
3. Razorpay checkout opens for payment
4. On successful payment, verification happens via `/api/payments/verify-payment`
5. User subscription is updated in database
6. Webhook handles subscription lifecycle events

## Mandatory Pages

The following pages have been created to meet Razorpay requirements:

- `/terms` - Terms and Conditions
- `/privacy` - Privacy Policy
- `/pricing-policy` - Pricing Policy
- `/shipping-policy` - Shipping Policy (for digital services)
- `/refund-policy` - Cancellation & Refund Policy

## Testing

1. **Test Mode**: Use Razorpay test credentials for development
2. **Test Cards**: Use Razorpay's test card numbers for testing
3. **Webhook Testing**: Use tools like ngrok for local webhook testing

## Production Deployment

1. Switch to Razorpay live credentials
2. Update webhook URL to production domain
3. Test payment flow with real cards
4. Monitor webhook events in Razorpay dashboard

## Security Considerations

1. Never expose API secrets in client-side code
2. Always verify payment signatures
3. Use HTTPS in production
4. Implement proper error handling
5. Log payment events for debugging

## Support

For issues with:
- **Razorpay Integration**: Check Razorpay documentation and dashboard
- **Payment Processing**: Monitor webhook events and payment logs
- **Database Issues**: Check Supabase logs and RLS policies

## Links

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Supabase Documentation](https://supabase.com/docs) 