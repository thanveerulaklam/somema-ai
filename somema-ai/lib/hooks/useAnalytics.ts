import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  pageview, 
  trackUserEngagement, 
  trackFeatureUsage, 
  trackConversion, 
  trackError,
  gtmEvent,
  trackEcommerce,
  trackCustomData
} from '../analytics';
import { 
  initMetaPixel, 
  metaPixelEvents, 
  trackMetaPixelEvent, 
  trackConversionsAPI 
} from '../meta-pixel';
import {
  initGoogleAds,
  googleAdsConversions,
  googleAdsEcommerce,
  detectPaidTraffic,
  trackConversionByTraffic
} from '../google-ads';

export const useAnalytics = () => {
  const pathname = usePathname();

  // Track page views automatically
  useEffect(() => {
    if (pathname) {
      pageview(pathname);
      // Also track page view with Meta Pixel
      metaPixelEvents.pageView();
    }
  }, [pathname]);

  // Initialize Meta Pixel on mount
  useEffect(() => {
    initMetaPixel();
  }, []);

  // Initialize Google Ads on mount
  useEffect(() => {
    initGoogleAds();
  }, []);

  // Return tracking functions
  return {
    trackPageView: pageview,
    trackUserEngagement,
    trackFeatureUsage,
    trackConversion,
    trackError,
    
    // GTM-specific functions
    gtmEvent,
    trackEcommerce,
    trackCustomData,
    
    // Meta Pixel functions
    metaPixelEvents,
    trackMetaPixelEvent,
    trackConversionsAPI,
    
    // Google Ads functions
    googleAdsConversions,
    googleAdsEcommerce,
    detectPaidTraffic,
    trackConversionByTraffic,
    
    // Convenience methods for common actions
    trackLogin: () => trackUserEngagement('User Login'),
    trackSignup: () => trackUserEngagement('User Signup'),
    trackPostCreated: () => trackFeatureUsage('Post Creation'),
    trackPostScheduled: () => trackFeatureUsage('Post Scheduling'),
    trackImageEnhanced: () => trackFeatureUsage('Image Enhancement'),
    trackPayment: (amount?: number) => trackConversion('Payment', amount),
    trackPlanUpgrade: (planName: string) => trackConversion('Plan Upgrade', undefined),
    trackErrorOccurred: (errorType: string) => trackError(errorType),
    
    // GTM-specific convenience methods
    trackGTMConversion: (conversionType: string, value?: number) => {
      gtmEvent('conversion', { conversion_type: conversionType, value });
    },
    trackGTMUserAction: (action: string, details?: Record<string, any>) => {
      gtmEvent('user_action', { action, ...details });
    },
    trackGTMFeatureUsage: (feature: string, details?: Record<string, any>) => {
      gtmEvent('feature_usage', { feature, ...details });
    },
    trackGTMPurchase: (transactionId: string, value: number, items: any[]) => {
      trackEcommerce('purchase', {
        transaction_id: transactionId,
        value: value,
        currency: 'USD',
        items: items
      });
    },
    trackGTMAddToCart: (itemId: string, itemName: string, price: number) => {
      trackEcommerce('add_to_cart', {
        currency: 'USD',
        value: price,
        items: [{
          item_id: itemId,
          item_name: itemName,
          price: price,
          quantity: 1
        }]
      });
    },
    
    // Meta Pixel convenience methods
    trackMetaRegistration: (email?: string, plan?: string) => {
      metaPixelEvents.completeRegistration({
        content_name: 'User Registration',
        content_category: 'Account',
        value: plan === 'pro' ? 29.99 : 0,
        currency: 'USD',
        email: email
      });
    },
    trackMetaPurchase: (value: number, planName: string, transactionId?: string) => {
      metaPixelEvents.purchase(value, 'USD', {
        content_name: planName,
        content_category: 'Subscription',
        transaction_id: transactionId
      });
    },
    trackMetaLead: (source: string, value?: number) => {
      metaPixelEvents.lead({
        content_name: 'Lead Generation',
        content_category: source,
        value: value || 0,
        currency: 'USD'
      });
    },
    trackMetaTrial: (planName: string) => {
      metaPixelEvents.startTrial({
        content_name: planName,
        content_category: 'Trial',
        value: 0,
        currency: 'USD'
      });
    },
    trackMetaContact: (method: string) => {
      metaPixelEvents.contact({
        content_name: 'Contact',
        content_category: method,
        value: 0,
        currency: 'USD'
      });
    },
    trackMetaSubscribe: (planName: string, value: number) => {
      metaPixelEvents.subscribe({
        content_name: planName,
        content_category: 'Subscription',
        value: value,
        currency: 'USD'
      });
    },
    
    // Google Ads convenience methods
    trackGoogleAdsSignup: (isPaidTraffic?: boolean, value?: number, source?: string) => {
      googleAdsConversions.trackSignup(isPaidTraffic, value, source);
    },
    trackGoogleAdsPurchase: (value: number, planName: string, transactionId?: string, isPaidTraffic?: boolean) => {
      googleAdsConversions.trackPurchase(value, planName, transactionId, isPaidTraffic);
    },
    trackGoogleAdsTrial: (planName: string, isPaidTraffic?: boolean) => {
      googleAdsConversions.trackTrial(planName, isPaidTraffic);
    },
    trackGoogleAdsLead: (source: string, value?: number, isPaidTraffic?: boolean) => {
      googleAdsConversions.trackLead(source, value, isPaidTraffic);
    },
    trackGoogleAdsContact: (method: string, isPaidTraffic?: boolean) => {
      googleAdsConversions.trackContact(method, isPaidTraffic);
    },
    trackGoogleAdsFeatureUsage: (feature: string, isPaidTraffic?: boolean) => {
      googleAdsConversions.trackFeatureUsage(feature, isPaidTraffic);
    },
    
    // Smart conversion tracking that detects traffic source
    trackSmartSignup: (value?: number, source?: string) => {
      const isPaidTraffic = detectPaidTraffic();
      trackConversionByTraffic('trackSignup', [value, source], isPaidTraffic);
    },
    trackSmartPurchase: (value: number, planName: string, transactionId?: string) => {
      const isPaidTraffic = detectPaidTraffic();
      trackConversionByTraffic('trackPurchase', [value, planName, transactionId], isPaidTraffic);
    },
    trackSmartTrial: (planName: string) => {
      const isPaidTraffic = detectPaidTraffic();
      trackConversionByTraffic('trackTrial', [planName], isPaidTraffic);
    },
    trackSmartLead: (source: string, value?: number) => {
      const isPaidTraffic = detectPaidTraffic();
      trackConversionByTraffic('trackLead', [source, value], isPaidTraffic);
    },
    trackSmartContact: (method: string) => {
      const isPaidTraffic = detectPaidTraffic();
      trackConversionByTraffic('trackContact', [method], isPaidTraffic);
    },
    trackSmartFeatureUsage: (feature: string) => {
      const isPaidTraffic = detectPaidTraffic();
      trackConversionByTraffic('trackFeatureUsage', [feature], isPaidTraffic);
    },
  };
};
