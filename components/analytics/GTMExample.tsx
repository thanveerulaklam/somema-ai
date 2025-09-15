'use client';

import { useAnalyticsContext } from './AnalyticsProvider';

// Example component showing GTM-specific tracking
export const GTMExample = () => {
  const analytics = useAnalyticsContext();

  const handlePurchase = () => {
    // Track purchase with GTM ecommerce
    analytics.trackGTMPurchase('TXN_12345', 29.99, [
      {
        item_id: 'plan_pro',
        item_name: 'Pro Plan',
        price: 29.99,
        quantity: 1,
        category: 'subscription'
      }
    ]);
  };

  const handleAddToCart = () => {
    // Track add to cart
    analytics.trackGTMAddToCart('plan_pro', 'Pro Plan', 29.99);
  };

  const handleCustomEvent = () => {
    // Track custom GTM event
    analytics.gtmEvent('custom_button_click', {
      button_name: 'example_button',
      page_section: 'demo',
      user_type: 'demo_user'
    });
  };

  const handleUserAction = () => {
    // Track user action
    analytics.trackGTMUserAction('demo_action', {
      action_type: 'button_click',
      section: 'gtm_demo',
      timestamp: new Date().toISOString()
    });
  };

  const handleFeatureUsage = () => {
    // Track feature usage with GTM
    analytics.trackGTMFeatureUsage('gtm_demo_feature', {
      feature_type: 'demo',
      usage_context: 'example',
      user_segment: 'demo'
    });
  };

  const handleCustomData = () => {
    // Track custom data
    analytics.trackCustomData({
      custom_dimension_1: 'demo_value',
      custom_metric_1: 42,
      user_preference: 'demo_mode',
      session_data: {
        start_time: new Date().toISOString(),
        demo_mode: true
      }
    });
  };

  const handleConversion = () => {
    // Track conversion with GTM
    analytics.trackGTMConversion('demo_conversion', 100);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-xl font-semibold text-gray-900">Google Tag Manager Examples</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Ecommerce Tracking</h4>
          
          <button 
            onClick={handleAddToCart}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add to Cart (GTM)
          </button>
          
          <button 
            onClick={handlePurchase}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Complete Purchase (GTM)
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Custom Events</h4>
          
          <button 
            onClick={handleCustomEvent}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Custom Event (GTM)
          </button>
          
          <button 
            onClick={handleUserAction}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            User Action (GTM)
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Feature & Data Tracking</h4>
          
          <button 
            onClick={handleFeatureUsage}
            className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Feature Usage (GTM)
          </button>
          
          <button 
            onClick={handleCustomData}
            className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Custom Data (GTM)
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Conversions</h4>
          
          <button 
            onClick={handleConversion}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Track Conversion (GTM)
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">GTM Benefits:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• No-code tag management</li>
          <li>• Advanced ecommerce tracking</li>
          <li>• Custom event triggers</li>
          <li>• A/B testing integration</li>
          <li>• Multiple analytics platforms</li>
          <li>• Real-time debugging</li>
        </ul>
      </div>
    </div>
  );
};
