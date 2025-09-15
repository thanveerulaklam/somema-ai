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
      return new NextResponse('Webhook not configured', { status: 500 });
    }

    // Rate limiting for webhook endpoint
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `webhook_${clientIP}`;
    
    // Simple in-memory rate limiting (in production, use Redis)
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // Max 10 webhook calls per minute per IP
    
    // This is a simplified rate limiter - in production, use a proper rate limiting service
    if (!(global as any).webhookRateLimit) {
      (global as any).webhookRateLimit = new Map();
    }
    
    const requests = (global as any).webhookRateLimit.get(rateLimitKey) || [];
    const validRequests = requests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      console.error('Webhook rate limit exceeded for IP:', clientIP);
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }
    
    validRequests.push(now);
    (global as any).webhookRateLimit.set(rateLimitKey, validRequests);

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    // Validate signature format
    if (!signature || !signature.match(/^[a-f0-9]{64}$/)) {
      console.error('Invalid signature format');
      return new NextResponse('Invalid signature format', { status: 400 });
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.error('Webhook signature verification failed', {
        ip: clientIP,
        signature: signature.substring(0, 10) + '...',
        expected: expectedSignature.substring(0, 10) + '...'
      });
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event);

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

async function handlePaymentAuthorized(payment: any) {
  console.log('Payment authorized:', payment.id);
  
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

async function handleSubscriptionActivated(subscription: any) {
  console.log('Subscription activated:', subscription.id);
  
  // Get subscription details to determine plan
  const { data: subscriptionData, error: subError } = await supabase
    .from('subscriptions')
    .select('plan_id, user_id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (subError || !subscriptionData) {
    console.error('Failed to get subscription details:', subError);
    return;
  }

  // Get plan credits
  const planCredits = getPlanCredits(subscriptionData.plan_id);
  
  // Update user subscription status and quotas in user_profiles table
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: subscriptionData.user_id,
      subscription_status: 'active',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: calculateSubscriptionEndDate(new Date(), 'monthly'),
      post_generation_credits: planCredits.posts,
      image_enhancement_credits: planCredits.enhancements,
      media_storage_limit: planCredits.storage,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionCharged(subscription: any) {
  console.log('Subscription charged:', subscription.id);
  
  // Get subscription details to determine plan
  const { data: subscriptionData, error: subError } = await supabase
    .from('subscriptions')
    .select('plan_id, user_id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (subError || !subscriptionData) {
    console.error('Failed to get subscription details:', subError);
    return;
  }

  // Get plan credits
  const planCredits = getPlanCredits(subscriptionData.plan_id);
  
  // Handle recurring payment and refresh quotas
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_end_date: calculateSubscriptionEndDate(new Date(), 'monthly'),
      post_generation_credits: planCredits.posts,
      image_enhancement_credits: planCredits.enhancements,
      media_storage_limit: planCredits.storage,
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription renewal:', error);
  }
}

async function handleSubscriptionHalted(subscription: any) {
  console.log('Subscription halted:', subscription.id);
  
  // Update subscription status
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'paused',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  console.log('Subscription cancelled:', subscription.id);
  
  // Update subscription status and reset to free plan quotas
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_plan: 'free',
      post_generation_credits: 15,
      image_enhancement_credits: 3,
      media_storage_limit: 50, // 50 images
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
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

  return planCredits[planId as keyof typeof planCredits] || {
    posts: 0,
    enhancements: 0,
    storage: 0,
    allowVideos: false
  };
}

async function handleSubscriptionCompleted(subscription: any) {
  console.log('✅ Subscription completed:', subscription.id);
  
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error updating subscription status:', error);
    } else {
      console.log('✅ Subscription status updated to completed');
    }
  } catch (error) {
    console.error('❌ Error handling subscription completion:', error);
  }
}

async function handleSubscriptionPaused(subscription: any) {
  console.log('⏸️ Subscription paused:', subscription.id);
  
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error updating subscription status:', error);
    } else {
      console.log('✅ Subscription status updated to paused');
    }
  } catch (error) {
    console.error('❌ Error handling subscription pause:', error);
  }
}

async function handleSubscriptionResumed(subscription: any) {
  console.log('▶️ Subscription resumed:', subscription.id);
  
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error updating subscription status:', error);
    } else {
      console.log('✅ Subscription status updated to active');
    }
  } catch (error) {
    console.error('❌ Error handling subscription resume:', error);
  }
}

async function handleSubscriptionActivationFromPayment(payment: any) {
  console.log('🔍 Checking if payment needs subscription activation:', payment.id);
  
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
