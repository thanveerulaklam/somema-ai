// User profile utility functions for invoice system

import { createClient } from '@supabase/supabase-js';

// This file should only be used on the server side
// For client-side usage, use the getUserProfileClient function

export interface UserProfile {
  id: string;
  user_id: string;
  customer_type: 'individual' | 'business';
  business_name?: string;
  gst_number?: string;
  business_address?: any;
  billing_address?: any;
  invoice_email?: string;
  auto_invoice: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}

/**
 * Get user profile data, creating one if it doesn't exist
 */
export async function getUserProfile(userId: string): Promise<{
  authUser: AuthUser;
  profile: UserProfile;
} | null> {
  try {
    // Create server-side supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get auth user data
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    
    if (authUserError || !authUser.user) {
      console.error('Error getting auth user:', authUserError);
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no profile exists, create a default one
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          customer_type: 'individual',
          invoice_email: authUser.user.email,
          post_generation_credits: 15,
          image_enhancement_credits: 3,
          media_storage_limit: 50,
          subscription_plan: 'free'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user profile:', createError);
        return null;
      }
      
      return {
        authUser: authUser.user,
        profile: newProfile
      };
    }

    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return null;
    }

    // If profile exists but doesn't have customer_type, update it
    let finalProfile = profile;
    if (profile && !profile.customer_type) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ customer_type: 'individual' })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating user profile:', updateError);
      } else {
        finalProfile = updatedProfile;
      }
    }

    return {
      authUser: authUser.user,
      profile: finalProfile
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    // Create server-side supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    // Create server-side supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    return null;
  }
}

/**
 * Get user profile for client-side usage (with anon key)
 */
export async function getUserProfileClient(userId: string): Promise<{
  authUser: AuthUser;
  profile: UserProfile;
} | null> {
  try {
    const clientSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get current user
    const { data: { user }, error: authError } = await clientSupabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      console.error('Error getting current user:', authError);
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await clientSupabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no profile exists, create a default one
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await clientSupabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          customer_type: 'individual',
          invoice_email: user.email
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user profile:', createError);
        return null;
      }
      
      return {
        authUser: user,
        profile: newProfile
      };
    }

    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return null;
    }

    // If profile exists but doesn't have customer_type, update it
    let finalProfile = profile;
    if (profile && !profile.customer_type) {
      const { data: updatedProfile, error: updateError } = await clientSupabase
        .from('user_profiles')
        .update({ customer_type: 'individual' })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating user profile:', updateError);
      } else {
        finalProfile = updatedProfile;
      }
    }

    return {
      authUser: user,
      profile: finalProfile
    };
  } catch (error) {
    console.error('Error in getUserProfileClient:', error);
    return null;
  }
}
