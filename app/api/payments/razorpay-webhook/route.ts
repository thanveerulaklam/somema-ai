import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { calculateSubscriptionEndDate } from '@/lib/billing-utils';
import Razorpay from 'razorpay';

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
    // Check if webhook secret is available
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error('Razorpay webhook secret not configured');
      return new NextResponse('Webhook secret not configured', { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('No signature found in webhook request');
      return new NextResponse('No signature found', { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event);
    console.log('🔍 Full webhook payload:', JSON.stringify(event, null, 2));
    
    // Log the specific entity data for debugging
    if (event.payload && event.payload.payment && event.payload.payment.entity) {
      console.log('🔍 Payment entity:', JSON.stringify(event.payload.payment.entity, null, 2));
    }
    if (event.payload && event.payload.subscription && event.payload.subscription.entity) {
      console.log('🔍 Subscription entity:', JSON.stringify(event.payload.subscription.entity, null, 2));
    }

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;
      
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      
      case 'subscription.halted':
        await handleSubscriptionHalted(event.payload.subscription.entity);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      
      case 'subscription.completed':
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;
      
      case 'subscription.paused':
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;
      
      case 'subscription.resumed':
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;
      case 'subscription.authenticated':
        await handleSubscriptionAuthenticated(event.payload.subscription.entity);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return new NextResponse('Received', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook processing failed', { status: 500 });
  }
}

async function handlePaymentCaptured(payment: any) {
  console.log('Payment captured:', payment.id);
  
  // Update payment status in database
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'captured',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.id);

  if (error) {
    console.error('Failed to update payment status:', error);
  }

  // Check if this payment is associated with a subscription that needs activation
  // This handles cases where payment verification failed but payment was actually successful
  await handleSubscriptionActivationFromPayment(payment);
}

async function handlePaymentFailed(payment: any) {
  console.log('Payment failed:', payment.id);
  
  // Update payment status in database
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.id);

  if (error) {
    console.error('Failed to update payment status:', error);
  }
}

async function handleOrderPaid(order: any) {
  console.log('Order paid:', order.id);
  
  // Update order status in database
  const { error } = await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('order_id', order.id);

  if (error) {
    console.error('Failed to update order status:', error);
  }
}

async function handlePaymentAuthorized(payment: any) {
  console.log('Payment authorized:', payment.id);
  console.log('🔍 Payment details:', {
    id: payment.id,
    subscription_id: payment.subscription_id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status
  });
  
  // Update payment status in database
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'authorized',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.id);

  if (error) {
    console.error('Failed to update payment status:', error);
  }

  // For subscription payments, also check if we need to activate the subscription
  // Sometimes subscription payments only trigger 'authorized' and not 'captured'
  if (payment.subscription_id) {
    console.log('📋 This is a subscription payment authorization, checking for activation...');
    await handleSubscriptionActivationFromPayment(payment);
  } else {
    console.log('ℹ️ No subscription_id found in payment, trying to find subscription by payment ID...');
    // Try to find subscription by looking up the payment in our database
    await handleSubscriptionActivationByPaymentId(payment.id);
  }
}

async function handleSubscriptionActivated(subscription: any) {
  console.log('Subscription activated:', subscription.id);
  
  // Update subscription status in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }

  // Also activate the user subscription in user_profiles
  console.log('🎯 Activating user subscription from subscription.activated event...');
  await handleSubscriptionActivationFromSubscription(subscription);
}

async function handleSubscriptionCharged(subscription: any) {
  console.log('Subscription charged:', subscription.id);
  
  // Update subscription status and next billing date
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_start_date: new Date().toISOString(),
      current_end_date: calculateSubscriptionEndDate(new Date(), 'monthly'),
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionHalted(subscription: any) {
  console.log('Subscription halted:', subscription.id);
  
  // Update subscription status in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'halted',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  console.log('Subscription cancelled:', subscription.id);
  
  // Update subscription status in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionCompleted(subscription: any) {
  console.log('Subscription completed:', subscription.id);
  
  // Update subscription status in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionPaused(subscription: any) {
  console.log('Subscription paused:', subscription.id);
  
  // Update subscription status in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionResumed(subscription: any) {
  console.log('Subscription resumed:', subscription.id);
  
  // Update subscription status in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionActivationFromPayment(payment: any) {
  console.log('🔍 Checking if payment needs subscription activation:', payment.id);
  console.log('🔍 Payment object keys:', Object.keys(payment));
  console.log('🔍 Payment subscription_id:', payment.subscription_id);
  
  try {
    // For subscription payments, we need to get the subscription details from Razorpay
    if (payment.subscription_id) {
      console.log('📋 This is a subscription payment, getting subscription details...');
      
      // Get subscription details from Razorpay
      const subscription = await razorpay.subscriptions.fetch(payment.subscription_id);
      console.log('📋 Subscription details:', {
        id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        customer_id: subscription.customer_id
      });

      // Extract plan ID from Razorpay plan ID (format: plan_starter_monthly -> starter)
      const planId = subscription.plan_id.replace('plan_', '').replace('_monthly', '').replace('_yearly', '');
      const billingCycle = subscription.plan_id.includes('_yearly') ? 'yearly' : 'monthly';
      
      console.log('📋 Extracted plan details:', { planId, billingCycle });

      // Find user by subscription ID in user_profiles
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, subscription_status')
        .eq('razorpay_subscription_id', payment.subscription_id)
        .single();

      if (userError || !userData) {
        console.log('ℹ️ No user found for subscription:', payment.subscription_id);
        return;
      }

      console.log('📋 Found user for subscription:', {
        userId: userData.user_id,
        currentStatus: userData.subscription_status
      });

      // Check if user is still pending (not activated yet)
      if (userData.subscription_status === 'pending') {
        console.log('🎯 Activating subscription from payment webhook for user:', userData.user_id);
        
        // Get plan credits
        const planCredits = getPlanCredits(planId);
        
        // Update user subscription in user_profiles table
        const { error: updateError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: userData.user_id,
            subscription_plan: planId,
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: calculateSubscriptionEndDate(new Date(), billingCycle),
            billing_cycle: billingCycle,
            post_generation_credits: planCredits.posts,
            image_enhancement_credits: planCredits.enhancements,
            media_storage_limit: planCredits.storage,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (updateError) {
          console.error('❌ Failed to activate user subscription from webhook:', updateError);
          return;
        }

        // Create subscription record if it doesn't exist
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userData.user_id,
            razorpay_subscription_id: payment.subscription_id,
            plan_id: planId,
            status: 'active',
            current_start_date: new Date().toISOString(),
            current_end_date: calculateSubscriptionEndDate(new Date(), billingCycle),
            amount: payment.amount,
            currency: payment.currency,
            billing_cycle: billingCycle,
            updated_at: new Date().toISOString()
          });

        if (subscriptionError) {
          console.error('❌ Failed to create subscription record from webhook:', subscriptionError);
          // Don't fail completely, user subscription is already activated
        }

        console.log('✅ Subscription activated from payment webhook successfully!');
      } else {
        console.log('ℹ️ User subscription already activated:', userData.subscription_status);
      }
    } else {
      // Handle one-time payment orders (existing logic)
      const { data: orderData, error: orderError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('payment_id', payment.id)
        .single();

      if (orderError || !orderData) {
        console.log('ℹ️ No order found for payment:', payment.id);
        return;
      }

      console.log('📋 Found order for payment:', {
        orderId: orderData.order_id,
        planId: orderData.plan_id,
        userId: orderData.user_id,
        status: orderData.status
      });

      // Check if this is a subscription order that hasn't been activated yet
      if (orderData.status === 'paid' && !orderData.plan_id.startsWith('enhancement-') && orderData.plan_id !== 'free') {
        console.log('🎯 Activating subscription from payment webhook for order:', orderData.order_id);
        
        // Get plan credits
        const planCredits = getPlanCredits(orderData.plan_id);
        
        // Update user subscription in user_profiles table
        const { error: userError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: orderData.user_id,
            subscription_plan: orderData.plan_id,
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: calculateSubscriptionEndDate(new Date(), orderData.billing_cycle),
            billing_cycle: orderData.billing_cycle,
            post_generation_credits: planCredits.posts,
            image_enhancement_credits: planCredits.enhancements,
            media_storage_limit: planCredits.storage,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (userError) {
          console.error('❌ Failed to activate user subscription from webhook:', userError);
          return;
        }

        // Create subscription record if it doesn't exist
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: orderData.user_id,
            plan_id: orderData.plan_id,
            status: 'active',
            current_start_date: new Date().toISOString(),
            current_end_date: calculateSubscriptionEndDate(new Date(), orderData.billing_cycle),
            amount: orderData.amount,
            currency: orderData.currency,
            billing_cycle: orderData.billing_cycle,
            updated_at: new Date().toISOString()
          });

        if (subscriptionError) {
          console.error('❌ Failed to create subscription record from webhook:', subscriptionError);
          // Don't fail completely, user subscription is already activated
        }

        console.log('✅ Subscription activated from payment webhook successfully!');
      }
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionActivationFromPayment:', error);
  }
}

async function handleSubscriptionActivationFromSubscription(subscription: any) {
  console.log('🔍 Activating subscription from subscription.activated event:', subscription.id);
  
  try {
    // Extract plan ID from Razorpay plan ID (format: plan_starter_monthly -> starter)
    const planId = subscription.plan_id.replace('plan_', '').replace('_monthly', '').replace('_yearly', '');
    const billingCycle = subscription.plan_id.includes('_yearly') ? 'yearly' : 'monthly';
    
    console.log('📋 Extracted plan details:', { planId, billingCycle });

    // Find user by subscription ID in user_profiles
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, subscription_status')
      .eq('razorpay_subscription_id', subscription.id)
      .single();

    if (userError || !userData) {
      console.log('ℹ️ No user found for subscription:', subscription.id);
      return;
    }

    console.log('📋 Found user for subscription:', {
      userId: userData.user_id,
      currentStatus: userData.subscription_status
    });

    // Check if user is still pending (not activated yet)
    if (userData.subscription_status === 'pending') {
      console.log('🎯 Activating subscription from subscription.activated event for user:', userData.user_id);
      
      // Get plan credits
      const planCredits = getPlanCredits(planId);
      
      // Update user subscription in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userData.user_id,
          subscription_plan: planId,
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: calculateSubscriptionEndDate(new Date(), billingCycle),
          billing_cycle: billingCycle,
          post_generation_credits: planCredits.posts,
          image_enhancement_credits: planCredits.enhancements,
          media_storage_limit: planCredits.storage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('❌ Failed to activate user subscription from subscription.activated:', updateError);
        return;
      }

      // Create subscription record if it doesn't exist
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userData.user_id,
          razorpay_subscription_id: subscription.id,
          plan_id: planId,
          status: 'active',
          current_start_date: new Date().toISOString(),
          current_end_date: calculateSubscriptionEndDate(new Date(), billingCycle),
          amount: subscription.plan_amount,
          currency: subscription.currency,
          billing_cycle: billingCycle,
          updated_at: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error('❌ Failed to create subscription record from subscription.activated:', subscriptionError);
        // Don't fail completely, user subscription is already activated
      }

      console.log('✅ Subscription activated from subscription.activated event successfully!');
    } else {
      console.log('ℹ️ User subscription already activated:', userData.subscription_status);
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionActivationFromSubscription:', error);
  }
}

async function handleSubscriptionActivationByPaymentId(paymentId: string) {
  console.log('🔍 Looking up subscription by payment ID:', paymentId);
  
  try {
    // First, let's see what users have pending subscriptions
    const { data: allPendingUsers, error: allPendingError } = await supabase
      .from('user_profiles')
      .select('user_id, subscription_status, razorpay_subscription_id, subscription_plan, billing_cycle')
      .eq('subscription_status', 'pending');
    
    console.log('📋 All users with pending subscriptions:', allPendingUsers);
    
    // Also check what users have ANY subscription status
    const { data: allUsers, error: allUsersError } = await supabase
      .from('user_profiles')
      .select('user_id, subscription_status, razorpay_subscription_id, subscription_plan, billing_cycle')
      .not('razorpay_subscription_id', 'is', null);
    
    console.log('📋 All users with razorpay_subscription_id:', allUsers);
    
    // Find user by payment ID in user_profiles (where razorpay_subscription_id might be stored)
    // We need to find the user who has a pending subscription
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, subscription_status, razorpay_subscription_id, subscription_plan, billing_cycle')
      .eq('subscription_status', 'pending')
      .not('razorpay_subscription_id', 'is', null)
      .single();

    if (userError || !userData) {
      console.log('ℹ️ No pending subscription found in user_profiles for payment:', paymentId);
      
      // For subscription payments, we need to find the user by looking at recent subscription creations
      // Since this is a subscription payment, let's find the most recent user with a pending subscription
      console.log('🔍 Looking for recent pending subscription users...');
      const { data: recentPendingUsers, error: recentError } = await supabase
        .from('user_profiles')
        .select('user_id, subscription_status, razorpay_subscription_id, subscription_plan, billing_cycle, created_at')
        .eq('subscription_status', 'pending')
        .not('razorpay_subscription_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('📋 Recent pending subscription users:', recentPendingUsers);
      
      if (recentError || !recentPendingUsers || recentPendingUsers.length === 0) {
        console.log('ℹ️ No recent pending subscriptions found');
        return;
      }
      
      // Try to find the subscription that matches this payment
      // We'll check each recent pending subscription to see if it's the one that just got paid
      for (const userData of recentPendingUsers) {
        try {
          console.log(`🔍 Checking subscription ${userData.razorpay_subscription_id} for user ${userData.user_id}`);
          
          // Get subscription details from Razorpay
          const subscription = await razorpay.subscriptions.fetch(userData.razorpay_subscription_id);
          console.log(`📋 Subscription ${userData.razorpay_subscription_id} status:`, subscription.status);
          
          // If this subscription is active, it's likely the one that just got paid
          if (subscription.status === 'active') {
            console.log(`🎯 Found active subscription ${userData.razorpay_subscription_id} for user ${userData.user_id}`);
            await activateSubscriptionFromUserData(userData, userData.razorpay_subscription_id);
            return;
          }
        } catch (error) {
          console.log(`❌ Error checking subscription ${userData.razorpay_subscription_id}:`, error);
          continue;
        }
      }
      
      console.log('ℹ️ No active subscription found for this payment');
      return;
    }
    
    // Original path - user found in user_profiles
    const finalUserData = userData;
    const finalSubscriptionId = userData.razorpay_subscription_id;
    
    if (!finalSubscriptionId) {
      console.log('ℹ️ No razorpay_subscription_id found for user:', finalUserData.user_id);
      return;
    }
    
    // Continue with activation
    await activateSubscriptionFromUserData(finalUserData, finalSubscriptionId);
  } catch (error) {
    console.error('❌ Error in handleSubscriptionActivationByPaymentId:', error);
  }
}

async function activateSubscriptionFromUserData(userData: any, subscriptionId: string) {
  try {
    console.log('📋 Activating subscription for user:', {
      userId: userData.user_id,
      subscriptionId: subscriptionId,
      plan: userData.subscription_plan,
      billingCycle: userData.billing_cycle
    });

    // Get subscription details from Razorpay to verify it's active
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    console.log('📋 Razorpay subscription status:', subscription.status);

    if (subscription.status === 'active') {
      console.log('🎯 Activating subscription from payment authorization for user:', userData.user_id);
      
      // Get plan credits
      const planCredits = getPlanCredits(userData.subscription_plan);
      
      // Update user subscription in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userData.user_id,
          subscription_plan: userData.subscription_plan,
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: calculateSubscriptionEndDate(new Date(), userData.billing_cycle),
          billing_cycle: userData.billing_cycle,
          post_generation_credits: planCredits.posts,
          image_enhancement_credits: planCredits.enhancements,
          media_storage_limit: planCredits.storage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('❌ Failed to activate user subscription from payment ID:', updateError);
        return;
      }

      // Create subscription record if it doesn't exist
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userData.user_id,
          razorpay_subscription_id: subscriptionId,
          plan_id: userData.subscription_plan,
          status: 'active',
          current_start_date: new Date().toISOString(),
          current_end_date: calculateSubscriptionEndDate(new Date(), userData.billing_cycle),
          amount: (subscription as any).plan_amount || 99900, // Fallback to 999 rupees in paise
          currency: (subscription as any).currency || 'INR',
          billing_cycle: userData.billing_cycle,
          updated_at: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error('❌ Failed to create subscription record from payment ID:', subscriptionError);
        // Don't fail completely, user subscription is already activated
      }

      console.log('✅ Subscription activated from payment ID successfully!');
    } else {
      console.log('ℹ️ Subscription not yet active in Razorpay:', subscription.status);
    }
  } catch (error) {
    console.error('❌ Error in activateSubscriptionFromUserData:', error);
  }
}

async function handleSubscriptionAuthenticated(subscription: any) {
  console.log('🔍 Subscription authenticated:', subscription.id);
  console.log('📋 Subscription details:', {
    id: subscription.id,
    status: subscription.status,
    plan_id: subscription.plan_id,
    customer_id: subscription.customer_id
  });
  
  try {
    // Extract plan ID from Razorpay plan ID (format: plan_starter_monthly -> starter)
    const planId = subscription.plan_id.replace('plan_', '').replace('_monthly', '').replace('_yearly', '');
    const billingCycle = subscription.plan_id.includes('_yearly') ? 'yearly' : 'monthly';
    
    console.log('📋 Extracted plan details:', { planId, billingCycle });

    // Find user by subscription ID in user_profiles
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, subscription_status')
      .eq('razorpay_subscription_id', subscription.id)
      .single();

    if (userError || !userData) {
      console.log('ℹ️ No user found for subscription:', subscription.id);
      return;
    }

    console.log('📋 Found user for subscription:', {
      userId: userData.user_id,
      currentStatus: userData.subscription_status
    });

    // Check if user is still pending (not activated yet)
    if (userData.subscription_status === 'pending') {
      console.log('🎯 Activating subscription from subscription.authenticated event for user:', userData.user_id);
      
      // Get plan credits
      const planCredits = getPlanCredits(planId);
      console.log('📊 Plan credits for', planId, ':', planCredits);
      
      // Update user subscription in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userData.user_id,
          subscription_plan: planId,
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: calculateSubscriptionEndDate(new Date(), billingCycle),
          billing_cycle: billingCycle,
          post_generation_credits: planCredits.posts,
          image_enhancement_credits: planCredits.enhancements,
          media_storage_limit: planCredits.storage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('❌ Failed to activate user subscription from subscription.authenticated:', updateError);
        return;
      }

      // Create subscription record if it doesn't exist
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userData.user_id,
          razorpay_subscription_id: subscription.id,
          plan_id: planId,
          status: 'active',
          current_start_date: new Date().toISOString(),
          current_end_date: calculateSubscriptionEndDate(new Date(), billingCycle),
          amount: (subscription as any).plan_amount || 99900, // Fallback to 999 rupees in paise
          currency: (subscription as any).currency || 'INR',
          billing_cycle: billingCycle,
          updated_at: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error('❌ Failed to create subscription record from subscription.authenticated:', subscriptionError);
        // Don't fail completely, user subscription is already activated
      }

      console.log('✅ Subscription activated from subscription.authenticated event successfully!');
    } else {
      console.log('ℹ️ User subscription already activated:', userData.subscription_status);
      console.log('🔍 But checking if we need to update credits anyway...');
      
      // Even if user is already active, let's check if they have the right credits
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('user_profiles')
        .select('subscription_plan, post_generation_credits, image_enhancement_credits')
        .eq('user_id', userData.user_id)
        .single();
      
      if (currentUserError) {
        console.error('❌ Failed to get current user data:', currentUserError);
        return;
      }
      
      console.log('📋 Current user data:', currentUserData);
      
      // Get plan credits
      const planCredits = getPlanCredits(planId);
      console.log('📊 Expected plan credits for', planId, ':', planCredits);
      
      // Check if credits need to be updated
      if (currentUserData.post_generation_credits !== planCredits.posts || 
          currentUserData.image_enhancement_credits !== planCredits.enhancements ||
          currentUserData.subscription_plan !== planId) {
        
        console.log('🎯 Updating user credits and plan name...');
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_plan: planId,
            post_generation_credits: planCredits.posts,
            image_enhancement_credits: planCredits.enhancements,
            media_storage_limit: planCredits.storage,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userData.user_id);

        if (updateError) {
          console.error('❌ Failed to update user credits:', updateError);
        } else {
          console.log('✅ User credits and plan name updated successfully!');
        }
      } else {
        console.log('ℹ️ User already has correct credits and plan name');
      }
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionAuthenticated:', error);
  }
}

// Helper function to get plan credits
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

  return planCredits[planId as keyof typeof planCredits] || {
    posts: 0,
    enhancements: 0,
    storage: 0,
    allowVideos: false
  };
}
