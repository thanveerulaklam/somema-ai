import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Get order details from database
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        payment_id: razorpay_payment_id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id);

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Update user subscription
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_plan: orderData.plan_id,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString()
      })
      .eq('id', orderData.user_id);

    if (userError) {
      console.error('User update error:', userError);
      return NextResponse.json({ error: 'Failed to update user subscription' }, { status: 500 });
    }

    // Store payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: orderData.user_id,
        plan_id: orderData.plan_id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'success',
        created_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      // Don't fail the request if payment record fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
} 