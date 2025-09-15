import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Payment order creation started');
    
    const { planId, userId, billingCycle = 'monthly', currency = 'USD', amount, isIndianVisitor = false } = await req.json();
    
    console.log('📋 Request data:', { planId, userId, billingCycle, currency, amount, isIndianVisitor });
    
    // Validate required fields
    if (!planId || !userId) {
      console.error('❌ Missing required fields:', { planId, userId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Define subscription plans with multi-currency pricing
    const plans = {
      free: {
        name: 'Free Plan',
        monthly: 0,
        yearly: 0,
        monthlyINR: 0,
        yearlyINR: 0,
        monthlyEUR: 0,
        yearlyEUR: 0,
        monthlyGBP: 0,
        yearlyGBP: 0,
        description: '15 post generations, 3 AI image enhancements (cannot be downloaded), 50 images stored'
      },
      starter: {
        name: 'Starter Plan',
        monthly: 1200, // $12.00 in cents
        yearly: 12000, // $120.00 in cents
        monthlyINR: 99900, // ₹999 in paise
        yearlyINR: 999000, // ₹9,990 in paise
        monthlyEUR: 1100, // €11.00 in cents
        yearlyEUR: 11000, // €110.00 in cents
        monthlyGBP: 1000, // £10.00 in pence
        yearlyGBP: 10000, // £100.00 in pence
        description: '100 post generations, 30 AI image enhancements (downloadable), 500 image/video stored'
      },
      growth: {
        name: 'Growth Plan',
        monthly: 3000, // $30.00 in cents
        yearly: 30000, // $300.00 in cents
        monthlyINR: 249900, // ₹2,499 in paise
        yearlyINR: 2499000, // ₹24,990 in paise
        monthlyEUR: 2800, // €28.00 in cents
        yearlyEUR: 28000, // €280.00 in cents
        monthlyGBP: 2500, // £25.00 in pence
        yearlyGBP: 25000, // £250.00 in pence
        description: '300 post generations, 100 AI image enhancements (downloadable), Unlimited image/video stored'
      },
      scale: {
        name: 'Scale Plan',
        monthly: 10800, // $108.00 in cents
        yearly: 108000, // $1,080.00 in cents
        monthlyINR: 899900, // ₹8,999 in paise
        yearlyINR: 8999000, // ₹89,990 in paise
        monthlyEUR: 10000, // €100.00 in cents
        yearlyEUR: 100000, // €1,000.00 in cents
        monthlyGBP: 9000, // £90.00 in pence
        yearlyGBP: 90000, // £900.00 in pence
        description: '1000 post generations, 500 AI image enhancements (downloadable), Unlimited image/video stored'
      }
    };

    // Define top-ups with multi-currency pricing
    const topUps = {
      'enhancement-25': {
        name: '+25 Image Enhancements',
        amount: 1200, // $12.00 in cents
        amountINR: 99900, // ₹999 in paise
        amountEUR: 1100, // €11.00 in cents
        amountGBP: 1000, // £10.00 in pence
        description: 'Additional 25 AI image enhancements'
      },
      'enhancement-100': {
        name: '+100 Image Enhancements',
        amount: 4000, // $40.00 in cents
        amountINR: 329900, // ₹3,299 in paise
        amountEUR: 3700, // €37.00 in cents
        amountGBP: 3300, // £33.00 in pence
        description: 'Additional 100 AI image enhancements'
      },
      'enhancement-250': {
        name: '+250 Image Enhancements',
        amount: 8000, // $80.00 in cents
        amountINR: 659900, // ₹6,599 in paise
        amountEUR: 7400, // €74.00 in cents
        amountGBP: 6600, // £66.00 in pence
        description: 'Additional 250 AI image enhancements'
      }
    };

    let orderAmount: number;
    let planName: string;
    let description: string;

    if (topUps[planId as keyof typeof topUps]) {
      // Handle top-up purchase
      const topUp = topUps[planId as keyof typeof topUps];
      switch (currency) {
        case 'INR':
          orderAmount = topUp.amountINR;
          break;
        case 'EUR':
          orderAmount = topUp.amountEUR;
          break;
        case 'GBP':
          orderAmount = topUp.amountGBP;
          break;
        default:
          orderAmount = topUp.amount; // USD
      }
      planName = topUp.name;
      description = topUp.description;
    } else if (plans[planId as keyof typeof plans]) {
      // Handle subscription plan
      const plan = plans[planId as keyof typeof plans];
      
      // Handle free plan
      if (planId === 'free') {
        return NextResponse.json({ 
          success: true, 
          message: 'Free plan activated',
          planId: 'free'
        });
      }
      
      // Get amount based on currency and billing cycle
      switch (currency) {
        case 'INR':
          orderAmount = billingCycle === 'monthly' ? plan.monthlyINR : plan.yearlyINR;
          break;
        case 'EUR':
          orderAmount = billingCycle === 'monthly' ? plan.monthlyEUR : plan.yearlyEUR;
          break;
        case 'GBP':
          orderAmount = billingCycle === 'monthly' ? plan.monthlyGBP : plan.yearlyGBP;
          break;
        default:
          orderAmount = billingCycle === 'monthly' ? plan.monthly : plan.yearly; // USD
      }
      planName = plan.name;
      description = plan.description;
    } else {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Check if Razorpay credentials are available
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials not configured');
      console.error('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing');
      console.error('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }
    
    console.log('✅ Razorpay credentials found');

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Calculate tax and total amount based on user location, not currency
    let taxAmount = 0;
    let totalAmount = orderAmount;
    let isExport = !isIndianVisitor; // Export if user is NOT from India

    if (isIndianVisitor) {
      // Indian users must pay GST regardless of currency selection
      taxAmount = Math.round(orderAmount * 0.18); // 18% GST
      totalAmount = orderAmount + taxAmount;
      isExport = false;
      console.log('🇮🇳 Indian user detected - GST will be applied regardless of currency');
    } else {
      // International users - no tax (export of services)
      taxAmount = 0;
      totalAmount = orderAmount;
      isExport = true;
      console.log('🌍 International user detected - no GST (export of services)');
    }

    console.log('💰 Creating Razorpay order with amount:', orderAmount, 'currency:', currency);
    console.log('📊 Tax calculation:', { 
      baseAmount: orderAmount, 
      taxAmount: taxAmount, 
      totalAmount: totalAmount, 
      isExport: isExport 
    });

    // Create Razorpay order with total amount (including tax for INR)
    const order = await razorpay.orders.create({
      amount: totalAmount, // Use total amount including tax
      currency: currency,
      receipt: `order_${Date.now()}`,
      notes: {
        planId: planId,
        userId: userId,
        planName: planName,
        billingCycle: billingCycle,
        type: topUps[planId as keyof typeof topUps] ? 'topup' : 'subscription',
        isExport: isExport.toString(), // Convert boolean to string
        baseAmount: orderAmount.toString(), // Store original amount
        taxAmount: taxAmount.toString(), // Store tax amount
        totalAmount: totalAmount.toString() // Store total amount
      }
    });

    console.log('✅ Razorpay order created:', order.id);

    // Store order details in database
    console.log('💾 Storing order in database...');
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: userId,
        plan_id: planId,
        amount: orderAmount, // Base amount
        tax_amount: taxAmount, // Tax amount
        total_amount: totalAmount, // Total amount including tax
        currency: currency,
        status: 'created',
        billing_cycle: billingCycle,
        is_export: isExport,
        tax_details: {
          gst_rate: isIndianVisitor ? 18 : 0,
          tax_type: isIndianVisitor ? 'gst' : 'export',
          is_export: isExport,
          user_location: isIndianVisitor ? 'india' : 'international'
        },
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json({ error: 'Failed to store order' }, { status: 500 });
    }

    console.log('✅ Order stored in database successfully');

    console.log('🎉 Payment order creation completed successfully');
    return NextResponse.json({
      orderId: order.id,
      amount: orderAmount, // Base amount
      taxAmount: taxAmount, // Tax amount
      totalAmount: totalAmount, // Total amount including tax
      currency: currency,
      isExport: isExport,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('❌ Payment order creation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to create payment order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
