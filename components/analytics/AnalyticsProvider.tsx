'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAnalytics } from '../../lib/hooks/useAnalytics';

interface AnalyticsContextType {
  trackUserEngagement: (action: string, details?: Record<string, any>) => void;
  trackFeatureUsage: (feature: string, details?: Record<string, any>) => void;
  trackConversion: (conversionType: string, value?: number) => void;
  trackError: (errorType: string, errorMessage?: string) => void;
  trackLogin: () => void;
  trackSignup: () => void;
  trackPostCreated: () => void;
  trackPostScheduled: () => void;
  trackImageEnhanced: () => void;
  trackPayment: (amount?: number) => void;
  trackPlanUpgrade: (planName: string) => void;
  trackErrorOccurred: (errorType: string) => void;
  
  // GTM-specific functions
  gtmEvent: (eventName: string, eventData?: Record<string, any>) => void;
  trackEcommerce: (eventName: string, ecommerceData: Record<string, any>) => void;
  trackCustomData: (customData: Record<string, any>) => void;
  trackGTMConversion: (conversionType: string, value?: number) => void;
  trackGTMUserAction: (action: string, details?: Record<string, any>) => void;
  trackGTMFeatureUsage: (feature: string, details?: Record<string, any>) => void;
  trackGTMPurchase: (transactionId: string, value: number, items: any[]) => void;
  trackGTMAddToCart: (itemId: string, itemName: string, price: number) => void;
  
  // Meta Pixel functions
  metaPixelEvents: any;
  trackMetaPixelEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackConversionsAPI: (eventName: string, parameters?: Record<string, any>) => Promise<void>;
  trackMetaRegistration: (email?: string, plan?: string) => void;
  trackMetaPurchase: (value: number, planName: string, transactionId?: string) => void;
  trackMetaLead: (source: string, value?: number) => void;
  trackMetaTrial: (planName: string) => void;
  trackMetaContact: (method: string) => void;
  trackMetaSubscribe: (planName: string, value: number) => void;
  
  // Google Ads functions
  googleAdsConversions: any;
  googleAdsEcommerce: any;
  detectPaidTraffic: () => boolean;
  trackConversionByTraffic: (conversionType: 'trackSignup' | 'trackPurchase' | 'trackTrial' | 'trackLead' | 'trackContact' | 'trackFeatureUsage', parameters: any[], forcePaidTraffic?: boolean) => void;
  trackGoogleAdsSignup: (isPaidTraffic?: boolean, value?: number, source?: string) => void;
  trackGoogleAdsPurchase: (value: number, planName: string, transactionId?: string, isPaidTraffic?: boolean) => void;
  trackGoogleAdsTrial: (planName: string, isPaidTraffic?: boolean) => void;
  trackGoogleAdsLead: (source: string, value?: number, isPaidTraffic?: boolean) => void;
  trackGoogleAdsContact: (method: string, isPaidTraffic?: boolean) => void;
  trackGoogleAdsFeatureUsage: (feature: string, isPaidTraffic?: boolean) => void;
  
  // Smart conversion tracking
  trackSmartSignup: (value?: number, source?: string) => void;
  trackSmartPurchase: (value: number, planName: string, transactionId?: string) => void;
  trackSmartTrial: (planName: string) => void;
  trackSmartLead: (source: string, value?: number) => void;
  trackSmartContact: (method: string) => void;
  trackSmartFeatureUsage: (feature: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const analytics = useAnalytics();

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};
