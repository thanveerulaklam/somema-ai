// Google Analytics and Google Tag Manager configuration and utilities
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Log page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
  
  // Also push to dataLayer for GTM
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_location: url,
    });
  }
};

// Log specific events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
  
  // Also push to dataLayer for GTM
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: action,
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// GTM-specific event tracking
export const gtmEvent = (eventName: string, eventData: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }
};

// Track user engagement events
export const trackUserEngagement = (action: string, details?: Record<string, any>) => {
  event({
    action,
    category: 'User Engagement',
    label: details?.label,
  });
  
  // Also track via GTM
  gtmEvent('user_engagement', {
    action,
    category: 'User Engagement',
    ...details,
  });
};

// Track feature usage
export const trackFeatureUsage = (feature: string, details?: Record<string, any>) => {
  event({
    action: 'Feature Used',
    category: 'Feature Usage',
    label: feature,
  });
  
  // Also track via GTM
  gtmEvent('feature_usage', {
    feature,
    category: 'Feature Usage',
    ...details,
  });
};

// Track conversion events
export const trackConversion = (conversionType: string, value?: number) => {
  event({
    action: 'Conversion',
    category: 'Conversions',
    label: conversionType,
    value,
  });
  
  // Also track via GTM
  gtmEvent('conversion', {
    conversion_type: conversionType,
    value,
    category: 'Conversions',
  });
};

// Track error events
export const trackError = (errorType: string, errorMessage?: string) => {
  event({
    action: 'Error',
    category: 'Errors',
    label: errorType,
  });
  
  // Also track via GTM
  gtmEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    category: 'Errors',
  });
};

// Track ecommerce events for GTM
export const trackEcommerce = (eventName: string, ecommerceData: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ecommerce: ecommerceData,
    });
  }
};

// Track custom dimensions and metrics
export const trackCustomData = (customData: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'custom_data',
      ...customData,
    });
  }
};

// Declare gtag and dataLayer on window object
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
