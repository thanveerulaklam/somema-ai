import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event);

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
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
}

async function handleSubscriptionActivated(subscription: any) {
  console.log('Subscription activated:', subscription.id);
  
  // Update user subscription status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

async function handleSubscriptionCharged(subscription: any) {
  console.log('Subscription charged:', subscription.id);
  
  // Handle recurring payment
  const { error } = await supabase
    .from('users')
    .update({
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    .from('users')
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
  
  // Update subscription status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_plan: 'free',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
} 