'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Smartphone, CreditCard, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';

function UPISetupContent() {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');
  const [authUrl, setAuthUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);

    // Get subscription details from URL params
    const subId = searchParams.get('subscription_id');
    const plan = searchParams.get('plan');
    const amt = searchParams.get('amount');
    const curr = searchParams.get('currency');
    const auth = searchParams.get('auth_url');

    if (subId) {
      setSubscriptionId(subId);
      setPlanName(plan || 'Your Plan');
      setAmount(parseInt(amt || '0') / 100); // Convert from paise to rupees
      setCurrency(curr || 'INR');
      setAuthUrl(auth || '');
    }

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [searchParams]);

  const handleOpenUPIApp = () => {
    console.log('🔍 UPI App button clicked:', {
      authUrl,
      subscriptionId,
      hasAuthUrl: !!authUrl
    });
    
    if (subscriptionId) {
      // Use Razorpay Checkout for UPI AutoPay mandate authorization
      console.log('✅ Opening Razorpay Checkout for UPI AutoPay authorization...');
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "Quely.ai",
        description: `${planName} Plan - UPI AutoPay Setup`,
        handler: function (response: any) {
          console.log("✅ UPI AutoPay mandate approved:", response);
          // Redirect to dashboard with success message
          window.location.href = '/dashboard?subscription=active&method=upi-autopay';
        },
        method: {
          upi: true,   // Enable UPI AutoPay
          card: false, // Disable card for UPI AutoPay flow
        },
        theme: { 
          color: "#0f172a" 
        },
        modal: {
          ondismiss: function() {
            console.log("❌ UPI AutoPay setup cancelled");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      console.error('❌ No subscription ID available');
      alert('Subscription ID not found. Please try again.');
    }
  };

  const handleCompleteLater = () => {
    router.push('/dashboard');
  };

  const handleBackToPricing = () => {
    router.push('/pricing');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={handleBackToPricing}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">UPI AutoPay Setup</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-green-900">Subscription Created Successfully!</h2>
              <p className="text-green-700 mt-1">
                Your {planName} subscription has been created. Now complete the UPI AutoPay setup to activate it.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Plan:</span>
              <p className="font-medium text-gray-900">{planName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Amount:</span>
              <p className="font-medium text-gray-900">₹{amount} {currency}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Payment Method:</span>
              <p className="font-medium text-gray-900">UPI AutoPay</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="font-medium text-orange-600">Pending Setup</p>
            </div>
          </div>
        </div>

        {/* UPI AutoPay Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Smartphone className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Complete UPI AutoPay Setup</h3>
              <p className="text-blue-700 mb-4">
                To activate your subscription, you need to authorize the UPI AutoPay mandate in your UPI app.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <p className="text-blue-700">Click "Authorize UPI AutoPay" below to open Razorpay Checkout</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <p className="text-blue-700">Select your UPI app and authorize the mandate for {currency} {amount.toFixed(2)}</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <p className="text-blue-700">Your subscription will be activated automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleOpenUPIApp}
            disabled={loading || !subscriptionId}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            {loading ? 'Opening...' : 'Authorize UPI AutoPay'}
          </Button>
          
          <Button
            onClick={handleCompleteLater}
            variant="outline"
            className="flex-1 py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Complete Setup Later
          </Button>
        </div>

        {/* UPI AutoPay Benefits */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Why UPI AutoPay?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">No credit card required</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">99% payment success rate</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Manage in your UPI app</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Pause or cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Need help with UPI AutoPay setup?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="ghost"
              onClick={() => window.open('https://razorpay.com/support/', '_blank')}
              className="text-blue-600 hover:text-blue-700"
            >
              Contact Razorpay Support
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.open('https://razorpay.com/docs/payments/upi/autopay/', '_blank')}
              className="text-blue-600 hover:text-blue-700"
            >
              UPI AutoPay Guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UPISetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <UPISetupContent />
    </Suspense>
  );
}
