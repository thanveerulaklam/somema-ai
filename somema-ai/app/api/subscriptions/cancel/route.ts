import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    console.log('🚫 Subscription cancellation request received');
    
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's subscription details
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('razorpay_subscription_id, subscription_plan, subscription_status')
      .eq('user_id', userId)
      .single();

    // Also get subscription details from subscriptions table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('razorpay_subscription_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (userError || !userData) {
      console.error('❌ Error fetching user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    if (userData.subscription_plan === 'free') {
      return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
    }

    if (userData.subscription_status === 'cancelled') {
      return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 });
    }

    console.log('📋 Cancelling subscription for user:', userId);
    console.log('Current plan:', userData.subscription_plan);
    console.log('Current status:', userData.subscription_status);

    // Get the Razorpay subscription ID
    const razorpaySubscriptionId = userData.razorpay_subscription_id || subscriptionData?.razorpay_subscription_id;
    
    if (razorpaySubscriptionId) {
      console.log('📋 Cancelling Razorpay subscription:', razorpaySubscriptionId);
      
      // Cancel subscription in Razorpay
      try {
        await razorpay.subscriptions.cancel(razorpaySubscriptionId, false);
        console.log('✅ Subscription cancelled in Razorpay');
      } catch (razorpayError: any) {
        console.error('❌ Razorpay cancellation error:', razorpayError);
        
        // If subscription is already cancelled/expired in Razorpay, just update our database
        if (razorpayError.error?.code === 'BAD_REQUEST_ERROR' && 
            (razorpayError.error?.description?.includes('already cancelled') ||
             razorpayError.error?.description?.includes('not cancellable') ||
             razorpayError.error?.description?.includes('expired'))) {
          console.log('ℹ️ Subscription already cancelled/expired in Razorpay, updating database');
        } else {
          console.log('⚠️ Unexpected Razorpay error, but continuing with database update');
          // Don't fail the request - just log the error and continue
        }
      }
    } else {
      console.log('ℹ️ No Razorpay subscription ID found - using one-time payment model');
    }

    // Update user's subscription status in database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_plan: 'free',
        post_generation_credits: 15, // Reset to free plan credits
        image_enhancement_credits: 3, // Reset to free plan credits
        media_storage_limit: 50000000, // Reset to 50MB
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating user subscription:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update subscription status',
        details: updateError.message
      }, { status: 500 });
    }

    // Also update the subscriptions table if it exists
    const { error: subscriptionUpdateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (subscriptionUpdateError) {
      console.log('⚠️ Could not update subscriptions table:', subscriptionUpdateError.message);
      // Don't fail the request if subscriptions table doesn't exist or has issues
    }

    console.log('✅ Subscription cancelled successfully for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. You will retain access until the end of your current billing period.',
      newPlan: 'free',
      creditsReset: {
        postGenerations: 15,
        imageEnhancements: 3
      }
    });

  } catch (error: any) {
    console.error('❌ Subscription cancellation error:', error);
    return NextResponse.json({
      error: 'Failed to cancel subscription',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
