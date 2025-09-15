'use client';

import { useAnalyticsContext } from './AnalyticsProvider';

// Example component showing Meta Pixel and Conversions API tracking
export const MetaPixelExample = () => {
  const analytics = useAnalyticsContext();

  const handleRegistration = () => {
    // Track user registration
    analytics.trackMetaRegistration('user@example.com', 'pro');
  };

  const handlePurchase = () => {
    // Track purchase
    analytics.trackMetaPurchase(29.99, 'Pro Plan', 'TXN_12345');
  };

  const handleLead = () => {
    // Track lead generation
    analytics.trackMetaLead('demo_form', 50);
  };

  const handleTrial = () => {
    // Track trial start
    analytics.trackMetaTrial('Pro Plan');
  };

  const handleContact = () => {
    // Track contact
    analytics.trackMetaContact('contact_form');
  };

  const handleSubscribe = () => {
    // Track subscription
    analytics.trackMetaSubscribe('Pro Plan', 29.99);
  };

  const handleCustomEvent = () => {
    // Track custom event
    analytics.trackMetaPixelEvent('CustomEvent', {
      event_category: 'engagement',
      event_label: 'demo_button_click',
      value: 10,
      currency: 'USD'
    });
  };

  const handleViewContent = () => {
    // Track content view
    analytics.metaPixelEvents.viewContent({
      content_name: 'Demo Page',
      content_category: 'Marketing',
      value: 0,
      currency: 'USD'
    });
  };

  const handleAddToCart = () => {
    // Track add to cart
    analytics.metaPixelEvents.addToCart(29.99, 'USD', {
      content_name: 'Pro Plan',
      content_category: 'Subscription'
    });
  };

  const handleInitiateCheckout = () => {
    // Track checkout initiation
    analytics.metaPixelEvents.initiateCheckout(29.99, 'USD', {
      content_name: 'Pro Plan',
      content_category: 'Subscription'
    });
  };

  return (
    <div className="space-y-6 p-6 bg-blue-50 rounded-lg">
      <h3 className="text-xl font-semibold text-blue-900">Meta Pixel & Conversions API Examples</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium text-blue-800">User Actions</h4>
          
          <button 
            onClick={handleRegistration}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Complete Registration
          </button>
          
          <button 
            onClick={handleLead}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Generate Lead
          </button>
          
          <button 
            onClick={handleTrial}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Start Trial
          </button>
          
          <button 
            onClick={handleContact}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Contact Us
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-blue-800">Ecommerce Events</h4>
          
          <button 
            onClick={handleAddToCart}
            className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Add to Cart
          </button>
          
          <button 
            onClick={handleInitiateCheckout}
            className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Initiate Checkout
          </button>
          
          <button 
            onClick={handlePurchase}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Complete Purchase
          </button>
          
          <button 
            onClick={handleSubscribe}
            className="w-full px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
          >
            Subscribe
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-blue-800">Content & Custom Events</h4>
          
          <button 
            onClick={handleViewContent}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            View Content
          </button>
          
          <button 
            onClick={handleCustomEvent}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Custom Event
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-blue-800">Conversions API</h4>
          
          <button 
            onClick={() => analytics.trackConversionsAPI('DemoConversion', {
              content_name: 'Demo Conversion',
              content_category: 'Demo',
              value: 25,
              currency: 'USD',
              email: 'demo@example.com'
            })}
            className="w-full px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
          >
            Server-Side Conversion
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Meta Pixel Benefits:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Facebook advertising optimization</li>
          <li>• Lookalike audience creation</li>
          <li>• Conversion tracking and attribution</li>
          <li>• Retargeting campaigns</li>
          <li>• Server-side event tracking</li>
          <li>• Privacy-compliant data collection</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Privacy & Compliance:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Email and phone hashing for privacy</li>
          <li>• GDPR and CCPA compliance ready</li>
          <li>• Server-side event tracking</li>
          <li>• User consent management support</li>
        </ul>
      </div>
    </div>
  );
};
