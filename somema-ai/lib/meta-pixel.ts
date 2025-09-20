// Meta (Facebook) Pixel and Conversions API configuration and utilities
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
export const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';

// Flag to prevent multiple initializations
let metaPixelInitialized = false;

// Initialize Meta Pixel
export const initMetaPixel = () => {
  if (typeof window !== 'undefined') {
    // Check if Meta Pixel ID is configured
    if (!META_PIXEL_ID) {
      console.warn('Meta Pixel ID not configured. Set NEXT_PUBLIC_META_PIXEL_ID environment variable.');
      return;
    }
    
    // Prevent multiple initializations
    if (metaPixelInitialized) {
      return;
    }
    
    // Initialize dataLayer for Meta Pixel
    window.dataLayer = window.dataLayer || [];
    
    // Check if fbq is already available
    if (window.fbq) {
      try {
        window.fbq('init', META_PIXEL_ID);
        window.fbq('track', 'PageView');
        metaPixelInitialized = true;
      } catch (error) {
        console.warn('Error initializing existing Facebook Pixel:', error);
      }
      return;
    }
    
    // Load Meta Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    
    // Initialize fbq after script loads
    script.onload = () => {
      // Wait a bit for fbq to be fully initialized
      setTimeout(() => {
        if (window.fbq) {
          try {
            window.fbq('init', META_PIXEL_ID);
            window.fbq('track', 'PageView');
            metaPixelInitialized = true;
          } catch (error) {
            console.warn('Error initializing Facebook Pixel:', error);
          }
        } else {
          console.warn('Facebook Pixel (fbq) not available after script load');
        }
      }, 100);
    };
    
    // Handle script load errors
    script.onerror = () => {
      console.warn('Failed to load Facebook Pixel script');
    };
  }
};

// Meta Pixel event tracking
export const trackMetaPixelEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && META_PIXEL_ID) {
    if (window.fbq) {
      try {
        window.fbq('track', eventName, parameters);
      } catch (error) {
        console.warn(`Error tracking Facebook Pixel event ${eventName}:`, error);
      }
    } else {
      console.warn(`Facebook Pixel not available for event: ${eventName}`);
    }
  }
};

// Conversions API event tracking
export const trackConversionsAPI = async (eventName: string, parameters: Record<string, any> = {}) => {
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID) {
    console.warn('Meta Conversions API not configured');
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: typeof window !== 'undefined' ? window.location.href : '',
          user_data: {
            client_ip_address: parameters.client_ip_address,
            client_user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
            em: parameters.email ? hashEmail(parameters.email) : undefined,
            ph: parameters.phone ? hashPhone(parameters.phone) : undefined,
          },
          custom_data: {
            ...parameters.custom_data,
            content_name: parameters.content_name,
            content_category: parameters.content_category,
            value: parameters.value,
            currency: parameters.currency || 'USD',
          }
        }],
        access_token: META_ACCESS_TOKEN,
      }),
    });

    if (!response.ok) {
      console.error('Meta Conversions API error:', await response.text());
    }
  } catch (error) {
    console.error('Meta Conversions API error:', error);
  }
};

// Hash email for privacy compliance
const hashEmail = (email: string): string => {
  // In production, use proper SHA256 hashing
  // This is a simplified version for demo purposes
  return btoa(email.toLowerCase().trim());
};

// Hash phone for privacy compliance
const hashPhone = (phone: string): string => {
  // In production, use proper SHA256 hashing
  // This is a simplified version for demo purposes
  return btoa(phone.replace(/\D/g, ''));
};

// Predefined Meta Pixel events
export const metaPixelEvents = {
  // Page View
  pageView: () => trackMetaPixelEvent('PageView'),
  
  // User Registration
  completeRegistration: (parameters?: Record<string, any>) => {
    trackMetaPixelEvent('CompleteRegistration', parameters);
    trackConversionsAPI('CompleteRegistration', parameters);
  },
  
  // Lead Generation
  lead: (parameters?: Record<string, any>) => {
    trackMetaPixelEvent('Lead', parameters);
    trackConversionsAPI('Lead', parameters);
  },
  
  // Purchase
  purchase: (value: number, currency: string = 'USD', parameters?: Record<string, any>) => {
    const eventData = {
      value: value,
      currency: currency,
      ...parameters
    };
    trackMetaPixelEvent('Purchase', eventData);
    trackConversionsAPI('Purchase', eventData);
  },
  
  // Add to Cart
  addToCart: (value: number, currency: string = 'USD', parameters?: Record<string, any>) => {
    const eventData = {
      value: value,
      currency: currency,
      ...parameters
    };
    trackMetaPixelEvent('AddToCart', eventData);
    trackConversionsAPI('AddToCart', eventData);
  },
  
  // Initiate Checkout
  initiateCheckout: (value: number, currency: string = 'USD', parameters?: Record<string, any>) => {
    const eventData = {
      value: value,
      currency: currency,
      ...parameters
    };
    trackMetaPixelEvent('InitiateCheckout', eventData);
    trackConversionsAPI('InitiateCheckout', eventData);
  },
  
  // View Content
  viewContent: (parameters?: Record<string, any>) => {
    trackMetaPixelEvent('ViewContent', parameters);
    trackConversionsAPI('ViewContent', parameters);
  },
  
  // Custom Event
  custom: (eventName: string, parameters?: Record<string, any>) => {
    trackMetaPixelEvent(eventName, parameters);
    trackConversionsAPI(eventName, parameters);
  },
  
  // Contact
  contact: (parameters?: Record<string, any>) => {
    trackMetaPixelEvent('Contact', parameters);
    trackConversionsAPI('Contact', parameters);
  },
  
  // Subscribe
  subscribe: (parameters?: Record<string, any>) => {
    trackMetaPixelEvent('Subscribe', parameters);
    trackConversionsAPI('Subscribe', parameters);
  },
  
  // Start Trial
  startTrial: (parameters?: Record<string, any>) => {
    trackMetaPixelEvent('StartTrial', parameters);
    trackConversionsAPI('StartTrial', parameters);
  },
  
  // Free Trial
  freeTrial: (parameters?: Record<string, any>) => {
    trackMetaPixelEvent('FreeTrial', parameters);
    trackConversionsAPI('FreeTrial', parameters);
  }
};

// Declare fbq on window object
declare global {
  interface Window {
    fbq: any;
    dataLayer?: any[];
  }
}
