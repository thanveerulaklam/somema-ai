// Google Ads Conversion Tracking configuration and utilities
export const GOOGLE_ADS_CONVERSION_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || '';
export const GOOGLE_ADS_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || '';

// Conversion tracking labels for different actions
export const CONVERSION_LABELS = {
  SIGNUP: process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL || '',
  PURCHASE: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || '',
  TRIAL: process.env.NEXT_PUBLIC_GOOGLE_ADS_TRIAL_LABEL || '',
  LEAD: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || '',
  CONTACT: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL || '',
  FEATURE_USAGE: process.env.NEXT_PUBLIC_GOOGLE_ADS_FEATURE_LABEL || '',
} as const;

// Initialize Google Ads Conversion Tracking
export const initGoogleAds = () => {
  if (typeof window !== 'undefined' && GOOGLE_ADS_CONVERSION_ID) {
    // Initialize dataLayer for Google Ads
    window.dataLayer = window.dataLayer || [];
    
    // Load Google Ads conversion tracking script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=AW-${GOOGLE_ADS_CONVERSION_ID}`;
    document.head.appendChild(script);
    
    // Initialize gtag after script loads
    script.onload = () => {
      (window as any).gtag('config', `AW-${GOOGLE_ADS_CONVERSION_ID}`);
    };
  }
};

// Track Google Ads conversion
export const trackGoogleAdsConversion = (
  conversionLabel: string, 
  value?: number, 
  currency: string = 'USD',
  transactionId?: string,
  customParameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag && GOOGLE_ADS_CONVERSION_ID) {
    const conversionData: any = {
      send_to: `AW-${GOOGLE_ADS_CONVERSION_ID}/${conversionLabel}`,
      value: value,
      currency: currency,
      transaction_id: transactionId,
      ...customParameters
    };

    // Remove undefined values
    Object.keys(conversionData).forEach(key => {
      if (conversionData[key] === undefined) {
        delete conversionData[key];
      }
    });

    window.gtag('event', 'conversion', conversionData);
  }
};

// Track conversion with enhanced ecommerce data
export const trackGoogleAdsConversionWithItems = (
  conversionLabel: string,
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>,
  value?: number,
  currency: string = 'USD',
  transactionId?: string
) => {
  if (typeof window !== 'undefined' && window.gtag && GOOGLE_ADS_CONVERSION_ID) {
    const totalValue = value || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const conversionData: any = {
      send_to: `AW-${GOOGLE_ADS_CONVERSION_ID}/${conversionLabel}`,
      value: totalValue,
      currency: currency,
      transaction_id: transactionId,
      items: items
    };

    window.gtag('event', 'conversion', conversionData);
  }
};

// Predefined conversion tracking functions
export const googleAdsConversions = {
  // Track user signup (organic vs paid)
  trackSignup: (isPaidTraffic: boolean = false, value?: number, source?: string) => {
    const label = isPaidTraffic ? CONVERSION_LABELS.SIGNUP : '';
    if (label) {
      trackGoogleAdsConversion(label, value, 'USD', undefined, {
        custom_parameter: {
          traffic_source: isPaidTraffic ? 'paid' : 'organic',
          signup_source: source || 'website'
        }
      });
    }
  },

  // Track purchase conversion
  trackPurchase: (value: number, planName: string, transactionId?: string, isPaidTraffic: boolean = false) => {
    const label = isPaidTraffic ? CONVERSION_LABELS.PURCHASE : '';
    if (label) {
      trackGoogleAdsConversion(label, value, 'USD', transactionId, {
        custom_parameter: {
          plan_name: planName,
          traffic_source: isPaidTraffic ? 'paid' : 'organic'
        }
      });
    }
  },

  // Track trial start
  trackTrial: (planName: string, isPaidTraffic: boolean = false) => {
    const label = isPaidTraffic ? CONVERSION_LABELS.TRIAL : '';
    if (label) {
      trackGoogleAdsConversion(label, 0, 'USD', undefined, {
        custom_parameter: {
          plan_name: planName,
          traffic_source: isPaidTraffic ? 'paid' : 'organic'
        }
      });
    }
  },

  // Track lead generation
  trackLead: (source: string, value?: number, isPaidTraffic: boolean = false) => {
    const label = isPaidTraffic ? CONVERSION_LABELS.LEAD : '';
    if (label) {
      trackGoogleAdsConversion(label, value || 0, 'USD', undefined, {
        custom_parameter: {
          lead_source: source,
          traffic_source: isPaidTraffic ? 'paid' : 'organic'
        }
      });
    }
  },

  // Track contact form submission
  trackContact: (method: string, isPaidTraffic: boolean = false) => {
    const label = isPaidTraffic ? CONVERSION_LABELS.CONTACT : '';
    if (label) {
      trackGoogleAdsConversion(label, 0, 'USD', undefined, {
        custom_parameter: {
          contact_method: method,
          traffic_source: isPaidTraffic ? 'paid' : 'organic'
        }
      });
    }
  },

  // Track feature usage
  trackFeatureUsage: (feature: string, isPaidTraffic: boolean = false) => {
    const label = isPaidTraffic ? CONVERSION_LABELS.FEATURE_USAGE : '';
    if (label) {
      trackGoogleAdsConversion(label, 0, 'USD', undefined, {
        custom_parameter: {
          feature_name: feature,
          traffic_source: isPaidTraffic ? 'paid' : 'organic'
        }
      });
    }
  },

  // Track custom conversion
  trackCustom: (conversionLabel: string, value?: number, customParameters?: Record<string, any>, isPaidTraffic: boolean = false) => {
    if (isPaidTraffic) {
      trackGoogleAdsConversion(conversionLabel, value, 'USD', undefined, {
        custom_parameter: {
          ...customParameters,
          traffic_source: 'paid'
        }
      });
    }
  }
};

// Enhanced ecommerce tracking for Google Ads
export const googleAdsEcommerce = {
  // Track purchase with items
  trackPurchaseWithItems: (
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category?: string;
    }>,
    transactionId: string,
    isPaidTraffic: boolean = false
  ) => {
    const label = isPaidTraffic ? CONVERSION_LABELS.PURCHASE : '';
    if (label) {
      trackGoogleAdsConversionWithItems(label, items, undefined, 'USD', transactionId);
    }
  },

  // Track add to cart
  trackAddToCart: (
    itemId: string,
    itemName: string,
    price: number,
    quantity: number = 1,
    isPaidTraffic: boolean = false
  ) => {
    if (isPaidTraffic && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: price * quantity,
        items: [{
          item_id: itemId,
          item_name: itemName,
          price: price,
          quantity: quantity
        }]
      });
    }
  },

  // Track begin checkout
  trackBeginCheckout: (
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>,
    isPaidTraffic: boolean = false
  ) => {
    if (isPaidTraffic && typeof window !== 'undefined' && window.gtag) {
      const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: totalValue,
        items: items
      });
    }
  }
};

// Utility to detect paid traffic
export const detectPaidTraffic = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Google Ads click ID
  const urlParams = new URLSearchParams(window.location.search);
  const gclid = urlParams.get('gclid');
  
  // Check for other paid traffic indicators
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  // Check referrer for paid traffic
  const referrer = document.referrer;
  const isPaidReferrer = referrer.includes('google.com') || 
                        referrer.includes('facebook.com') || 
                        referrer.includes('bing.com') ||
                        referrer.includes('linkedin.com');
  
  return !!(gclid || 
           (utmSource && utmMedium && utmCampaign) || 
           isPaidReferrer);
};

// Track conversion based on traffic source
export const trackConversionByTraffic = (
  conversionType: keyof typeof googleAdsConversions,
  parameters: any[] = [],
  forcePaidTraffic?: boolean
) => {
  const isPaidTraffic = forcePaidTraffic !== undefined ? forcePaidTraffic : detectPaidTraffic();
  
  if (conversionType === 'trackSignup') {
    googleAdsConversions.trackSignup(isPaidTraffic, parameters[0], parameters[1]);
  } else if (conversionType === 'trackPurchase') {
    googleAdsConversions.trackPurchase(parameters[0], parameters[1], parameters[2], isPaidTraffic);
  } else if (conversionType === 'trackTrial') {
    googleAdsConversions.trackTrial(parameters[0], isPaidTraffic);
  } else if (conversionType === 'trackLead') {
    googleAdsConversions.trackLead(parameters[0], parameters[1], isPaidTraffic);
  } else if (conversionType === 'trackContact') {
    googleAdsConversions.trackContact(parameters[0], isPaidTraffic);
  } else if (conversionType === 'trackFeatureUsage') {
    googleAdsConversions.trackFeatureUsage(parameters[0], isPaidTraffic);
  }
};

// Declare gtag on window object
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}
