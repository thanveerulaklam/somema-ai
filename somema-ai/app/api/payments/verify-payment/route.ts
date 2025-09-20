import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { calculateSubscriptionEndDate } from '@/lib/billing-utils';
import { sendPaymentConfirmationEmail, sendWelcomeEmail } from '@/lib/email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Payment verification request received');
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    console.log('📋 Payment verification data:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature?.substring(0, 20) + '...'
    });

    // Validate input parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing required payment parameters');
      return NextResponse.json({ error: 'Missing required payment parameters' }, { status: 400 });
    }

    // Check if Razorpay credentials are available
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    console.log('✅ Razorpay credentials are configured');

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log('🔐 Signature verification:', {
      expectedSignature: expectedSignature.substring(0, 20) + '...',
      receivedSignature: razorpay_signature.substring(0, 20) + '...',
      match: expectedSignature === razorpay_signature
    });

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Payment signature verification failed', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        expectedSignature: expectedSignature.substring(0, 20) + '...',
        receivedSignature: razorpay_signature.substring(0, 20) + '...',
        body: body
      });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    console.log('✅ Payment signature verified successfully');

    // Additional server-side verification with Razorpay API
    const razorpay = new (require('razorpay'))({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Verify payment with Razorpay API
    let paymentDetails;
    try {
      console.log('🔄 Fetching payment details from Razorpay API...');
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      
      console.log('📊 Payment details from Razorpay:', {
        id: paymentDetails.id,
        status: paymentDetails.status,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        method: paymentDetails.method
      });
      
      // Verify payment status and amount
      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        console.error('❌ Payment not captured or authorized', { 
          status: paymentDetails.status,
          paymentId: razorpay_payment_id
        });
        return NextResponse.json({ 
          error: 'Payment not completed',
          details: `Payment status: ${paymentDetails.status}`
        }, { status: 400 });
      }
      
      console.log('✅ Payment verified with Razorpay API:', {
        paymentId: razorpay_payment_id,
        status: paymentDetails.status,
        amount: paymentDetails.amount
      });
    } catch (apiError: any) {
      console.error('❌ Razorpay API verification failed:', {
        error: apiError.message,
        paymentId: razorpay_payment_id,
        stack: apiError.stack
      });
      return NextResponse.json({ 
        error: 'Payment verification failed',
        details: apiError.message
      }, { status: 400 });
    }

    // Get order details from database
    console.log('🔍 Looking up order in database:', razorpay_order_id);
    const { data: orderData, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .single();

    if (orderError) {
      console.error('❌ Database error while fetching order:', orderError);
      return NextResponse.json({ 
        error: 'Database error',
        details: orderError.message
      }, { status: 500 });
    }

    if (!orderData) {
      console.error('❌ Order not found in database:', razorpay_order_id);
      return NextResponse.json({ 
        error: 'Order not found',
        details: `Order ID: ${razorpay_order_id}`
      }, { status: 404 });
    }

    console.log('✅ Order found in database:', {
      orderId: orderData.order_id,
      planId: orderData.plan_id,
      amount: orderData.amount,
      status: orderData.status
    });

    // Update order status
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        payment_id: razorpay_payment_id,
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id);

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Check if this is a top-up or subscription
    const isTopUp = orderData.plan_id.startsWith('enhancement-');
    
    if (isTopUp) {
      // Handle top-up purchase
      await handleTopUpPurchase(orderData);
    } else if (orderData.plan_id === 'free') {
      // Handle free plan activation
      await handleFreePlanActivation(orderData);
    } else {
      // Handle subscription purchase
      await handleSubscriptionPurchase(orderData);
    }

    // Calculate expected total amount (base amount + tax)
    const expectedTotalAmount = orderData.amount + (orderData.tax_amount || 0);
    
    // Verify payment amount matches expected total amount
    if (paymentDetails.amount !== expectedTotalAmount) {
      console.error('Amount mismatch:', {
        orderBaseAmount: orderData.amount,
        orderTaxAmount: orderData.tax_amount || 0,
        expectedTotalAmount: expectedTotalAmount,
        paymentAmount: paymentDetails.amount
      });
      return NextResponse.json({ 
        error: 'Payment amount mismatch',
        details: `Expected: ${expectedTotalAmount}, Received: ${paymentDetails.amount}`
      }, { status: 400 });
    }

    console.log('✅ Payment amount verification passed:', {
      baseAmount: orderData.amount,
      taxAmount: orderData.tax_amount || 0,
      totalAmount: expectedTotalAmount,
      paymentAmount: paymentDetails.amount
    });

    console.log('📊 Payment details with tax:', {
      amount: paymentDetails.amount,
      tax_amount: paymentDetails.tax_amount,
      total_amount: paymentDetails.amount + (paymentDetails.tax_amount || 0)
    });

    // Store payment record with tax information
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: orderData.user_id,
        plan_id: orderData.plan_id,
        amount: orderData.amount,
        tax_amount: paymentDetails.tax_amount || 0,
        total_amount: paymentDetails.amount + (paymentDetails.tax_amount || 0),
        currency: orderData.currency,
        status: 'captured',
        payment_type: isTopUp ? 'topup' : 'subscription',
        tax_details: paymentDetails.tax_details || {},
        created_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      // Don't fail the request if payment record fails
    }

    // Create invoice only after successful payment (for subscriptions, not top-ups)
    if (!isTopUp && orderData.plan_id !== 'free') {
      try {
        console.log('🧾 Creating invoice after successful payment...');
        await createInvoiceAfterPayment(orderData, paymentDetails);
      } catch (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        // Don't fail the payment if invoice creation fails
      }
    }

    // Send email notifications
    try {
      console.log('📧 Sending email notifications...');
      
      // Get user details for email
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(orderData.user_id);
      
      if (!authUserError && authUser.user) {
        const user = authUser.user;
        const userEmail = user.email || '';
        const userName = user.user_metadata?.full_name || user.user_metadata?.business_name || userEmail.split('@')[0];
        
        // Get plan name
        const planNames = {
          starter: 'Starter',
          growth: 'Growth', 
          scale: 'Scale',
          free: 'Free'
        };
        const planName = planNames[orderData.plan_id as keyof typeof planNames] || orderData.plan_id;
        
        // Send payment confirmation email
        await sendPaymentConfirmationEmail({
          userEmail,
          userName,
          planName: `${planName} Plan`,
          amount: paymentDetails.amount,
          currency: orderData.currency,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          billingCycle: orderData.billing_cycle,
          isIndianVisitor: orderData.currency === 'INR'
        });
        
        // Send welcome email for new subscriptions (not top-ups)
        if (!isTopUp && orderData.plan_id !== 'free') {
          const planCredits = getPlanCredits(orderData.plan_id);
          await sendWelcomeEmail({
            userEmail,
            userName,
            planName: `${planName} Plan`,
            credits: {
              posts: planCredits.posts,
              enhancements: planCredits.enhancements
            }
          });
        }
        
        console.log('✅ Email notifications sent successfully');
      } else {
        console.error('❌ Failed to get user details for email:', authUserError);
      }
    } catch (emailError) {
      console.error('❌ Email notification error:', emailError);
      // Don't fail the payment if email sending fails
    }

    console.log('🎉 Payment verification completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: isTopUp ? 'Top-up purchase successful!' : 'Payment verified and subscription activated',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      planId: orderData.plan_id,
      amount: paymentDetails.amount
    });

  } catch (error: any) {
    console.error('❌ Payment verification error:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: 'Payment verification failed',
      details: error.message
    }, { status: 500 });
  }
}

async function handleSubscriptionPurchase(orderData: any) {
  // Get plan credits based on plan ID
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
    console.error('User subscription update error:', userError);
    throw new Error('Failed to update user subscription');
  }

  // Create subscription record
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
    console.error('Subscription record error:', subscriptionError);
    // Don't fail the request if subscription record fails
  }
}

async function handleTopUpPurchase(orderData: any) {
  // Get current user credits from user_profiles table
  const { data: userData, error: userFetchError } = await supabase
    .from('user_profiles')
    .select('image_enhancement_credits')
    .eq('user_id', orderData.user_id)
    .single();

  if (userFetchError) {
    console.error('User fetch error:', userFetchError);
    throw new Error('Failed to fetch user data');
  }

  // Calculate new credits based on top-up
  let additionalCredits = 0;
  switch (orderData.plan_id) {
    case 'enhancement-25':
      additionalCredits = 25;
      break;
    case 'enhancement-100':
      additionalCredits = 100;
      break;
    case 'enhancement-250':
      additionalCredits = 250;
      break;
    default:
      throw new Error('Invalid top-up plan');
  }

  const currentCredits = userData?.image_enhancement_credits || 0;
  const newCredits = currentCredits + additionalCredits;

  // Update user credits in user_profiles table
  const { error: userUpdateError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: orderData.user_id,
      image_enhancement_credits: newCredits,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (userUpdateError) {
    console.error('User credits update error:', userUpdateError);
    throw new Error('Failed to update user credits');
  }

  // Store top-up record
  const { error: topUpError } = await supabase
    .from('top_ups')
    .insert({
      user_id: orderData.user_id,
      top_up_type: orderData.plan_id,
      credits_added: additionalCredits,
      amount: orderData.amount,
      currency: orderData.currency,
      status: 'captured',
      created_at: new Date().toISOString()
    });

  if (topUpError) {
    console.error('Top-up record error:', topUpError);
    // Don't fail the request if top-up record fails
  }
}

function getPlanCredits(planId: string) {
  const planCredits = {
    free: {
      posts: 15,
      enhancements: 3,
      storage: 50 // 50 images
    },
    starter: {
      posts: 100,
      enhancements: 30,
      storage: 500000000 // 500MB
    },
    growth: {
      posts: 300,
      enhancements: 100,
      storage: -1 // Unlimited
    },
    scale: {
      posts: 1000,
      enhancements: 500,
      storage: -1 // Unlimited
    }
  };

  return planCredits[planId as keyof typeof planCredits] || {
    posts: 0,
    enhancements: 0,
    storage: 0
  };
}

async function handleFreePlanActivation(orderData: any) {
  // Update user to free plan in user_profiles table
  const { error: userError } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: orderData.user_id,
      subscription_plan: 'free',
      subscription_status: 'active',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      post_generation_credits: 15,
      image_enhancement_credits: 3,
      media_storage_limit: 50000000, // 50MB (50 images)
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (userError) {
    console.error('User free plan update error:', userError);
    throw new Error('Failed to activate free plan');
  }

  // Create subscription record for free plan
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: orderData.user_id,
      plan_id: 'free',
      status: 'active',
      current_start_date: new Date().toISOString(),
      current_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 0,
      currency: 'USD',
      billing_cycle: 'monthly',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (subscriptionError) {
    console.error('Free plan subscription record error:', subscriptionError);
    // Don't fail the request if subscription record fails
  }
}

async function createInvoiceAfterPayment(orderData: any, paymentDetails: any) {
  try {
    // Get user details for invoice
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(orderData.user_id);
    
    if (authUserError || !authUser.user) {
      throw new Error('User not found for invoice creation');
    }

    const user = authUser.user;
    
    // Get user profile for business details
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('business_name, business_type, gst_number, address')
      .eq('user_id', orderData.user_id)
      .single();

    // Define plan details
    const plans = {
      starter: { 
        name: 'Starter Plan', 
        priceINR: { monthly: 999, yearly: 9990 },
        priceUSD: { monthly: 29, yearly: 290 }
      },
      growth: { 
        name: 'Growth Plan', 
        priceINR: { monthly: 2499, yearly: 24990 },
        priceUSD: { monthly: 79, yearly: 790 }
      },
      scale: { 
        name: 'Scale Plan', 
        priceINR: { monthly: 8999, yearly: 89990 },
        priceUSD: { monthly: 199, yearly: 1990 }
      }
    };

    const plan = plans[orderData.plan_id as keyof typeof plans];
    if (!plan) {
      throw new Error('Invalid plan for invoice creation');
    }

    // Calculate amounts
    const isIndianVisitor = orderData.currency === 'INR';
    const baseAmount = isIndianVisitor 
      ? plan.priceINR[orderData.billing_cycle as 'monthly' | 'yearly']
      : plan.priceUSD[orderData.billing_cycle as 'monthly' | 'yearly'];
    const taxAmount = isIndianVisitor ? Math.round(baseAmount * 0.18) : 0; // 18% GST for India
    const totalAmount = baseAmount + taxAmount;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create customer details for Razorpay invoice
    const customerDetails = {
      name: userProfile?.business_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
      email: user.email || '',
      contact: user.phone || '',
      gstin: userProfile?.gst_number || '',
      billing_address: userProfile?.address ? {
        line1: userProfile.address,
        city: 'City',
        state: 'State',
        country: isIndianVisitor ? 'IN' : 'US',
        zipcode: '000000'
      } : undefined
    };

    // Create line items
    const lineItems = [{
      name: `${plan.name} - ${orderData.billing_cycle} subscription`,
      description: `Subscription for ${plan.name} (${orderData.billing_cycle})`,
      amount: baseAmount,
      currency: orderData.currency,
      quantity: 1
    }];

    // Add tax line item if applicable
    if (taxAmount > 0) {
      lineItems.push({
        name: 'GST (18%)',
        description: 'Goods and Services Tax',
        amount: taxAmount,
        currency: orderData.currency,
        quantity: 1
      });
    }

    // Create Razorpay Invoice
    const invoiceData = {
      type: 'invoice' as const,
      description: `Subscription for ${plan.name}`,
      partial_payment: false,
      customer: customerDetails,
      line_items: lineItems,
      currency: orderData.currency,
      receipt: invoiceNumber,
      notes: {
        plan_id: orderData.plan_id,
        billing_cycle: orderData.billing_cycle,
        payment_id: paymentDetails.id,
        order_id: orderData.order_id,
        gst_applied: taxAmount > 0 ? 'true' : 'false',
        user_id: orderData.user_id,
        business_name: userProfile?.business_name || user.user_metadata?.full_name
      }
    };

    console.log('📋 Creating Razorpay invoice with data:', invoiceData);

    const razorpay = new (require('razorpay'))({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayInvoice = await razorpay.invoices.create(invoiceData);

    // Save invoice to database with 'paid' status since payment is already completed
    const { error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_id: razorpayInvoice.id,
        invoice_number: invoiceNumber,
        user_id: orderData.user_id,
        plan_id: orderData.plan_id,
        billing_cycle: orderData.billing_cycle,
        amount: baseAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: orderData.currency,
        status: 'paid', // Already paid since this is called after payment verification
        payment_id: paymentDetails.id,
        order_id: orderData.order_id,
        customer_details: customerDetails,
        line_items: lineItems,
        razorpay_invoice_data: razorpayInvoice,
        created_at: new Date().toISOString(),
        paid_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Invoice database insert error:', insertError);
      throw new Error('Failed to save invoice to database');
    }

    console.log('✅ Invoice created successfully:', razorpayInvoice.id);
    return razorpayInvoice;

  } catch (error) {
    console.error('Invoice creation error:', error);
    throw error;
  }
}
