import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not Set',
      razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ? 'Set' : 'Not Set',
      publicRazorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check environment' }, { status: 500 });
  }
}
