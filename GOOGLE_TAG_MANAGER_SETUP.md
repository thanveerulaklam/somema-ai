# Google Tag Manager Setup Guide

This guide will help you set up Google Tag Manager (GTM) for your Somema AI application alongside Google Analytics 4.

## What is Google Tag Manager?

Google Tag Manager is a tag management system that allows you to quickly and easily update measurement codes and related code fragments (collectively called "tags") on your website or mobile app. It provides:

- **No-code tag management** - Add/remove tags without developer involvement
- **Advanced tracking** - Complex event tracking and ecommerce
- **Multiple platforms** - Manage GA4, Facebook Pixel, LinkedIn, etc. from one place
- **Real-time debugging** - Test and debug tags in real-time
- **A/B testing** - Integrate with Google Optimize and other testing tools

## Step 1: Create Google Tag Manager Account

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Click "Start for free"
3. Create a new account:
   - **Account Name**: Your company name (e.g., "Somema AI")
   - **Country**: Your country
4. Create a new container:
   - **Container Name**: Your website name (e.g., "Somema AI Website")
   - **Target Platform**: Web
5. Accept the terms and click "Create"

## Step 2: Get Your GTM Container ID

After creating the container, you'll get a Container ID in this format: `GTM-XXXXXXX`

Copy this ID - you'll need it for the next step.

## Step 3: Configure Environment Variables

Add your GTM Container ID to your environment variables:

### For Development (.env.local)
```bash
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Keep your existing GA4 ID
```

### For Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `NEXT_PUBLIC_GTM_ID`
   - **Value**: `GTM-XXXXXXX` (your actual Container ID)
   - **Environment**: Production, Preview, Development

## Step 4: Set Up Google Analytics 4 in GTM

1. In your GTM container, go to **Tags** → **New**
2. Click **Tag Configuration** → **Google Analytics: GA4 Configuration**
3. Enter your GA4 Measurement ID (G-XXXXXXXXXX)
4. Set **Triggering** to **All Pages**
5. Name it "GA4 Configuration" and save

## Step 5: Set Up GA4 Event Tag

1. Create another tag: **Tags** → **New**
2. Click **Tag Configuration** → **Google Analytics: GA4 Event**
3. Configure:
   - **Configuration Tag**: Select your GA4 Configuration tag
   - **Event Name**: `page_view`
   - **Event Parameters**: Add any custom parameters
4. Set **Triggering** to **All Pages**
5. Name it "GA4 Page Views" and save

## Step 6: Set Up Custom Events

### User Engagement Events
1. Create a new tag: **Google Analytics: GA4 Event**
2. **Event Name**: `user_engagement`
3. **Event Parameters**:
   - `action` (Event Parameter)
   - `category` (Event Parameter)
4. **Trigger**: Custom Event → Event name: `user_engagement`

### Feature Usage Events
1. Create a new tag: **Google Analytics: GA4 Event**
2. **Event Name**: `feature_usage`
3. **Event Parameters**:
   - `feature` (Event Parameter)
   - `category` (Event Parameter)
4. **Trigger**: Custom Event → Event name: `feature_usage`

### Conversion Events
1. Create a new tag: **Google Analytics: GA4 Event**
2. **Event Name**: `conversion`
3. **Event Parameters**:
   - `conversion_type` (Event Parameter)
   - `value` (Event Parameter)
4. **Trigger**: Custom Event → Event name: `conversion`

## Step 7: Set Up Ecommerce Tracking

### Purchase Events
1. Create a new tag: **Google Analytics: GA4 Event**
2. **Event Name**: `purchase`
3. **Event Parameters**:
   - `transaction_id` (Event Parameter)
   - `value` (Event Parameter)
   - `currency` (Event Parameter)
   - `items` (Event Parameter)
4. **Trigger**: Custom Event → Event name: `purchase`

### Add to Cart Events
1. Create a new tag: **Google Analytics: GA4 Event**
2. **Event Name**: `add_to_cart`
3. **Event Parameters**:
   - `currency` (Event Parameter)
   - `value` (Event Parameter)
   - `items` (Event Parameter)
4. **Trigger**: Custom Event → Event name: `add_to_cart`

## Step 8: Set Up Variables

### Built-in Variables
Enable these built-in variables:
- **Page Variables**: Page URL, Page Path, Page Title
- **Click Variables**: Click URL, Click Text, Click Classes
- **Form Variables**: Form URL, Form Text

### Custom Variables
Create custom variables for:
- **User ID**: Data Layer Variable → `user_id`
- **User Plan**: Data Layer Variable → `user_plan`
- **Feature Usage**: Data Layer Variable → `feature_name`

## Step 9: Set Up Triggers

### Page View Triggers
- **All Pages**: Page View → All Pages
- **Specific Pages**: Page View → Some Pages → Page Path contains "/dashboard"

### Click Triggers
- **Button Clicks**: Click → All Elements → Click Classes contains "btn"
- **Form Submissions**: Form Submission → All Forms

### Custom Event Triggers
- **User Actions**: Custom Event → Event name: `user_action`
- **Feature Usage**: Custom Event → Event name: `feature_usage`
- **Errors**: Custom Event → Event name: `error`

## Step 10: Test Your Setup

### Preview Mode
1. Click **Preview** in GTM
2. Enter your website URL
3. Test various actions and verify events are firing
4. Check the GTM debug console for event data

### Real-time Testing
1. Go to Google Analytics 4
2. Navigate to **Reports** → **Realtime**
3. Perform actions on your site
4. Verify events appear in real-time

## Available GTM Functions in Your App

### Basic GTM Events
```typescript
import { useAnalyticsContext } from '../components/analytics/AnalyticsProvider';

const MyComponent = () => {
  const analytics = useAnalyticsContext();
  
  // Custom GTM event
  analytics.gtmEvent('custom_event', {
    event_category: 'engagement',
    event_label: 'button_click'
  });
};
```

### Ecommerce Tracking
```typescript
// Track purchase
analytics.trackGTMPurchase('TXN_123', 29.99, [
  {
    item_id: 'plan_pro',
    item_name: 'Pro Plan',
    price: 29.99,
    quantity: 1
  }
]);

// Track add to cart
analytics.trackGTMAddToCart('plan_pro', 'Pro Plan', 29.99);
```

### Custom Data Tracking
```typescript
// Track custom data
analytics.trackCustomData({
  user_segment: 'premium',
  feature_usage: 'advanced_analytics',
  custom_metric: 42
});
```

## Advanced GTM Features

### A/B Testing Integration
1. Set up Google Optimize in GTM
2. Create experiments for:
   - Pricing page layouts
   - Feature discovery flows
   - Call-to-action buttons

### Enhanced Ecommerce
1. Track product impressions
2. Monitor shopping cart behavior
3. Analyze checkout funnel
4. Measure product performance

### Custom Dimensions & Metrics
1. Set up custom dimensions for:
   - User plan type
   - Feature usage patterns
   - Content categories
2. Create custom metrics for:
   - Engagement scores
   - Feature adoption rates
   - User satisfaction

## Troubleshooting

### Common Issues

**Events not firing:**
1. Check GTM container ID is correct
2. Verify triggers are properly configured
3. Use GTM Preview mode to debug
4. Check browser console for errors

**Data not appearing in GA4:**
1. Verify GA4 configuration tag is firing
2. Check event parameters match GA4 requirements
3. Ensure proper event names are used
4. Wait 24-48 hours for data to appear

**GTM not loading:**
1. Check environment variable is set
2. Verify container ID format (GTM-XXXXXXX)
3. Check for ad blockers
4. Test in incognito mode

### Debug Tools
- **GTM Preview Mode**: Real-time debugging
- **Google Analytics Debugger**: Chrome extension
- **GTM Assistant**: Chrome extension
- **Data Layer Helper**: Chrome extension

## Best Practices

### Performance
1. Minimize the number of tags
2. Use tag firing rules efficiently
3. Implement proper tag sequencing
4. Monitor page load times

### Data Quality
1. Use consistent naming conventions
2. Validate data layer variables
3. Set up data quality monitoring
4. Regular audits of tag configuration

### Privacy & Compliance
1. Implement consent management
2. Respect user privacy preferences
3. Follow GDPR/CCPA requirements
4. Document data collection practices

## Support Resources

- [GTM Help Center](https://support.google.com/tagmanager/)
- [GTM Community](https://support.google.com/tagmanager/community)
- [GTM Developer Guide](https://developers.google.com/tag-manager)
- [GA4 Integration Guide](https://developers.google.com/analytics/devguides/collection/ga4)

## Next Steps

1. **Set up your GTM container** following this guide
2. **Configure your first tags** for GA4
3. **Test the implementation** using Preview mode
4. **Set up additional tracking** as needed
5. **Monitor and optimize** your tracking setup

Your app now has both Google Analytics 4 and Google Tag Manager integrated, giving you maximum flexibility for tracking and analytics!
