import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const envCheck = {
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing',
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    };

    console.log('🔍 Environment check:', envCheck);

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Environment check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
