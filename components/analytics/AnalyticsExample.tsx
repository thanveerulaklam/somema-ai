'use client';

import { useAnalyticsContext } from './AnalyticsProvider';

// Example component showing how to use analytics
export const AnalyticsExample = () => {
  const analytics = useAnalyticsContext();

  const handleCreatePost = () => {
    // Track post creation
    analytics.trackPostCreated();
    // Your existing post creation logic here
  };

  const handleSchedulePost = () => {
    // Track post scheduling
    analytics.trackPostScheduled();
    // Your existing scheduling logic here
  };

  const handleEnhanceImage = () => {
    // Track image enhancement
    analytics.trackImageEnhanced();
    // Your existing image enhancement logic here
  };

  const handleUpgradePlan = (planName: string) => {
    // Track plan upgrade
    analytics.trackPlanUpgrade(planName);
    // Your existing upgrade logic here
  };

  const handlePayment = (amount: number) => {
    // Track payment
    analytics.trackPayment(amount);
    // Your existing payment logic here
  };

  const handleError = (errorType: string) => {
    // Track errors
    analytics.trackErrorOccurred(errorType);
    // Your existing error handling logic here
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Analytics Integration Examples</h3>
      
      <div className="space-y-2">
        <button 
          onClick={handleCreatePost}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Post (Tracked)
        </button>
        
        <button 
          onClick={handleSchedulePost}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Schedule Post (Tracked)
        </button>
        
        <button 
          onClick={handleEnhanceImage}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Enhance Image (Tracked)
        </button>
        
        <button 
          onClick={() => handleUpgradePlan('Pro')}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Upgrade to Pro (Tracked)
        </button>
        
        <button 
          onClick={() => handlePayment(29.99)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Make Payment (Tracked)
        </button>
        
        <button 
          onClick={() => handleError('API Error')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Simulate Error (Tracked)
        </button>
      </div>
    </div>
  );
};
