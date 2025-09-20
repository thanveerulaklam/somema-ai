#!/usr/bin/env node

/**
 * Script to add test credits to user account
 * This will add credits for both post generation and image enhancement testing
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function addTestCredits() {
  console.log('🔧 Adding Test Credits Script')
  console.log('============================')
  console.log('')

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Make sure you have:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    console.log('in your .env.local file')
    return
  }

  try {
    // Get the user ID from your terminal logs (I can see it's: c99ec3d7-f5db-4003-ab22-45f7cda4f84a)
    const userId = 'c99ec3d7-f5db-4003-ab22-45f7cda4f84a'
    
    console.log('👤 Target User ID:', userId)
    console.log('')

    // Check current credits
    console.log('📊 Checking current credits...')
    const { data: currentData, error: fetchError } = await supabase
      .from('user_profiles')
      .select('post_generation_credits, image_enhancement_credits, subscription_plan')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching current credits:', fetchError)
      return
    }

    console.log('Current credits:')
    console.log('  - Post Generation:', currentData?.post_generation_credits || 0)
    console.log('  - Image Enhancement:', currentData?.image_enhancement_credits || 0)
    console.log('  - Subscription Plan:', currentData?.subscription_plan || 'unknown')
    console.log('')

    // Add test credits
    const newPostCredits = (currentData?.post_generation_credits || 0) + 20
    const newImageCredits = (currentData?.image_enhancement_credits || 0) + 10

    console.log('💰 Adding test credits...')
    console.log('  - Post Generation: +20 credits')
    console.log('  - Image Enhancement: +10 credits')
    console.log('')

    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        post_generation_credits: newPostCredits,
        image_enhancement_credits: newImageCredits
      })
      .eq('user_id', userId)
      .select('post_generation_credits, image_enhancement_credits')

    if (updateError) {
      console.error('❌ Error updating credits:', updateError)
      return
    }

    console.log('✅ Credits updated successfully!')
    console.log('New credits:')
    console.log('  - Post Generation:', updateData[0]?.post_generation_credits)
    console.log('  - Image Enhancement:', updateData[0]?.image_enhancement_credits)
    console.log('')

    console.log('🎯 Ready for testing!')
    console.log('You can now:')
    console.log('1. Test 20 post generations')
    console.log('2. Test 10 image enhancements')
    console.log('3. Get accurate cost data for both features')
    console.log('')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the script
addTestCredits()
