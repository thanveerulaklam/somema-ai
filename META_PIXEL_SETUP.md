# Meta (Facebook) Pixel & Conversions API Setup Guide

This guide will help you set up Meta (Facebook) Pixel and Conversions API for your Somema AI application to enable powerful Facebook advertising tracking and optimization.

## What is Meta Pixel & Conversions API?

**Meta Pixel** is a piece of code that you place on your website to track visitor activity and conversions. It helps you:
- Track conversions from Facebook ads
- Build targeted audiences for future ads
- Optimize ad delivery to people likely to take action
- Create lookalike audiences

**Conversions API** is a server-side solution that helps you share web and offline events directly from your server to Meta. It provides:
- More reliable event tracking
- Better attribution
- Enhanced optimization
- Privacy compliance

## Step 1: Create Meta Business Account

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Click "Create Account" or sign in to existing account
3. Set up your business information
4. Add your website domain

## Step 2: Create Meta Pixel

1. In Business Manager, go to **Events Manager**
2. Click **Connect Data Sources**
3. Select **Web** as your data source
4. Choose **Meta Pixel**
5. Name your pixel (e.g., "Somema AI Pixel")
6. Enter your website URL
7. Click **Create Pixel**

## Step 3: Get Your Pixel ID

After creating the pixel, you'll get a Pixel ID in this format: `123456789012345`

Copy this ID - you'll need it for the next step.

## Step 4: Get Meta Access Token

1. In Business Manager, go to **Settings** → **Business Settings**
2. Click **System Users** in the left sidebar
3. Create a new system user or use existing one
4. Go to **Ad Accounts** → **Add People**
5. Add your system user to your ad account
6. Go to **System Users** → **Generate New Token**
7. Select your app and permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
8. Copy the generated access token

## Step 5: Configure Environment Variables

Add your Meta Pixel ID and Access Token to your environment variables:

### For Development (.env.local)
```bash
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_ACCESS_TOKEN=your_access_token_here
```

### For Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `NEXT_PUBLIC_META_PIXEL_ID`
   - **Value**: `123456789012345` (your actual Pixel ID)
   - **Environment**: Production, Preview, Development
4. Add:
   - **Name**: `META_ACCESS_TOKEN`
   - **Value**: `your_access_token_here` (your actual access token)
   - **Environment**: Production, Preview, Development

## Step 6: Test Your Setup

1. Start your development server: `npm run dev`
2. Open your app in the browser
3. Open Developer Tools → Network tab
4. Look for requests to `facebook.com` or `fbevents.js`
5. Check Meta Events Manager for real-time events

## Step 7: Set Up Events in Meta

### Standard Events
Set up these standard events in Meta Events Manager:

1. **PageView** - Automatic tracking
2. **CompleteRegistration** - User signup
3. **Lead** - Lead generation
4. **Purchase** - Payment completion
5. **AddToCart** - Add to cart actions
6. **InitiateCheckout** - Checkout start
7. **ViewContent** - Content views
8. **Contact** - Contact form submissions
9. **Subscribe** - Subscription events
10. **StartTrial** - Trial starts

### Custom Events
Create custom events for:
- Feature usage tracking
- User engagement
- Content interactions
- Error tracking

## Available Meta Pixel Functions

### Basic Usage
```typescript
import { useAnalyticsContext } from '../components/analytics/AnalyticsProvider';

const MyComponent = () => {
  const analytics = useAnalyticsContext();
  
  // Track custom event
  analytics.trackMetaPixelEvent('CustomEvent', {
    event_category: 'engagement',
    event_label: 'button_click'
  });
};
```

### Pre-built Tracking Functions
- `analytics.trackMetaRegistration(email, plan)` - Track user registration
- `analytics.trackMetaPurchase(value, planName, transactionId)` - Track purchases
- `analytics.trackMetaLead(source, value)` - Track lead generation
- `analytics.trackMetaTrial(planName)` - Track trial starts
- `analytics.trackMetaContact(method)` - Track contact events
- `analytics.trackMetaSubscribe(planName, value)` - Track subscriptions

### Standard Events
```typescript
// Page view (automatic)
analytics.metaPixelEvents.pageView();

// Purchase
analytics.metaPixelEvents.purchase(29.99, 'USD', {
  content_name: 'Pro Plan',
  content_category: 'Subscription'
});

// Add to cart
analytics.metaPixelEvents.addToCart(29.99, 'USD', {
  content_name: 'Pro Plan',
  content_category: 'Subscription'
});

// View content
analytics.metaPixelEvents.viewContent({
  content_name: 'Feature Page',
  content_category: 'Marketing'
});
```

### Conversions API
```typescript
// Server-side event tracking
await analytics.trackConversionsAPI('Purchase', {
  content_name: 'Pro Plan',
  content_category: 'Subscription',
  value: 29.99,
  currency: 'USD',
  email: 'user@example.com'
});
```

## Advanced Configuration

### Enhanced Ecommerce
Set up enhanced ecommerce tracking for:
- Product impressions
- Product clicks
- Add to cart
- Remove from cart
- Checkout steps
- Purchase completion

### Custom Audiences
Create custom audiences based on:
- Website visitors
- People who engaged with content
- People who completed specific actions
- Lookalike audiences

### Dynamic Ads
Set up dynamic ads for:
- Product retargeting
- Cross-selling
- Abandoned cart recovery
- Personalized recommendations

## Privacy & Compliance

### GDPR Compliance
1. Implement consent management
2. Honor user opt-outs
3. Provide data deletion options
4. Document data processing

### CCPA Compliance
1. Provide opt-out mechanisms
2. Honor deletion requests
3. Disclose data collection
4. Maintain compliance records

### Data Hashing
The implementation includes:
- Email hashing for privacy
- Phone number hashing
- Secure data transmission
- Privacy-compliant tracking

## Troubleshooting

### Common Issues

**Pixel not firing:**
1. Check Pixel ID is correct
2. Verify environment variable is set
3. Check for ad blockers
4. Test in incognito mode

**Events not appearing:**
1. Verify pixel is installed correctly
2. Check browser console for errors
3. Use Facebook Pixel Helper extension
4. Test with Events Manager

**Conversions API errors:**
1. Check access token permissions
2. Verify API endpoint
3. Check request format
4. Monitor error logs

### Debug Tools
- **Facebook Pixel Helper**: Chrome extension
- **Events Manager**: Real-time event monitoring
- **Test Events**: Validate event setup
- **Conversion API Debugger**: Server-side debugging

## Best Practices

### Performance
1. Load pixel asynchronously
2. Minimize event frequency
3. Use efficient data formats
4. Monitor page load times

### Data Quality
1. Use consistent event names
2. Validate event parameters
3. Test events thoroughly
4. Monitor data accuracy

### Privacy
1. Implement consent management
2. Honor user preferences
3. Minimize data collection
4. Secure data transmission

## Integration with Other Platforms

### Google Analytics 4
- Track events in both platforms
- Compare attribution models
- Analyze cross-platform performance

### Google Tag Manager
- Manage Meta Pixel through GTM
- Centralize tag management
- Implement advanced triggers

### Other Platforms
- LinkedIn Insight Tag
- Twitter Pixel
- TikTok Pixel
- Snapchat Pixel

## Support Resources

- [Meta Business Help](https://www.facebook.com/business/help)
- [Meta Developer Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Conversions API Guide](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Meta Business Community](https://www.facebook.com/business/community)

## Next Steps

1. **Set up your Meta Pixel** following this guide
2. **Configure your first events** in Events Manager
3. **Test the implementation** using debug tools
4. **Set up custom audiences** for targeting
5. **Create your first ad campaign** with pixel data
6. **Monitor and optimize** your campaigns

Your app now has enterprise-grade Facebook advertising tracking with both Meta Pixel and Conversions API working seamlessly together!
