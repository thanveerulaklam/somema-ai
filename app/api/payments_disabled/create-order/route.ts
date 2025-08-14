import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, currency = 'INR' } = await req.json();

    // Define subscription plans
    const plans = {
      starter: {
        name: 'Starter Plan',
        amount: currency === 'INR' ? 99900 : 1200, // Amount in paise/cents
        currency: currency,
        description: 'Advanced AI content generation, up to 5 social media accounts'
      },
      professional: {
        name: 'Professional Plan',
        amount: currency === 'INR' ? 199900 : 2400,
        currency: currency,
        description: 'Unlimited AI generations, up to 15 social media accounts'
      },
      enterprise: {
        name: 'Enterprise Plan',
        amount: currency === 'INR' ? 499900 : 6000,
        currency: currency,
        description: 'Unlimited everything, dedicated account manager'
      }
    };

    const plan = plans[planId as keyof typeof plans];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `order_${Date.now()}_${userId}`,
      notes: {
        planId: planId,
        userId: userId,
        planName: plan.name
      }
    });

    // Store order details in database
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: userId,
        plan_id: planId,
        amount: plan.amount,
        currency: plan.currency,
        status: 'created',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to store order' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: plan.amount,
      currency: plan.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
} 