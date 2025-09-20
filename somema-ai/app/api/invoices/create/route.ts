import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

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
    console.log('🧾 Creating Razorpay Invoice...');
    
    const {
      userId,
      planId,
      billingCycle = 'monthly',
      customerType = 'individual',
      businessInfo = {},
      billingInfo = {}
    } = await req.json();

    console.log('📋 Request data:', { userId, planId, billingCycle, customerType });
    console.log('🔍 User ID type:', typeof userId, 'Value:', userId);

    // Validate required fields
    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user details from auth.users
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    
    let currentUser;
    if (authUserError || !authUser.user) {
      console.error('❌ Auth user error:', authUserError);
      console.error('❌ User ID:', userId);
      
      // Try to get user from user_profiles table instead
      const { data: profileUser, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError || !profileUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Use profile data as fallback
      currentUser = {
        id: userId,
        email: profileUser.invoice_email || 'unknown@example.com',
        user_metadata: {
          full_name: profileUser.business_name || 'Unknown User'
        }
      };
      
    console.log('✅ Using fallback user data:', currentUser);
  } else {
    currentUser = authUser.user;
  }

  // Debug user ID comparison
  console.log('🔍 User ID comparison:', { 
    requestUserId: userId, 
    userObjectId: currentUser.id, 
    match: userId === currentUser.id 
  });

    // Get user profile details
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no profile exists, create a default one
    let profile = userProfile;
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId, // Use the userId from request (matches auth.users table)
          customer_type: customerType,
          invoice_email: currentUser.email,
          post_generation_credits: 15,
          image_enhancement_credits: 3,
          media_storage_limit: 50,
          subscription_plan: 'free'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user profile:', createError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
      profile = newProfile;
    }

    // If profile exists but doesn't have customer_type, update it
    if (profile && !profile.customer_type) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ customer_type: customerType })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating user profile:', updateError);
      } else {
        profile = updatedProfile;
      }
    }

    const user = {
      ...currentUser,
      ...profile
    };

    // Define subscription plans with pricing
    const plans = {
      starter: {
        monthly: { amount: 99900, name: 'Starter Plan - Monthly' },
        yearly: { amount: 999000, name: 'Starter Plan - Yearly' }
      },
      growth: {
        monthly: { amount: 249900, name: 'Growth Plan - Monthly' },
        yearly: { amount: 2499000, name: 'Growth Plan - Yearly' }
      },
      scale: {
        monthly: { amount: 899900, name: 'Scale Plan - Monthly' },
        yearly: { amount: 8999000, name: 'Scale Plan - Yearly' }
      }
    };

    const plan = plans[planId as keyof typeof plans]?.[billingCycle as keyof typeof plans.starter];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan or billing cycle' }, { status: 400 });
    }

    const baseAmount = plan.amount;
    
    // Determine if GST should be applied
    // Auto-detect business client if they have a business name
    const hasBusinessName = businessInfo.businessName || user.business_name;
    const isBusinessClient = customerType === 'business' || 
                            user.customer_type === 'business' || 
                            (hasBusinessName && hasBusinessName !== 'Unknown' && hasBusinessName !== 'Customer');
    const hasGstNumber = businessInfo.gstNumber || user.gst_number;
    
    console.log('🏢 Customer type analysis:', {
      customerType,
      userCustomerType: user.customer_type,
      isBusinessClient,
      hasGstNumber,
      businessName: businessInfo.businessName || user.business_name
    });
    
    // Calculate GST
    let taxAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let gstRate = 0;
    
    if (isBusinessClient && hasGstNumber) {
      // Business client with GST number - apply GST
      gstRate = 18.00;
      taxAmount = Math.round(baseAmount * gstRate / 100);
      
      // For now, assuming intra-state (can be enhanced with address validation)
      cgstAmount = Math.round(taxAmount / 2);
      sgstAmount = Math.round(taxAmount / 2);
    } else if (isBusinessClient && !hasGstNumber) {
      // Business client without GST number - still apply GST (reverse charge)
      gstRate = 18.00;
      taxAmount = Math.round(baseAmount * gstRate / 100);
      cgstAmount = Math.round(taxAmount / 2);
      sgstAmount = Math.round(taxAmount / 2);
    }
    // Individual clients - no GST

    const totalAmount = baseAmount + taxAmount;

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');
    console.log('🔢 Generated invoice number:', invoiceNumber);
    
    // Fallback invoice number if database function fails
    const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;

    // Prepare customer details for Razorpay
    // Use a unique email to avoid customer limit issues
    const customerEmail = `temp_${Date.now()}@${user.email ? user.email.split('@')[1] : 'example.com'}`;
    const customerDetails = {
      name: user.user_metadata?.full_name || businessInfo.businessName || 'Customer',
      email: customerEmail,
      contact: user.user_metadata?.phone || businessInfo.phone || '',
      gstin: hasGstNumber ? (businessInfo.gstNumber || user.gst_number) : null,
      billing_address: {
        name: user.user_metadata?.full_name || businessInfo.businessName,
        line1: billingInfo.address || user.billing_address?.line1 || '',
        line2: billingInfo.address2 || user.billing_address?.line2 || '',
        city: billingInfo.city || user.billing_address?.city || '',
        state: billingInfo.state || user.billing_address?.state || '',
        country: 'IN',
        zipcode: billingInfo.pincode || user.billing_address?.pincode || ''
      }
    };

    // Prepare line items for Razorpay Invoice
    const lineItems = [
      {
        name: plan.name,
        description: `${plan.name} subscription`,
        amount: baseAmount,
        quantity: 1,
        unit: 'nos'
      }
    ];

    // Add GST line items if applicable
    if (taxAmount > 0) {
      if (cgstAmount > 0) {
        lineItems.push({
          name: 'CGST',
          description: 'Central GST @ 9%',
          amount: cgstAmount,
          quantity: 1,
          unit: 'nos'
        });
      }
      if (sgstAmount > 0) {
        lineItems.push({
          name: 'SGST',
          description: 'State GST @ 9%',
          amount: sgstAmount,
          quantity: 1,
          unit: 'nos'
        });
      }
    }

    // Create Razorpay Invoice
    const invoiceData = {
      type: 'invoice' as const,
      description: `Subscription for ${plan.name}`,
      partial_payment: false,
      customer: customerDetails,
      line_items: lineItems,
      currency: 'INR',
      receipt: finalInvoiceNumber,
      notes: {
        plan_id: planId,
        billing_cycle: billingCycle,
        customer_type: customerType,
        gst_applied: taxAmount > 0 ? 'true' : 'false',
        user_id: userId,
        business_name: businessInfo.businessName || user.business_name
      }
    };

    console.log('📋 Creating Razorpay invoice with data:', invoiceData);

    const razorpayInvoice = await razorpay.invoices.create(invoiceData);

    // Save invoice to database immediately with 'sent' status so it appears in the list
    // The status will be updated to 'paid' via webhook when payment is completed
    console.log('💾 Saving invoice to database...');
    
    const { error: insertError } = await supabase
      .from('invoices')
      .insert({
        razorpay_invoice_id: razorpayInvoice.id,
        user_id: userId,
        invoice_number: razorpayInvoice.invoice_number || finalInvoiceNumber,
        plan_id: planId,
        billing_cycle: billingCycle,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.contact || '',
        customer_type: customerType,
        business_name: businessInfo.businessName || user.business_name || null,
        gst_number: customerDetails.gstin || null,
        business_address: null,
        billing_address: customerDetails.billing_address || null,
        base_amount: baseAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: 'INR',
        gst_rate: gstRate,
        cgst_amount: (lineItems && Array.isArray(lineItems) ? lineItems.find(item => item.name === 'CGST')?.amount : 0) || 0,
        sgst_amount: (lineItems && Array.isArray(lineItems) ? lineItems.find(item => item.name === 'SGST')?.amount : 0) || 0,
        igst_amount: (lineItems && Array.isArray(lineItems) ? lineItems.find(item => item.name === 'IGST')?.amount : 0) || 0,
        is_export: false,
        status: 'sent', // Set as 'sent' so it appears in the list
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // short_url: razorpayInvoice.short_url, // Store the payment URL - temporarily commented out
        invoice_data: razorpayInvoice
      });

    if (insertError) {
      console.error('❌ Error saving invoice to database:', insertError);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ Invoice saved to database successfully');
    }
    
    console.log('✅ Invoice created successfully:', razorpayInvoice.id);
    console.log('💳 Payment URL:', razorpayInvoice.short_url);

    return NextResponse.json({
      success: true,
      invoice: {
        razorpay_invoice_id: razorpayInvoice.id,
        invoice_number: razorpayInvoice.invoice_number || finalInvoiceNumber,
        short_url: razorpayInvoice.short_url,
        status: razorpayInvoice.status,
        amount: totalAmount,
        base_amount: baseAmount,
        tax_amount: taxAmount,
        gst_rate: gstRate,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    return NextResponse.json({ 
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
