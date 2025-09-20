'use client';

import { useAnalyticsContext } from './AnalyticsProvider';

// Example component showing Google Ads Conversion Tracking
export const GoogleAdsExample = () => {
  const analytics = useAnalyticsContext();

  const handlePaidSignup = () => {
    // Track signup from paid traffic
    analytics.trackGoogleAdsSignup(true, 29.99, 'google_ads');
  };

  const handleOrganicSignup = () => {
    // Track signup from organic traffic (no conversion tracking)
    analytics.trackGoogleAdsSignup(false, 0, 'organic');
  };

  const handleSmartSignup = () => {
    // Automatically detect traffic source and track accordingly
    analytics.trackSmartSignup(29.99, 'smart_detection');
  };

  const handlePaidPurchase = () => {
    // Track purchase from paid traffic
    analytics.trackGoogleAdsPurchase(29.99, 'Pro Plan', 'TXN_PAID_001', true);
  };

  const handleOrganicPurchase = () => {
    // Track purchase from organic traffic (no conversion tracking)
    analytics.trackGoogleAdsPurchase(29.99, 'Pro Plan', 'TXN_ORG_001', false);
  };

  const handleSmartPurchase = () => {
    // Automatically detect traffic source and track accordingly
    analytics.trackSmartPurchase(29.99, 'Pro Plan', 'TXN_SMART_001');
  };

  const handlePaidTrial = () => {
    // Track trial start from paid traffic
    analytics.trackGoogleAdsTrial('Pro Plan', true);
  };

  const handleSmartTrial = () => {
    // Automatically detect traffic source and track accordingly
    analytics.trackSmartTrial('Pro Plan');
  };

  const handlePaidLead = () => {
    // Track lead from paid traffic
    analytics.trackGoogleAdsLead('contact_form', 50, true);
  };

  const handleSmartLead = () => {
    // Automatically detect traffic source and track accordingly
    analytics.trackSmartLead('contact_form', 50);
  };

  const handlePaidContact = () => {
    // Track contact from paid traffic
    analytics.trackGoogleAdsContact('contact_form', true);
  };

  const handleSmartContact = () => {
    // Automatically detect traffic source and track accordingly
    analytics.trackSmartContact('contact_form');
  };

  const handlePaidFeatureUsage = () => {
    // Track feature usage from paid traffic
    analytics.trackGoogleAdsFeatureUsage('post_creation', true);
  };

  const handleSmartFeatureUsage = () => {
    // Automatically detect traffic source and track accordingly
    analytics.trackSmartFeatureUsage('post_creation');
  };

  const handleEcommercePurchase = () => {
    // Track purchase with items for Google Ads
    analytics.googleAdsEcommerce.trackPurchaseWithItems([
      {
        id: 'plan_pro',
        name: 'Pro Plan',
        price: 29.99,
        quantity: 1,
        category: 'subscription'
      }
    ], 'TXN_ECOMM_001', true);
  };

  const handleAddToCart = () => {
    // Track add to cart for Google Ads
    analytics.googleAdsEcommerce.trackAddToCart('plan_pro', 'Pro Plan', 29.99, 1, true);
  };

  const handleBeginCheckout = () => {
    // Track begin checkout for Google Ads
    analytics.googleAdsEcommerce.trackBeginCheckout([
      {
        id: 'plan_pro',
        name: 'Pro Plan',
        price: 29.99,
        quantity: 1
      }
    ], true);
  };

  const checkTrafficSource = () => {
    const isPaidTraffic = analytics.detectPaidTraffic();
    alert(`Traffic Source: ${isPaidTraffic ? 'Paid Traffic' : 'Organic Traffic'}`);
  };

  return (
    <div className="space-y-6 p-6 bg-green-50 rounded-lg">
      <h3 className="text-xl font-semibold text-green-900">Google Ads Conversion Tracking Examples</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium text-green-800">Signup Tracking</h4>
          
          <button 
            onClick={handlePaidSignup}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Paid Signup ($29.99)
          </button>
          
          <button 
            onClick={handleOrganicSignup}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Organic Signup (No Tracking)
          </button>
          
          <button 
            onClick={handleSmartSignup}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Smart Signup (Auto Detect)
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-green-800">Purchase Tracking</h4>
          
          <button 
            onClick={handlePaidPurchase}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Paid Purchase ($29.99)
          </button>
          
          <button 
            onClick={handleOrganicPurchase}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Organic Purchase (No Tracking)
          </button>
          
          <button 
            onClick={handleSmartPurchase}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Smart Purchase (Auto Detect)
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-green-800">Trial & Lead Tracking</h4>
          
          <button 
            onClick={handlePaidTrial}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Paid Trial Start
          </button>
          
          <button 
            onClick={handleSmartTrial}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Smart Trial (Auto Detect)
          </button>
          
          <button 
            onClick={handlePaidLead}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Paid Lead ($50)
          </button>
          
          <button 
            onClick={handleSmartLead}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Smart Lead (Auto Detect)
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-green-800">Contact & Feature Tracking</h4>
          
          <button 
            onClick={handlePaidContact}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Paid Contact
          </button>
          
          <button 
            onClick={handleSmartContact}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Smart Contact (Auto Detect)
          </button>
          
          <button 
            onClick={handlePaidFeatureUsage}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Paid Feature Usage
          </button>
          
          <button 
            onClick={handleSmartFeatureUsage}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Smart Feature Usage (Auto Detect)
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-green-800">Ecommerce Tracking</h4>
          
          <button 
            onClick={handleEcommercePurchase}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Ecommerce Purchase
          </button>
          
          <button 
            onClick={handleAddToCart}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add to Cart
          </button>
          
          <button 
            onClick={handleBeginCheckout}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Begin Checkout
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-green-800">Traffic Detection</h4>
          
          <button 
            onClick={checkTrafficSource}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Check Traffic Source
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-100 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Google Ads Benefits:</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Separate tracking for paid vs organic conversions</li>
          <li>• Automatic traffic source detection (gclid, UTM, referrer)</li>
          <li>• Enhanced ecommerce tracking</li>
          <li>• Campaign optimization for paying customers</li>
          <li>• Smart conversion tracking with auto-detection</li>
          <li>• Better ROI measurement for ad spend</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Traffic Detection Logic:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Google Ads click ID (gclid parameter)</li>
          <li>• UTM parameters (utm_source, utm_medium, utm_campaign)</li>
          <li>• Paid referrers (google.com, facebook.com, bing.com, linkedin.com)</li>
          <li>• Only tracks conversions for paid traffic sources</li>
        </ul>
      </div>
    </div>
  );
};
