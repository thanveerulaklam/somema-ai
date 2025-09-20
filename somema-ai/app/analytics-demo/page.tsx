'use client';

import { useAnalyticsContext } from '../../components/analytics/AnalyticsProvider';
import { AnalyticsExample } from '../../components/analytics/AnalyticsExample';
import { GTMExample } from '../../components/analytics/GTMExample';
import { MetaPixelExample } from '../../components/analytics/MetaPixelExample';
import { GoogleAdsExample } from '../../components/analytics/GoogleAdsExample';
import { useState } from 'react';

export default function AnalyticsDemoPage() {
  const analytics = useAnalyticsContext();
  const [demoData, setDemoData] = useState({
    userPlan: 'pro',
    featureUsage: 0,
    conversions: 0
  });

  const handleDemoPurchase = () => {
    // Track purchase with both GA4 and GTM
    analytics.trackPayment(99.99);
    analytics.trackGTMPurchase('DEMO_TXN_001', 99.99, [
      {
        item_id: 'plan_enterprise',
        item_name: 'Enterprise Plan',
        price: 99.99,
        quantity: 1,
        category: 'subscription'
      }
    ]);
    
    setDemoData(prev => ({ ...prev, conversions: prev.conversions + 1 }));
  };

  const handleDemoFeatureUsage = () => {
    // Track feature usage
    analytics.trackFeatureUsage('Demo Feature');
    analytics.trackGTMFeatureUsage('demo_feature', {
      feature_type: 'demo',
      usage_count: demoData.featureUsage + 1,
      user_plan: demoData.userPlan
    });
    
    setDemoData(prev => ({ ...prev, featureUsage: prev.featureUsage + 1 }));
  };

  const handleDemoError = () => {
    // Track error
    analytics.trackErrorOccurred('Demo Error');
    analytics.gtmEvent('demo_error', {
      error_type: 'demo_error',
      error_message: 'This is a demo error for testing',
      page: 'analytics_demo'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analytics & Tag Manager Demo
          </h1>
          <p className="text-xl text-gray-600">
            Test Google Analytics 4 and Google Tag Manager integration
          </p>
        </div>

        {/* Demo Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Plan</h3>
            <p className="text-3xl font-bold text-blue-600">{demoData.userPlan.toUpperCase()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Usage</h3>
            <p className="text-3xl font-bold text-green-600">{demoData.featureUsage}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversions</h3>
            <p className="text-3xl font-bold text-purple-600">{demoData.conversions}</p>
          </div>
        </div>

        {/* Quick Demo Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Demo Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleDemoPurchase}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Simulate Purchase ($99.99)
            </button>
            <button
              onClick={handleDemoFeatureUsage}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Use Demo Feature
            </button>
            <button
              onClick={handleDemoError}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Trigger Demo Error
            </button>
          </div>
        </div>

        {/* Google Analytics 4 Examples */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Analytics 4 Examples</h2>
          <AnalyticsExample />
        </div>

        {/* Google Tag Manager Examples */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Tag Manager Examples</h2>
          <GTMExample />
        </div>

        {/* Meta Pixel Examples */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Meta Pixel & Conversions API Examples</h2>
          <MetaPixelExample />
        </div>

        {/* Google Ads Examples */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Ads Conversion Tracking Examples</h2>
          <GoogleAdsExample />
        </div>

        {/* Setup Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Setup Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Google Analytics 4</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Create GA4 property</li>
                <li>2. Get Measurement ID (G-XXXXXXXXXX)</li>
                <li>3. Set NEXT_PUBLIC_GA_ID environment variable</li>
                <li>4. Check Real-Time reports</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Google Tag Manager</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Create GTM container</li>
                <li>2. Get Container ID (GTM-XXXXXXX)</li>
                <li>3. Set NEXT_PUBLIC_GTM_ID environment variable</li>
                <li>4. Use Preview mode to test</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Meta Pixel</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Create Meta Business account</li>
                <li>2. Get Pixel ID (123456789012345)</li>
                <li>3. Set NEXT_PUBLIC_META_PIXEL_ID</li>
                <li>4. Set META_ACCESS_TOKEN</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Google Ads</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Create Google Ads account</li>
                <li>2. Set up conversion actions</li>
                <li>3. Get Conversion ID and Labels</li>
                <li>4. Set environment variables</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Open browser console to see dataLayer events</p>
            <p>• Use GTM Preview mode to debug tags</p>
            <p>• Check GA4 Real-Time reports for live data</p>
            <p>• Run <code className="bg-gray-200 px-1 rounded">node test-analytics.js</code> to verify setup</p>
          </div>
        </div>
      </div>
    </div>
  );
}
