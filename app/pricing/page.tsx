'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: {
    INR: number;
    USD: number;
  };
  features: string[];
  popular?: boolean;
  description: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: { INR: 0, USD: 0 },
    description: 'Perfect for getting started',
    features: [
      'Basic content creation',
      'Limited AI generations (5/month)',
      '1 social media account',
      'Basic analytics',
      'Community support'
    ]
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    price: { INR: 999, USD: 12 },
    description: 'Great for small businesses',
    features: [
      'Advanced AI content generation',
      'Up to 5 social media accounts',
      'Priority support',
      'Advanced analytics',
      'Content scheduling',
      'Brand voice customization'
    ]
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    price: { INR: 1999, USD: 24 },
    popular: true,
    description: 'Perfect for growing businesses',
    features: [
      'Unlimited AI generations',
      'Up to 15 social media accounts',
      'Team collaboration',
      'Advanced scheduling',
      'Performance analytics',
      'Priority support',
      'Custom templates'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: { INR: 4999, USD: 60 },
    description: 'For large organizations',
    features: [
      'Unlimited everything',
      'Unlimited social accounts',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'API access',
      '24/7 priority support'
    ]
  }
];

export default function PricingPage() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    setLoading(planId);
    
    try {
      // Get current user
      const { data: { user } } = await fetch('/api/auth/user').then(res => res.json());
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Create payment order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
          currency
        }),
      });

      const { orderId, amount, key } = await response.json();

      if (!orderId) {
        throw new Error('Failed to create order');
      }

      // Initialize Razorpay
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Somema AI',
        description: `Subscription to ${plans.find(p => p.id === planId)?.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const result = await verifyResponse.json();
            
            if (result.success) {
              alert('Payment successful! Your subscription has been activated.');
              router.push('/dashboard');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#3B82F6',
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start with our free plan and upgrade as you grow
          </p>
          
          {/* Currency Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <span className="text-gray-700">Currency:</span>
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === 'INR'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === 'USD'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                USD
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {currency === 'INR' ? '₹' : '$'}{plan.price[currency]}
                  </span>
                  {plan.price[currency] > 0 && (
                    <span className="text-gray-600">/month</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : plan.id === 'free'
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? (
                  'Processing...'
                ) : plan.id === 'free' ? (
                  'Get Started Free'
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All plans include:
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600">All payments are processed securely through Razorpay</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h3>
              <p className="text-gray-600">No long-term contracts. Cancel your subscription anytime</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">30-Day Money Back</h3>
              <p className="text-gray-600">Not satisfied? Get a full refund within 30 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 