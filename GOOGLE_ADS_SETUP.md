# Google Ads Conversion Tracking Setup Guide

This guide will help you set up Google Ads Conversion Tracking for your Somema AI application to track paid conversions separately from organic signups and optimize campaigns for paying customers.

## What is Google Ads Conversion Tracking?

Google Ads Conversion Tracking helps you:
- **Track paid conversions separately** from organic signups
- **Optimize campaigns** for paying customers
- **Measure ROI** of your advertising spend
- **Create better audiences** for future campaigns
- **Improve bidding strategies** based on conversion data

## Key Benefits

- **Separate Tracking**: Distinguish between paid and organic conversions
- **Smart Detection**: Automatically detect traffic sources (gclid, UTM, referrer)
- **Enhanced Ecommerce**: Track purchase flows and cart behavior
- **Campaign Optimization**: Help Google optimize for high-value customers
- **ROI Measurement**: Better understanding of advertising effectiveness

## Step 1: Create Google Ads Account

1. Go to [Google Ads](https://ads.google.com/)
2. Click "Start now" or sign in to existing account
3. Set up your account information
4. Add your website domain

## Step 2: Set Up Conversion Actions

1. In Google Ads, go to **Tools & Settings** → **Conversions**
2. Click **+ Conversion action**
3. Create conversion actions for:
   - **Signup**: User registration
   - **Purchase**: Payment completion
   - **Trial**: Trial start
   - **Lead**: Lead generation
   - **Contact**: Contact form submission
   - **Feature Usage**: Key feature interactions

## Step 3: Get Your Conversion Tracking Code

For each conversion action:
1. Click on the conversion action
2. Go to **Tag setup**
3. Choose **Use Google tag**
4. Copy the **Conversion ID** and **Conversion Label**

## Step 4: Configure Environment Variables

Add your Google Ads conversion tracking IDs to your environment variables:

### For Development (.env.local)
```bash
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=123456789
NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL=AbC123DeF
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL=GhI456JkL
NEXT_PUBLIC_GOOGLE_ADS_TRIAL_LABEL=MnO789PqR
NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=StU012VwX
NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL=YzA345BcD
NEXT_PUBLIC_GOOGLE_ADS_FEATURE_LABEL=EfG678HiJ
```

### For Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each conversion tracking variable with your actual values

## Step 5: Test Your Setup

1. Start your development server: `npm run dev`
2. Open your app in the browser
3. Open Developer Tools → Network tab
4. Look for requests to `googletagmanager.com` with conversion data
5. Check Google Ads conversion tracking in real-time

## Step 6: Set Up Enhanced Ecommerce

### Purchase Tracking
Set up enhanced ecommerce tracking for:
- Product impressions
- Product clicks
- Add to cart
- Remove from cart
- Checkout steps
- Purchase completion

### Custom Parameters
Add custom parameters for:
- Plan type (free, pro, enterprise)
- User segment
- Feature usage patterns
- Conversion value

## Available Google Ads Functions

### Basic Usage
```typescript
import { useAnalyticsContext } from '../components/analytics/AnalyticsProvider';

const MyComponent = () => {
  const analytics = useAnalyticsContext();
  
  // Track paid signup
  analytics.trackGoogleAdsSignup(true, 29.99, 'google_ads');
  
  // Track organic signup (no conversion tracking)
  analytics.trackGoogleAdsSignup(false, 0, 'organic');
};
```

### Smart Conversion Tracking
```typescript
// Automatically detect traffic source and track accordingly
analytics.trackSmartSignup(29.99, 'smart_detection');
analytics.trackSmartPurchase(29.99, 'Pro Plan', 'TXN_001');
analytics.trackSmartTrial('Pro Plan');
analytics.trackSmartLead('contact_form', 50);
```

### Enhanced Ecommerce
```typescript
// Track purchase with items
analytics.googleAdsEcommerce.trackPurchaseWithItems([
  {
    id: 'plan_pro',
    name: 'Pro Plan',
    price: 29.99,
    quantity: 1,
    category: 'subscription'
  }
], 'TXN_001', true);

// Track add to cart
analytics.googleAdsEcommerce.trackAddToCart('plan_pro', 'Pro Plan', 29.99, 1, true);

// Track begin checkout
analytics.googleAdsEcommerce.trackBeginCheckout([
  {
    id: 'plan_pro',
    name: 'Pro Plan',
    price: 29.99,
    quantity: 1
  }
], true);
```

## Traffic Source Detection

The system automatically detects paid traffic using:

### Google Ads Click ID (gclid)
- Automatically added by Google Ads
- Most reliable indicator of paid traffic
- Example: `?gclid=abc123def456`

### UTM Parameters
- Manual tracking parameters
- Example: `?utm_source=google&utm_medium=cpc&utm_campaign=pro_plan`

### Referrer Analysis
- Checks for paid traffic sources
- Google, Facebook, Bing, LinkedIn
- Social media platforms

## Conversion Types

### 1. Signup Conversions
- Track user registration
- Separate paid vs organic
- Include conversion value for paid plans

### 2. Purchase Conversions
- Track payment completion
- Include transaction data
- Enhanced ecommerce tracking

### 3. Trial Conversions
- Track trial starts
- Important for SaaS businesses
- Lead to future purchases

### 4. Lead Conversions
- Track lead generation
- Contact form submissions
- Demo requests

### 5. Feature Usage
- Track key feature interactions
- Post creation, image enhancement
- User engagement metrics

## Advanced Configuration

### Custom Conversion Windows
Set up different conversion windows:
- **1-day click**: Immediate conversions
- **7-day click**: Short-term conversions
- **30-day click**: Long-term conversions

### Conversion Values
Assign values to different actions:
- **Signup**: $0 (free) or $29.99 (paid plan)
- **Purchase**: Actual transaction value
- **Trial**: $0 (leads to purchase)
- **Lead**: $50 (estimated lead value)

### Smart Bidding
Use conversion data for:
- **Target CPA**: Optimize for cost per acquisition
- **Target ROAS**: Optimize for return on ad spend
- **Maximize conversions**: Get most conversions within budget

## Integration with Other Platforms

### Google Analytics 4
- Track conversions in both platforms
- Compare attribution models
- Analyze cross-platform performance

### Google Tag Manager
- Manage Google Ads tags through GTM
- Centralize tag management
- Implement advanced triggers

### Meta Pixel
- Track conversions across platforms
- Compare Google Ads vs Facebook performance
- Unified conversion tracking

## Best Practices

### Performance
1. Load conversion tracking asynchronously
2. Minimize tracking code impact
3. Use efficient data formats
4. Monitor page load times

### Data Quality
1. Use consistent conversion labels
2. Validate conversion values
3. Test conversion tracking thoroughly
4. Monitor conversion accuracy

### Privacy
1. Implement consent management
2. Honor user preferences
3. Follow GDPR/CCPA requirements
4. Secure data transmission

## Troubleshooting

### Common Issues

**Conversions not tracking:**
1. Check conversion ID and label
2. Verify environment variables
3. Test with Google Tag Assistant
4. Check for ad blockers

**Paid traffic not detected:**
1. Verify gclid parameter
2. Check UTM parameters
3. Test referrer detection
4. Use debug mode

**Conversion values missing:**
1. Check conversion value parameters
2. Verify currency settings
3. Test with sample data
4. Monitor conversion reports

### Debug Tools
- **Google Tag Assistant**: Chrome extension
- **Google Ads Conversion Tracking**: Real-time monitoring
- **Google Analytics Debugger**: Chrome extension
- **Browser Developer Tools**: Network monitoring

## Campaign Optimization

### Audience Targeting
Create audiences based on:
- Website visitors
- People who converted
- High-value customers
- Lookalike audiences

### Bidding Strategies
Optimize bidding for:
- **Target CPA**: Set cost per acquisition goals
- **Target ROAS**: Set return on ad spend goals
- **Maximize conversions**: Get most conversions
- **Manual bidding**: Full control over bids

### Ad Copy Optimization
Use conversion data to:
- Test different ad copy
- Optimize landing pages
- Improve call-to-action buttons
- A/B test creative elements

## Support Resources

- [Google Ads Help](https://support.google.com/google-ads/)
- [Google Ads Developer Documentation](https://developers.google.com/google-ads)
- [Conversion Tracking Guide](https://support.google.com/google-ads/answer/1722054)
- [Enhanced Ecommerce Guide](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)

## Next Steps

1. **Set up your Google Ads account** following this guide
2. **Configure conversion actions** for your key metrics
3. **Test the implementation** using debug tools
4. **Set up enhanced ecommerce** for purchase tracking
5. **Create smart bidding strategies** based on conversion data
6. **Monitor and optimize** your campaigns

Your app now has enterprise-grade Google Ads conversion tracking that separates paid from organic conversions and helps optimize campaigns for paying customers!
