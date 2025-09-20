import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateSubscriptionEndDate } from '@/lib/billing-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Free plan activation started');
    
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('📋 Activating free plan for user:', userId);

    // Update user to free plan in user_profiles table
    const { error: userError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        subscription_plan: 'free',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: calculateSubscriptionEndDate(new Date(), 'monthly'),
        post_generation_credits: 15,
        image_enhancement_credits: 3,
        media_storage_limit: 50, // 50 images
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (userError) {
      console.error('❌ User free plan update error:', userError);
      return NextResponse.json({ error: 'Failed to activate free plan' }, { status: 500 });
    }

    // Create subscription record for free plan
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_id: 'free',
        status: 'active',
        current_start_date: new Date().toISOString(),
        current_end_date: calculateSubscriptionEndDate(new Date(), 'monthly'),
        amount: 0,
        currency: 'USD',
        billing_cycle: 'monthly',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subscriptionError) {
      console.error('❌ Free plan subscription record error:', subscriptionError);
      // Don't fail the request if subscription record fails
    }

    console.log('✅ Free plan activated successfully for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Free plan activated successfully'
    });

  } catch (error) {
    console.error('❌ Free plan activation error:', error);
    return NextResponse.json({ error: 'Failed to activate free plan' }, { status: 500 });
  }
}
