// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Subscription creation started');

    const { planId, userId, billingCycle = 'monthly', currency = 'INR', isIndianVisitor = false } = await req.json();

    console.log('📋 Request data:', { planId, userId, billingCycle, currency, isIndianVisitor });

    if (!planId || !userId) {
      console.error('❌ Missing required fields:', { planId, userId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    console.log('✅ Razorpay credentials found');

    const plans = {
      starter: { 
        name: 'Starter Plan', 
        priceINR: { monthly: 999, yearly: 9990 },
        priceUSD: { monthly: 29, yearly: 290 },
        plan_id_monthly: 'plan_starter_monthly', 
        plan_id_yearly: 'plan_starter_yearly' 
      },
      growth: { 
        name: 'Growth Plan', 
        priceINR: { monthly: 2499, yearly: 24990 },
        priceUSD: { monthly: 79, yearly: 790 },
        plan_id_monthly: 'plan_growth_monthly', 
        plan_id_yearly: 'plan_growth_yearly' 
      },
      scale: { 
        name: 'Scale Plan', 
        priceINR: { monthly: 8999, yearly: 89990 },
        priceUSD: { monthly: 199, yearly: 1990 },
        plan_id_monthly: 'plan_scale_monthly', 
        plan_id_yearly: 'plan_scale_yearly' 
      },
    };

    const selectedPlan = plans[planId as keyof typeof plans];
    if (!selectedPlan) {
      console.error('❌ Invalid plan ID:', planId);
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Get the appropriate price based on user location and billing cycle
    const orderAmountInBaseCurrency = isIndianVisitor 
      ? selectedPlan.priceINR[billingCycle as 'monthly' | 'yearly']
      : selectedPlan.priceUSD[billingCycle as 'monthly' | 'yearly'];
    
    const orderAmount = isIndianVisitor 
      ? orderAmountInBaseCurrency * 100 // Convert to paise for INR
      : orderAmountInBaseCurrency * 100; // Convert to cents for USD
    
    let taxAmount = 0;
    let totalAmount = orderAmount;

    // Calculate tax for Indian visitors only
    if (isIndianVisitor) {
      taxAmount = Math.round(orderAmount * 0.18); // 18% GST
      totalAmount = orderAmount + taxAmount;
      console.log('🇮🇳 Indian user detected - GST will be applied');
    } else {
      taxAmount = 0;
      totalAmount = orderAmount;
      console.log('🌍 International user detected - no GST (export of services)');
    }

    console.log('💰 Creating Razorpay subscription with amount:', totalAmount, 'currency:', currency);
    console.log('📊 Tax calculation:', {
      baseAmount: orderAmountInBaseCurrency,
      orderAmount,
      taxAmount,
      totalAmount,
      currency,
      isIndianVisitor
    });

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, business_name')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      console.error('❌ Error fetching user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userData;

    // Create Razorpay subscription
    const subscriptionData = {
      plan_id: `plan_${planId}_${billingCycle}`, // We'll need to create these plans in Razorpay
      customer_notify: true,
      quantity: 1,
      total_count: 12, // Total number of billing cycles (12 months for both monthly and yearly)
      start_at: Math.floor(Date.now() / 1000) + 300, // Start in 5 minutes (increased from 1 minute for test mode)
      expire_by: Math.floor(Date.now() / 1000) + (billingCycle === 'yearly' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60), // 1 year or 1 month
      addons: [],
      notes: {
        plan_id: planId,
        billing_cycle: billingCycle,
        user_id: userId,
        business_name: user.full_name || user.business_name || 'Customer'
      }
    };

    console.log('📋 Creating Razorpay subscription with data:', subscriptionData);

    // Try to use pre-created plan ID, or create one dynamically
    const razorpayPlanId = `plan_${planId}_${billingCycle}`;
    
    console.log('📋 Using plan ID:', razorpayPlanId);

    // First, try to create the subscription with the pre-created plan
    try {
      const subscriptionDataWithPlan = {
        ...subscriptionData,
        plan_id: razorpayPlanId
      };

      const razorpaySubscription = await razorpay.subscriptions.create(subscriptionDataWithPlan);
      console.log('✅ Razorpay subscription created with pre-created plan:', razorpaySubscription.id);
      
      // DO NOT create subscription record yet - wait for payment verification
      // Subscription record will be created in verify-payment or webhook after successful payment
      console.log('📝 Subscription record will be created after payment verification');

      // Update user profile with subscription information (but don't activate or give credits yet)
      // Credits and activation will happen only after payment verification
      const { error: userUpdateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          subscription_plan: planId,
          subscription_status: 'pending',
          razorpay_subscription_id: razorpaySubscription.id,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + (billingCycle === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString(),
          billing_cycle: billingCycle,
          // DO NOT give credits until payment is verified
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (userUpdateError) {
        console.error('❌ Error updating user profile:', userUpdateError);
      }

      console.log('🎉 Subscription creation completed successfully');

      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully',
        subscriptionId: razorpaySubscription.id,
        amount: totalAmount,
        currency: currency,
        billingCycle: billingCycle,
        short_url: razorpaySubscription.short_url,
        redirect_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?subscription=failed`
        }
      });

    } catch (planError: any) {
      // If plan doesn't exist, create it dynamically
      if (planError.error?.code === 'BAD_REQUEST_ERROR' && 
          planError.error?.description?.includes('does not exist')) {
        
        console.log('📋 Plan does not exist, creating it dynamically...');
        
        // Create the plan first
        const planData = {
          period: (billingCycle === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly',
          interval: 1,
          item: {
            name: selectedPlan.name,
            description: `${selectedPlan.name} - ${billingCycle} subscription`,
            amount: totalAmount,
            currency: currency
          },
          notes: {
            plan_id: planId,
            billing_cycle: billingCycle
          }
        };

        try {
          const razorpayPlan = await razorpay.plans.create(planData);
          console.log('✅ Razorpay plan created dynamically:', razorpayPlan.id);
          
          // Now create the subscription with the new plan
          const subscriptionDataWithPlan = {
            ...subscriptionData,
            plan_id: razorpayPlan.id
          };

          const razorpaySubscription = await razorpay.subscriptions.create(subscriptionDataWithPlan);
          console.log('✅ Razorpay subscription created with dynamic plan:', razorpaySubscription.id);
          
          // DO NOT create subscription record yet - wait for payment verification
          // Subscription record will be created in verify-payment or webhook after successful payment
          console.log('📝 Subscription record will be created after payment verification');

          // Update user profile with subscription information (but don't activate or give credits yet)
          // Credits and activation will happen only after payment verification
          const { error: userUpdateError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: userId,
              subscription_plan: planId,
              subscription_status: 'pending', // Don't activate until payment is verified
              razorpay_subscription_id: razorpaySubscription.id,
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: new Date(Date.now() + (billingCycle === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString(),
              billing_cycle: billingCycle,
              // DO NOT give credits until payment is verified
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (userUpdateError) {
            console.error('❌ Error updating user profile:', userUpdateError);
          }

          console.log('🎉 Subscription creation completed successfully with dynamic plan');

          return NextResponse.json({
            success: true,
            message: 'Subscription created successfully',
            subscriptionId: razorpaySubscription.id,
            amount: totalAmount,
            currency: currency,
            billingCycle: billingCycle,
            short_url: razorpaySubscription.short_url,
            redirect_urls: {
              success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-success`,
              failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?subscription=failed`
            }
          });

        } catch (createPlanError: any) {
          console.error('❌ Error creating plan:', createPlanError);
          return NextResponse.json({
            error: 'Failed to create subscription plan',
            details: createPlanError.error?.description || 'Unknown error'
          }, { status: 500 });
        }

      } else {
        // Some other error
        console.error('❌ Unexpected subscription creation error:', planError);
        return NextResponse.json({
          error: 'Failed to create subscription',
          details: planError.error?.description || 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error: any) {
    console.error('❌ Subscription creation error:', error);
    return NextResponse.json({
      error: 'Failed to create subscription',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

function getPlanCredits(planId: string) {
  const planCredits = {
    free: {
      posts: 15,
      enhancements: 3,
      storage: 50, // 50 images only
      allowVideos: false
    },
    starter: {
      posts: 100,
      enhancements: 30,
      storage: -1, // Unlimited images and videos
      allowVideos: true
    },
    growth: {
      posts: 300,
      enhancements: 100,
      storage: -1, // Unlimited images and videos
      allowVideos: true
    },
    scale: {
      posts: 1000,
      enhancements: 500,
      storage: -1, // Unlimited images and videos
      allowVideos: true
    }
  };

  return planCredits[planId as keyof typeof planCredits] || planCredits.free;
}