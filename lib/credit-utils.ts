import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Atomic credit operations to prevent race conditions
 */

export interface CreditCheckResult {
  success: boolean;
  creditsRemaining: number;
  error?: string;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

/**
 * Atomically check and deduct post generation credits
 */
export async function atomicPostCreditDeduction(
  userId: string,
  creditsToDeduct: number = 1
): Promise<CreditDeductionResult> {
  try {
    // Use a database transaction to ensure atomicity
    const { data, error } = await supabase.rpc('atomic_deduct_post_credits', {
      user_uuid: userId,
      credits_to_deduct: creditsToDeduct
    });

    if (error) {
      console.error('Atomic credit deduction error:', error);
      return {
        success: false,
        newBalance: 0,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        newBalance: 0,
        error: 'User not found or insufficient credits'
      };
    }

    const result = data[0];
    
    if (!result.success) {
      return {
        success: false,
        newBalance: result.current_credits || 0,
        error: result.error || 'Insufficient credits'
      };
    }

    return {
      success: true,
      newBalance: result.new_credits
    };

  } catch (error) {
    console.error('Credit deduction error:', error);
    return {
      success: false,
      newBalance: 0,
      error: 'Internal server error'
    };
  }
}

/**
 * Atomically check and deduct image enhancement credits
 */
export async function atomicEnhancementCreditDeduction(
  userId: string,
  creditsToDeduct: number = 1
): Promise<CreditDeductionResult> {
  try {
    // Use a database transaction to ensure atomicity
    const { data, error } = await supabase.rpc('atomic_deduct_enhancement_credits', {
      user_uuid: userId,
      credits_to_deduct: creditsToDeduct
    });

    if (error) {
      console.error('Atomic enhancement credit deduction error:', error);
      return {
        success: false,
        newBalance: 0,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        newBalance: 0,
        error: 'User not found or insufficient credits'
      };
    }

    const result = data[0];
    
    if (!result.success) {
      return {
        success: false,
        newBalance: result.current_credits || 0,
        error: result.error || 'Insufficient credits'
      };
    }

    return {
      success: true,
      newBalance: result.new_credits
    };

  } catch (error) {
    console.error('Enhancement credit deduction error:', error);
    return {
      success: false,
      newBalance: 0,
      error: 'Internal server error'
    };
  }
}

/**
 * Check user credits without deduction (for display purposes)
 */
export async function getUserCredits(userId: string): Promise<{
  postGenerationCredits: number;
  enhancementCredits: number;
  subscriptionPlan: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('post_generation_credits, image_enhancement_credits, subscription_plan')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user credits:', error);
      return {
        postGenerationCredits: 0,
        enhancementCredits: 0,
        subscriptionPlan: 'free'
      };
    }

    return {
      postGenerationCredits: data?.post_generation_credits || 0,
      enhancementCredits: data?.image_enhancement_credits || 0,
      subscriptionPlan: data?.subscription_plan || 'free'
    };

  } catch (error) {
    console.error('Error getting user credits:', error);
    return {
      postGenerationCredits: 0,
      enhancementCredits: 0,
      subscriptionPlan: 'free'
    };
  }
}

/**
 * Create user profile with default credits if it doesn't exist
 */
export async function ensureUserProfile(userId: string): Promise<{
  success: boolean;
  credits: { postGenerationCredits: number; enhancementCredits: number };
  error?: string;
}> {
  try {
    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('post_generation_credits, image_enhancement_credits')
      .eq('user_id', userId)
      .single();

    if (existingUser) {
      return {
        success: true,
        credits: {
          postGenerationCredits: existingUser.post_generation_credits || 0,
          enhancementCredits: existingUser.image_enhancement_credits || 0
        }
      };
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      return {
        success: false,
        credits: { postGenerationCredits: 0, enhancementCredits: 0 },
        error: fetchError.message
      };
    }

    // User doesn't exist, create with default credits
    const defaultCredits = {
      postGenerationCredits: 15, // Free plan default
      enhancementCredits: 3      // Free plan default
    };

    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        post_generation_credits: defaultCredits.postGenerationCredits,
        image_enhancement_credits: defaultCredits.enhancementCredits,
        media_storage_limit: 50,
        subscription_plan: 'free'
      })
      .select('post_generation_credits, image_enhancement_credits')
      .single();

    if (createError) {
      console.error('Error creating user profile:', createError);
      return {
        success: false,
        credits: { postGenerationCredits: 0, enhancementCredits: 0 },
        error: createError.message
      };
    }

    return {
      success: true,
      credits: {
        postGenerationCredits: newUser.post_generation_credits,
        enhancementCredits: newUser.image_enhancement_credits
      }
    };

  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return {
      success: false,
      credits: { postGenerationCredits: 0, enhancementCredits: 0 },
      error: 'Internal server error'
    };
  }
}

/**
 * Add credits to user account (for purchases, admin actions, etc.)
 */
export async function addCredits(
  userId: string,
  postCredits: number = 0,
  enhancementCredits: number = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    // First get current credits
    const { data: currentUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('post_generation_credits, image_enhancement_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        post_generation_credits: (currentUser.post_generation_credits || 0) + postCredits,
        image_enhancement_credits: (currentUser.image_enhancement_credits || 0) + enhancementCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error adding credits:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Error adding credits:', error);
    return { success: false, error: 'Internal server error' };
  }
}
