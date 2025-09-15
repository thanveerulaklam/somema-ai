'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  priceINR: {
    monthly: number;
    yearly: number;
  };
  priceUSD: {
    monthly: number;
    yearly: number;
  };
  priceEUR: {
    monthly: number;
    yearly: number;
  };
  priceGBP: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  popular?: boolean;
  description: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: { monthly: 0, yearly: 0 },
    priceINR: { monthly: 0, yearly: 0 },
    priceUSD: { monthly: 0, yearly: 0 },
    priceEUR: { monthly: 0, yearly: 0 },
    priceGBP: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started',
    features: [
      '15 post generations',
      '3 AI image enhancements (cannot be downloaded)',
      '50 images stored (no videos)',
      'Unlimited posting & scheduling',
      'Unlimited Meta (Instagram & Facebook) accounts'
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 12, yearly: 120 }, // Old conversion price (kept for backward compatibility)
    priceINR: { monthly: 999, yearly: 9990 },
    priceUSD: { monthly: 29, yearly: 290 }, // New international pricing
    priceEUR: { monthly: 11, yearly: 110 },
    priceGBP: { monthly: 10, yearly: 100 },
    description: 'Perfect for small businesses and creators',
    features: [
      '100 post generations',
      '30 AI image enhancements (downloadable)',
      'Unlimited images and videos stored',
      'Unlimited posting & scheduling',
      'Unlimited Meta (Instagram & Facebook) accounts'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    price: { monthly: 30, yearly: 300 }, // Old conversion price (kept for backward compatibility)
    priceINR: { monthly: 2499, yearly: 24990 },
    priceUSD: { monthly: 79, yearly: 790 }, // New international pricing
    priceEUR: { monthly: 28, yearly: 280 },
    priceGBP: { monthly: 25, yearly: 250 },
    description: 'Ideal for growing businesses',
    features: [
      '300 post generations',
      '100 AI image enhancements (downloadable)',
      'Unlimited images and videos stored',
      'Unlimited posting & scheduling',
      'Unlimited Meta (Instagram & Facebook) accounts'
    ],
    popular: true
  },
  {
    id: 'scale',
    name: 'Scale',
    price: { monthly: 108, yearly: 1080 }, // Old conversion price (kept for backward compatibility)
    priceINR: { monthly: 8999, yearly: 89990 },
    priceUSD: { monthly: 199, yearly: 1990 }, // New international pricing
    priceEUR: { monthly: 100, yearly: 1000 },
    priceGBP: { monthly: 90, yearly: 900 },
    description: 'For large teams and agencies',
    features: [
      '1000 post generations',
      '500 AI image enhancements (downloadable)',
      'Unlimited images and videos stored',
      'Unlimited posting & scheduling',
      'Unlimited Meta (Instagram & Facebook) accounts'
    ]
  }
];

const topUps = [
  { id: 'enhancement-25', name: '+25 image enhancements', price: 12, priceINR: 999, priceUSD: 19, priceEUR: 11, priceGBP: 10 },
  { id: 'enhancement-100', name: '+100 image enhancements', price: 40, priceINR: 3299, priceUSD: 59, priceEUR: 37, priceGBP: 33 },
  { id: 'enhancement-250', name: '+250 image enhancements', price: 80, priceINR: 6599, priceUSD: 129, priceEUR: 74, priceGBP: 66 }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [isIndianVisitor, setIsIndianVisitor] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>('USD');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
    // Detect visitor location and set appropriate currency
    const detectVisitorLocation = async () => {
      try {
        console.log('🌍 Detecting visitor location...');
        
        // Try multiple IP detection services for better reliability
        let countryCode = null;
        
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          countryCode = data.country_code;
          console.log('📍 IP detection result:', data);
        } catch (error) {
          console.log('❌ ipapi.co failed, trying alternative...');
          
          try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            countryCode = data.country;
            console.log('📍 Alternative IP detection result:', data);
          } catch (error2) {
            console.log('❌ ipinfo.io also failed, using fallback...');
          }
        }
        
        // Fallback: Check browser language and timezone
        if (!countryCode) {
          const browserLang = navigator.language || navigator.languages[0];
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          console.log('🌐 Browser language:', browserLang);
          console.log('🕐 Timezone:', timezone);
          
          if (browserLang.includes('hi') || timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta')) {
            countryCode = 'IN';
          } else if (browserLang.includes('en-GB') || timezone.includes('Europe/London')) {
            countryCode = 'GB';
          } else if (browserLang.includes('de') || browserLang.includes('fr') || browserLang.includes('es') || browserLang.includes('it')) {
            countryCode = 'DE'; // Default to EUR region
          }
        }
        
        console.log('🏁 Final country code:', countryCode);
        
        switch (countryCode) {
          case 'IN':
            console.log('🇮🇳 Indian visitor detected - setting INR');
            setIsIndianVisitor(true);
            setCurrency('INR');
            break;
          case 'GB':
            console.log('🇬🇧 UK visitor detected - setting GBP');
            setCurrency('GBP');
            break;
          case 'DE':
          case 'FR':
          case 'IT':
          case 'ES':
          case 'NL':
          case 'BE':
          case 'AT':
          case 'IE':
            console.log('🇪🇺 EU visitor detected - setting EUR');
            setCurrency('EUR');
            break;
          default:
            console.log('🇺🇸 Default visitor - setting USD');
            setCurrency('USD');
        }
      } catch (error) {
        console.log('❌ Could not detect location, defaulting to USD:', error);
        setCurrency('USD');
      }
    };

    detectVisitorLocation();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    } catch (error) {
      console.log('Auth check failed:', error);
      setIsLoggedIn(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBackClick = () => {
    if (isLoggedIn) {
      router.push('/settings');
    } else {
      router.push('/');
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      setLoading(planId);
      try {
        // Get current user from Supabase client
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('User not authenticated, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Activating free plan for user:', user.id);

        // Activate free plan directly
        const response = await fetch('/api/payments/activate-free-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id
          }),
        });

        const responseData = await response.json();
        console.log('Free plan activation response:', responseData);

        if (responseData.success) {
          alert('Free plan activated successfully!');
          router.push('/settings?message=Free plan activated successfully!');
        } else {
          throw new Error(responseData.error || 'Failed to activate free plan');
        }
      } catch (error) {
        console.error('Free plan activation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to activate free plan. Please try again.';
        alert(`Error: ${errorMessage}`);
      } finally {
        setLoading(null);
      }
      return;
    }

    // Check if user is returning from successful payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      // Redirect to dashboard with success message
      router.push('/dashboard?subscription=success');
      return;
    }

    // For paid plans, create Razorpay order directly (not invoice)
    setLoading(planId);
    try {
      console.log('🔍 Checking authentication for paid plan...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      const currentUser = user || session?.user;
      
      if (!currentUser) {
        console.log('🚪 User not authenticated, redirecting to login');
        alert('Please log in to continue with subscription');
        router.push('/login');
        return;
      }

      console.log('✅ User authenticated, creating payment order...');
      
      // Create Razorpay subscription
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          planId,
          userId: currentUser.id,
          billingCycle,
          currency: currency,
          isIndianVisitor: isIndianVisitor
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const { subscriptionId, amount, short_url } = await response.json();
      console.log('✅ Subscription created:', subscriptionId);

      // Check if Razorpay is loaded
      console.log('🔍 Checking Razorpay availability...');
      console.log('Window object:', typeof window);
      console.log('Razorpay object:', typeof (window as any).Razorpay);
      console.log('Available window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('razor')));
      
      if (typeof (window as any).Razorpay === 'undefined') {
        console.error('❌ Razorpay is not loaded');
        console.log('Available scripts:', Array.from(document.scripts).map(s => s.src));
        throw new Error('Razorpay is not loaded. Please refresh the page and try again.');
      }
      
      console.log('✅ Razorpay is loaded successfully');

      // For subscriptions, redirect to Razorpay payment page
      if (short_url) {
        console.log('🔄 Redirecting to Razorpay subscription payment page...');
        console.log('🔗 Subscription URL:', short_url);
        
        // Show a message to the user
        alert('You will be redirected to Razorpay to complete your subscription. After payment, please return to this page to see your updated subscription status.');
        
        // Redirect to Razorpay subscription page
        window.location.href = short_url;
        return;
      }

      // Fallback to checkout (for one-time payments)
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_RAfGBRNWfinpD9',
        amount: amount,
        currency: currency,
        name: 'Quely AI',
        description: `Subscription for ${planId} plan`,
        subscription_id: subscriptionId,
        handler: async function (response: any) {
          console.log('💳 Subscription payment successful:', response);
          
          // For subscriptions, we don't need to verify payment here
          // The webhook will handle the subscription activation
          alert('Payment successful! Your subscription is now active.');
          router.push('/dashboard');
        },
        prefill: {
          name: currentUser.user_metadata?.full_name || '',
          email: currentUser.email || '',
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
          }
        }
      };

      console.log('🔑 Razorpay Key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_RAfGBRNWfinpD9');
      console.log('💰 Payment Options:', options);

      // Check if Razorpay key is available
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_RAfGBRNWfinpD9';
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured. Please contact support.');
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('❌ Error processing subscription:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to process subscription'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleTopUp = async (topUpId: string, price: number, priceINR: number, priceUSD: number, priceEUR?: number, priceGBP?: number) => {
    setLoading(topUpId);
    
    try {
      // Get current user from Supabase client
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('User authenticated for top-up:', user.id);

      let amount: number;
      switch (currency) {
        case 'INR':
          amount = priceINR;
          break;
        case 'USD':
          amount = priceUSD * 100; // Convert USD to cents
          break;
        case 'EUR':
          amount = (priceEUR || price) * 100; // Convert to cents
          break;
        case 'GBP':
          amount = (priceGBP || price) * 100; // Convert to pence
          break;
        default:
          amount = price * 100; // Convert USD to cents
      }

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: topUpId,
          userId: user.id,
          billingCycle: 'one-time',
          currency: currency,
          amount: amount,
          isIndianVisitor: isIndianVisitor // Pass location info to backend
        }),
      });

      const responseData = await response.json();
      const { orderId, key, totalAmount, taxAmount, amount: baseAmount } = responseData;

      if (!orderId) {
        throw new Error('Failed to create order');
      }

      const options = {
        key: key,
        amount: totalAmount, // Use total amount including tax
        currency: currency,
        name: 'Quely.ai',
        description: `Top-up: ${topUps.find(t => t.id === topUpId)?.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
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
              alert('Top-up purchase successful!');
              router.push('/settings?message=Top-up credits added successfully!');
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
      console.error('Top-up error:', error);
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

  const formatPrice = (price: number) => {
    switch (currency) {
      case 'INR':
        return `₹${price.toLocaleString('en-IN')}`;
      case 'EUR':
        return `€${price}`;
      case 'GBP':
        return `£${price}`;
      default:
        return `$${price}`;
    }
  };


  const getYearlySavings = (plan: Plan) => {
    let monthlyTotal: number;
    let yearlyPrice: number;
    
    switch (currency) {
      case 'INR':
        monthlyTotal = plan.priceINR.monthly * 12;
        yearlyPrice = plan.priceINR.yearly;
        break;
      case 'EUR':
        monthlyTotal = plan.priceEUR.monthly * 12;
        yearlyPrice = plan.priceEUR.yearly;
        break;
      case 'GBP':
        monthlyTotal = plan.priceGBP.monthly * 12;
        yearlyPrice = plan.priceGBP.yearly;
        break;
      case 'USD':
        monthlyTotal = plan.priceUSD.monthly * 12;
        yearlyPrice = plan.priceUSD.yearly;
        break;
      default:
        monthlyTotal = plan.price.monthly * 12;
        yearlyPrice = plan.price.yearly;
    }
    
    return monthlyTotal - yearlyPrice;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={handleBackClick}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {isLoggedIn ? 'Settings' : 'Home'}
              </Button>
            </div>
            
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">Q</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Quely.ai Pricing
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Start with our Starter plan and scale as you grow
            </p>
          </div>

          {/* Currency Selector */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <span className="text-gray-700">Currency:</span>
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => {
                  setCurrency('USD');
                  setIsIndianVisitor(false);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === 'USD'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => {
                  setCurrency('INR');
                  setIsIndianVisitor(true);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === 'INR'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                INR
              </button>
              <button
                onClick={() => {
                  setCurrency('EUR');
                  setIsIndianVisitor(false);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === 'EUR'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                EUR
              </button>
              <button
                onClick={() => {
                  setCurrency('GBP');
                  setIsIndianVisitor(false);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === 'GBP'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                GBP
              </button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="text-center mb-4 text-sm text-gray-500">
            Current: {currency} | Indian Visitor: {isIndianVisitor ? 'Yes' : 'No'}
          </div>
          
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <span className="text-gray-700">Billing:</span>
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Save
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 max-w-6xl mx-auto">
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
                    {formatPrice(
                      currency === 'INR' ? plan.priceINR[billingCycle] :
                      currency === 'EUR' ? plan.priceEUR[billingCycle] :
                      currency === 'GBP' ? plan.priceGBP[billingCycle] :
                      currency === 'USD' ? plan.priceUSD[billingCycle] :
                      plan.price[billingCycle]
                    )}
                  </span>
                  <span className="text-gray-600">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                
                {billingCycle === 'yearly' && (
                  currency === 'INR' ? plan.priceINR[billingCycle] > 0 :
                  currency === 'EUR' ? plan.priceEUR[billingCycle] > 0 :
                  currency === 'GBP' ? plan.priceGBP[billingCycle] > 0 :
                  currency === 'USD' ? plan.priceUSD[billingCycle] > 0 :
                  plan.price[billingCycle] > 0
                ) && (
                  <p className="text-sm text-green-600 font-medium">
                    Save {formatPrice(getYearlySavings(plan))} per year
                  </p>
                )}
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
                  plan.id === 'free'
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    : plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? (
                  'Processing...'
                ) : plan.id === 'free' ? (
                  'Get Started Free'
                ) : (
                  `Subscribe ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Top-ups Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Top-ups (One-time Add-ons)
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Need more image enhancements? Purchase additional credits anytime.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {topUps.map((topUp) => (
              <div key={topUp.id} className="border rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{topUp.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">
                  {formatPrice(
                    currency === 'INR' ? topUp.priceINR :
                    currency === 'EUR' ? topUp.priceEUR :
                    currency === 'GBP' ? topUp.priceGBP :
                    currency === 'USD' ? topUp.priceUSD :
                    topUp.price
                  )}
                </p>
                                  <button
                    onClick={() => handleTopUp(topUp.id, topUp.price, topUp.priceINR, topUp.priceUSD, topUp.priceEUR, topUp.priceGBP)}
                    disabled={loading === topUp.id}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {loading === topUp.id ? 'Processing...' : 'Purchase'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All plans include:
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
}
