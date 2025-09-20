# Google Analytics Setup Guide

This guide will help you set up Google Analytics 4 (GA4) for your Somema AI application.

## Step 1: Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Start measuring"
3. Follow the setup wizard to create your account
4. Create a new property for your app
5. Choose "Web" as the platform
6. Enter your website URL (e.g., `https://yourdomain.com`)

## Step 2: Get Your Measurement ID

1. In your GA4 property, go to **Admin** (gear icon)
2. Under **Property**, click **Data Streams**
3. Click on your web stream
4. Copy the **Measurement ID** (format: G-XXXXXXXXXX)

## Step 3: Configure Environment Variables

Add your Google Analytics Measurement ID to your environment variables:

### For Development (.env.local)
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### For Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `NEXT_PUBLIC_GA_ID`
   - **Value**: `G-XXXXXXXXXX` (your actual Measurement ID)
   - **Environment**: Production, Preview, Development

## Step 4: Verify Installation

1. Start your development server: `npm run dev`
2. Open your app in the browser
3. Open Developer Tools → Network tab
4. Look for requests to `google-analytics.com` or `googletagmanager.com`
5. Check your GA4 Real-Time reports to see if data is flowing

## Step 5: Test Analytics Events

The app now automatically tracks:
- ✅ Page views
- ✅ User engagement events
- ✅ Feature usage
- ✅ Conversions
- ✅ Errors

## Available Analytics Functions

### Basic Usage
```typescript
import { useAnalyticsContext } from '../components/analytics/AnalyticsProvider';

const MyComponent = () => {
  const analytics = useAnalyticsContext();
  
  const handleAction = () => {
    analytics.trackFeatureUsage('Button Click');
  };
};
```

### Pre-built Tracking Functions
- `analytics.trackLogin()` - Track user login
- `analytics.trackSignup()` - Track user signup
- `analytics.trackPostCreated()` - Track post creation
- `analytics.trackPostScheduled()` - Track post scheduling
- `analytics.trackImageEnhanced()` - Track image enhancement
- `analytics.trackPayment(amount)` - Track payments
- `analytics.trackPlanUpgrade(planName)` - Track plan upgrades
- `analytics.trackErrorOccurred(errorType)` - Track errors

### Custom Events
```typescript
// Track custom user engagement
analytics.trackUserEngagement('Custom Action', { label: 'Specific Detail' });

// Track feature usage
analytics.trackFeatureUsage('Feature Name', { label: 'Usage Context' });

// Track conversions
analytics.trackConversion('Conversion Type', 99.99);
```

## Key Metrics to Monitor

### User Engagement
- Page views per session
- Time on page
- Bounce rate
- User retention

### Feature Usage
- Post creation frequency
- Image enhancement usage
- Scheduling behavior
- Platform preferences (Instagram vs Facebook)

### Conversions
- Signup rate
- Payment conversions
- Plan upgrades
- Feature adoption

### Technical Health
- Error rates
- Page load times
- API response times

## Privacy Considerations

1. **GDPR Compliance**: Ensure you have proper consent mechanisms
2. **Data Retention**: Configure appropriate data retention periods in GA4
3. **PII Protection**: Never send personally identifiable information to GA4
4. **Cookie Consent**: Implement cookie consent if required in your region

## Troubleshooting

### No Data Appearing
1. Check if `NEXT_PUBLIC_GA_ID` is set correctly
2. Verify the Measurement ID is valid
3. Check browser console for errors
4. Ensure ad blockers are disabled for testing

### Events Not Tracking
1. Verify the analytics context is available
2. Check if the function is being called
3. Look for JavaScript errors in console
4. Test with GA4 DebugView

### Performance Issues
1. Analytics loads asynchronously and shouldn't block the UI
2. Consider implementing consent management
3. Use GA4's sampling features for high-traffic sites

## Advanced Configuration

### Custom Dimensions
You can add custom dimensions in GA4 to track:
- User plan type
- Feature usage patterns
- Content categories
- Platform preferences

### Enhanced Ecommerce
For payment tracking, consider implementing Enhanced Ecommerce:
```typescript
analytics.trackConversion('Purchase', {
  transaction_id: 'T_12345',
  value: 29.99,
  currency: 'USD',
  items: [
    {
      item_id: 'plan_pro',
      item_name: 'Pro Plan',
      price: 29.99,
      quantity: 1
    }
  ]
});
```

## Support

For issues with:
- **GA4 Setup**: Check [Google Analytics Help](https://support.google.com/analytics/)
- **Next.js Integration**: Check [Next.js Documentation](https://nextjs.org/docs)
- **App-specific Issues**: Check the analytics implementation in your codebase
