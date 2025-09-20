// Test script to verify Google Analytics, Google Tag Manager, Meta Pixel, and Google Ads setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Google Analytics, Google Tag Manager, Meta Pixel & Google Ads Setup...\n');

// Check if @next/third-parties is installed
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasThirdParties = packageJson.dependencies['@next/third-parties'];
  
  if (hasThirdParties) {
    console.log('✅ @next/third-parties package is installed');
  } else {
    console.log('❌ @next/third-parties package is missing');
    console.log('   Run: npm install @next/third-parties');
  }
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Check if analytics files exist
const filesToCheck = [
  'lib/analytics.ts',
  'lib/meta-pixel.ts',
  'lib/google-ads.ts',
  'lib/hooks/useAnalytics.ts',
  'components/analytics/AnalyticsProvider.tsx',
  'components/analytics/AnalyticsExample.tsx',
  'components/analytics/GTMExample.tsx',
  'components/analytics/MetaPixelExample.tsx',
  'components/analytics/GoogleAdsExample.tsx',
  'GOOGLE_ANALYTICS_SETUP.md',
  'GOOGLE_TAG_MANAGER_SETUP.md',
  'META_PIXEL_SETUP.md',
  'GOOGLE_ADS_SETUP.md'
];

console.log('\n📁 Checking analytics files:');
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check layout.tsx for analytics integration
try {
  const layoutContent = fs.readFileSync('app/layout.tsx', 'utf8');
  const hasGoogleAnalytics = layoutContent.includes('GoogleAnalytics');
  const hasGoogleTagManager = layoutContent.includes('GoogleTagManager');
  const hasAnalyticsProvider = layoutContent.includes('AnalyticsProvider');
  
  console.log('\n🔧 Checking layout.tsx integration:');
  if (hasGoogleAnalytics) {
    console.log('✅ GoogleAnalytics component is imported and used');
  } else {
    console.log('❌ GoogleAnalytics component is missing from layout.tsx');
  }
  
  if (hasGoogleTagManager) {
    console.log('✅ GoogleTagManager component is imported and used');
  } else {
    console.log('❌ GoogleTagManager component is missing from layout.tsx');
  }
  
  if (hasAnalyticsProvider) {
    console.log('✅ AnalyticsProvider is wrapping the app');
  } else {
    console.log('❌ AnalyticsProvider is missing from layout.tsx');
  }
} catch (error) {
  console.log('❌ Could not read app/layout.tsx');
}

// Check analytics.ts for GTM functions
try {
  const analyticsContent = fs.readFileSync('lib/analytics.ts', 'utf8');
  const hasGTMEvent = analyticsContent.includes('gtmEvent');
  const hasTrackEcommerce = analyticsContent.includes('trackEcommerce');
  const hasDataLayer = analyticsContent.includes('dataLayer');
  
  console.log('\n📊 Checking analytics.ts GTM functions:');
  if (hasGTMEvent) {
    console.log('✅ gtmEvent function is implemented');
  } else {
    console.log('❌ gtmEvent function is missing');
  }
  
  if (hasTrackEcommerce) {
    console.log('✅ trackEcommerce function is implemented');
  } else {
    console.log('❌ trackEcommerce function is missing');
  }
  
  if (hasDataLayer) {
    console.log('✅ dataLayer integration is implemented');
  } else {
    console.log('❌ dataLayer integration is missing');
  }
} catch (error) {
  console.log('❌ Could not read lib/analytics.ts');
}

// Check meta-pixel.ts for Meta Pixel functions
try {
  const metaPixelContent = fs.readFileSync('lib/meta-pixel.ts', 'utf8');
  const hasMetaPixelEvents = metaPixelContent.includes('metaPixelEvents');
  const hasTrackConversionsAPI = metaPixelContent.includes('trackConversionsAPI');
  const hasInitMetaPixel = metaPixelContent.includes('initMetaPixel');
  
  console.log('\n📊 Checking meta-pixel.ts functions:');
  if (hasMetaPixelEvents) {
    console.log('✅ metaPixelEvents object is implemented');
  } else {
    console.log('❌ metaPixelEvents object is missing');
  }
  
  if (hasTrackConversionsAPI) {
    console.log('✅ trackConversionsAPI function is implemented');
  } else {
    console.log('❌ trackConversionsAPI function is missing');
  }
  
  if (hasInitMetaPixel) {
    console.log('✅ initMetaPixel function is implemented');
  } else {
    console.log('❌ initMetaPixel function is missing');
  }
} catch (error) {
  console.log('❌ Could not read lib/meta-pixel.ts');
}

// Check google-ads.ts for Google Ads functions
try {
  const googleAdsContent = fs.readFileSync('lib/google-ads.ts', 'utf8');
  const hasGoogleAdsConversions = googleAdsContent.includes('googleAdsConversions');
  const hasDetectPaidTraffic = googleAdsContent.includes('detectPaidTraffic');
  const hasInitGoogleAds = googleAdsContent.includes('initGoogleAds');
  
  console.log('\n📊 Checking google-ads.ts functions:');
  if (hasGoogleAdsConversions) {
    console.log('✅ googleAdsConversions object is implemented');
  } else {
    console.log('❌ googleAdsConversions object is missing');
  }
  
  if (hasDetectPaidTraffic) {
    console.log('✅ detectPaidTraffic function is implemented');
  } else {
    console.log('❌ detectPaidTraffic function is missing');
  }
  
  if (hasInitGoogleAds) {
    console.log('✅ initGoogleAds function is implemented');
  } else {
    console.log('❌ initGoogleAds function is missing');
  }
} catch (error) {
  console.log('❌ Could not read lib/google-ads.ts');
}

// Check dashboard integration
try {
  const dashboardContent = fs.readFileSync('app/dashboard/DashboardContent.tsx', 'utf8');
  const hasAnalyticsImport = dashboardContent.includes('useAnalyticsContext');
  const hasAnalyticsUsage = dashboardContent.includes('analytics.trackFeatureUsage');
  const hasMetaPixelUsage = dashboardContent.includes('metaPixelEvents');
  const hasGoogleAdsUsage = dashboardContent.includes('trackSmartFeatureUsage');
  
  console.log('\n📊 Checking dashboard integration:');
  if (hasAnalyticsImport) {
    console.log('✅ Analytics context is imported in dashboard');
  } else {
    console.log('❌ Analytics context is missing from dashboard');
  }
  
  if (hasAnalyticsUsage) {
    console.log('✅ Analytics tracking is implemented in dashboard');
  } else {
    console.log('❌ Analytics tracking is missing from dashboard');
  }
  
  if (hasMetaPixelUsage) {
    console.log('✅ Meta Pixel tracking is implemented in dashboard');
  } else {
    console.log('❌ Meta Pixel tracking is missing from dashboard');
  }
  
  if (hasGoogleAdsUsage) {
    console.log('✅ Google Ads tracking is implemented in dashboard');
  } else {
    console.log('❌ Google Ads tracking is missing from dashboard');
  }
} catch (error) {
  console.log('❌ Could not read app/dashboard/DashboardContent.tsx');
}

// Check login integration
try {
  const loginContent = fs.readFileSync('app/login/page.tsx', 'utf8');
  const hasLoginTracking = loginContent.includes('analytics.trackLogin');
  const hasErrorTracking = loginContent.includes('analytics.trackErrorOccurred');
  const hasMetaRegistration = loginContent.includes('trackMetaRegistration');
  const hasGoogleAdsSignup = loginContent.includes('trackSmartSignup');
  
  console.log('\n🔐 Checking login integration:');
  if (hasLoginTracking) {
    console.log('✅ Login tracking is implemented');
  } else {
    console.log('❌ Login tracking is missing');
  }
  
  if (hasErrorTracking) {
    console.log('✅ Error tracking is implemented');
  } else {
    console.log('❌ Error tracking is missing');
  }
  
  if (hasMetaRegistration) {
    console.log('✅ Meta Pixel registration tracking is implemented');
  } else {
    console.log('❌ Meta Pixel registration tracking is missing');
  }
  
  if (hasGoogleAdsSignup) {
    console.log('✅ Google Ads signup tracking is implemented');
  } else {
    console.log('❌ Google Ads signup tracking is missing');
  }
} catch (error) {
  console.log('❌ Could not read app/login/page.tsx');
}

console.log('\n📋 Next Steps:');
console.log('1. Set NEXT_PUBLIC_GA_ID in your environment variables');
console.log('2. Set NEXT_PUBLIC_GTM_ID in your environment variables');
console.log('3. Set NEXT_PUBLIC_META_PIXEL_ID in your environment variables');
console.log('4. Set META_ACCESS_TOKEN in your environment variables');
console.log('5. Set NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID in your environment variables');
console.log('6. Set Google Ads conversion labels in your environment variables');
console.log('7. Get your GA4 Measurement ID from Google Analytics');
console.log('8. Get your GTM Container ID from Google Tag Manager');
console.log('9. Get your Meta Pixel ID from Meta Business Manager');
console.log('10. Get your Google Ads Conversion ID and Labels from Google Ads');
console.log('11. Test the integration by running: npm run dev');
console.log('12. Check GA4 Real-Time reports for data');
console.log('13. Use GTM Preview mode to test tags');
console.log('14. Check Meta Events Manager for pixel data');
console.log('15. Check Google Ads conversion tracking in real-time');
console.log('16. Review GOOGLE_ANALYTICS_SETUP.md for GA4 instructions');
console.log('17. Review GOOGLE_TAG_MANAGER_SETUP.md for GTM instructions');
console.log('18. Review META_PIXEL_SETUP.md for Meta Pixel instructions');
console.log('19. Review GOOGLE_ADS_SETUP.md for Google Ads instructions');

console.log('\n🎯 Analytics will track:');
console.log('- Page views (automatic)');
console.log('- User engagement events');
console.log('- Feature usage (post creation, navigation, etc.)');
console.log('- Conversions (payments, upgrades)');
console.log('- Errors and issues');
console.log('- Ecommerce events (purchases, add to cart)');
console.log('- Custom GTM events');
console.log('- Data layer events');
console.log('- Meta Pixel events (registration, purchase, lead, etc.)');
console.log('- Server-side Conversions API events');
console.log('- Google Ads conversions (paid vs organic)');
console.log('- Smart traffic source detection');
console.log('- Enhanced ecommerce tracking');

console.log('\n🚀 GTM Benefits:');
console.log('- No-code tag management');
console.log('- Advanced ecommerce tracking');
console.log('- Multiple analytics platforms');
console.log('- Real-time debugging');
console.log('- A/B testing integration');
console.log('- Custom event triggers');

console.log('\n📘 Meta Pixel Benefits:');
console.log('- Facebook advertising optimization');
console.log('- Lookalike audience creation');
console.log('- Conversion tracking and attribution');
console.log('- Retargeting campaigns');
console.log('- Server-side event tracking');
console.log('- Privacy-compliant data collection');

console.log('\n💰 Google Ads Benefits:');
console.log('- Separate tracking for paid vs organic conversions');
console.log('- Automatic traffic source detection (gclid, UTM, referrer)');
console.log('- Enhanced ecommerce tracking');
console.log('- Campaign optimization for paying customers');
console.log('- Smart conversion tracking with auto-detection');
console.log('- Better ROI measurement for ad spend');
