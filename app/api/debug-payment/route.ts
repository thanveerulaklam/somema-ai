import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    console.log('🔍 Payment Debug - Input Parameters:');
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);
    console.log('Signature:', razorpay_signature?.substring(0, 20) + '...');

    // Check environment variables
    const envCheck = {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      NEXT_PUBLIC_RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };

    console.log('🔧 Environment Variables Check:', envCheck);

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ 
        error: 'RAZORPAY_KEY_SECRET not configured',
        envCheck 
      }, { status: 500 });
    }

    // Test signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const signatureMatch = expectedSignature === razorpay_signature;

    console.log('🔐 Signature Verification:');
    console.log('Expected:', expectedSignature.substring(0, 20) + '...');
    console.log('Received:', razorpay_signature?.substring(0, 20) + '...');
    console.log('Match:', signatureMatch);

    // Test Razorpay API connection
    let apiTest: { success: boolean; error: any; paymentDetails: any } = { success: false, error: null, paymentDetails: null };
    
    try {
      const razorpay = new (require('razorpay'))({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      apiTest = { 
        success: true, 
        error: null, 
        paymentDetails: {
          id: paymentDetails.id,
          status: paymentDetails.status,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          method: paymentDetails.method,
          created_at: paymentDetails.created_at
        }
      };

      console.log('✅ Razorpay API Test Success:', apiTest.paymentDetails);
    } catch (apiError: any) {
      apiTest = { 
        success: false, 
        error: apiError.message,
        paymentDetails: null 
      };
      console.log('❌ Razorpay API Test Failed:', apiError.message);
    }

    return NextResponse.json({
      success: true,
      debug: {
        inputValidation: {
          hasOrderId: !!razorpay_order_id,
          hasPaymentId: !!razorpay_payment_id,
          hasSignature: !!razorpay_signature
        },
        envCheck,
        signatureVerification: {
          match: signatureMatch,
          expectedSignature: expectedSignature.substring(0, 20) + '...',
          receivedSignature: razorpay_signature?.substring(0, 20) + '...'
        },
        razorpayApiTest: apiTest
      }
    });

  } catch (error) {
    console.error('❌ Payment Debug Error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
