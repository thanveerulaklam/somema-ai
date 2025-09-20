import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 Razorpay Invoice Webhook received');
    
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    
    if (!signature) {
      console.error('❌ Missing signature in webhook');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('📋 Webhook event:', event.event);

    switch (event.event) {
      case 'invoice.paid':
        await handleInvoicePaid(event.payload.invoice.entity);
        break;
      
      case 'invoice.cancelled':
        await handleInvoiceCancelled(event.payload.invoice.entity);
        break;
      
      case 'invoice.expired':
        await handleInvoiceExpired(event.payload.invoice.entity);
        break;
      
      default:
        console.log('ℹ️ Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleInvoicePaid(invoice: any) {
  console.log('💰 Invoice paid:', invoice.id);
  
  try {
    // First, check if invoice exists in database
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('razorpay_invoice_id', invoice.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching invoice:', fetchError);
      return;
    }

    if (!existingInvoice) {
      // Invoice doesn't exist in database, create it now
      console.log('📝 Creating invoice record in database after payment...');
      
      // Extract user_id from invoice notes
      const userId = invoice.notes?.user_id;
      if (!userId) {
        console.error('❌ No user_id found in invoice notes');
        return;
      }

      // Calculate amounts from line items
      const lineItems = invoice.line_items && Array.isArray(invoice.line_items) ? invoice.line_items : [];
      const baseAmount = lineItems.find((item: any) => !item.name.includes('GST'))?.amount || 0;
      const taxAmount = lineItems.filter((item: any) => item.name.includes('GST')).reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
      const totalAmount = invoice.amount;

      // Create invoice record
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          razorpay_invoice_id: invoice.id,
          user_id: userId,
          invoice_number: invoice.invoice_number,
          plan_id: invoice.notes?.plan_id || 'unknown',
          billing_cycle: invoice.notes?.billing_cycle || 'monthly',
          customer_name: invoice.customer_details?.name || 'Customer',
          customer_email: invoice.customer_details?.email || '',
          customer_phone: invoice.customer_details?.contact || '',
          customer_type: invoice.notes?.customer_type || 'individual',
          business_name: invoice.notes?.business_name || null,
          gst_number: invoice.customer_details?.gstin || null,
          business_address: null,
          billing_address: invoice.customer_details?.billing_address || null,
          base_amount: baseAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: invoice.currency || 'INR',
          gst_rate: invoice.notes?.gst_applied === 'true' ? 18.00 : 0,
          cgst_amount: lineItems.find((item: any) => item.name === 'CGST')?.amount || 0,
          sgst_amount: lineItems.find((item: any) => item.name === 'SGST')?.amount || 0,
          igst_amount: lineItems.find((item: any) => item.name === 'IGST')?.amount || 0,
          is_export: false,
          status: 'paid',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paid_at: new Date().toISOString(),
          razorpay_payment_id: invoice.payment_id,
          // short_url: invoice.short_url, // Store the payment URL - temporarily commented out
          invoice_data: invoice
        });

      if (insertError) {
        console.error('❌ Error creating invoice record:', insertError);
        return;
      }

      console.log('✅ Invoice record created in database');
    } else {
      // Invoice exists, update status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          razorpay_payment_id: invoice.payment_id,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_invoice_id', invoice.id);

      if (updateError) {
        console.error('❌ Error updating invoice status:', updateError);
        return;
      }
    }

    // Get invoice details to activate subscription
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('razorpay_invoice_id', invoice.id)
      .single();

    if (invoiceError || !invoiceData) {
      console.error('❌ Error fetching invoice data:', invoiceError);
      return;
    }

    // Activate user subscription
    const subscriptionData = {
      subscription_plan: invoiceData.plan_id,
      subscription_status: 'active',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: calculateEndDate(invoiceData.billing_cycle),
      billing_cycle: invoiceData.billing_cycle
    };

    const { error: userUpdateError } = await supabase
      .from('users')
      .update(subscriptionData)
      .eq('id', invoiceData.user_id);

    if (userUpdateError) {
      console.error('❌ Error updating user subscription:', userUpdateError);
    } else {
      console.log('✅ User subscription activated for:', invoiceData.user_id);
    }

    // Create subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: invoiceData.user_id,
        plan_id: invoiceData.plan_id,
        status: 'active',
        current_start_date: new Date().toISOString(),
        current_end_date: calculateEndDate(invoiceData.billing_cycle),
        amount: invoiceData.base_amount,
        currency: invoiceData.currency,
        billing_cycle: invoiceData.billing_cycle
      });

    if (subscriptionError) {
      console.error('❌ Error creating subscription record:', subscriptionError);
    }

  } catch (error) {
    console.error('❌ Error handling invoice paid:', error);
  }
}

async function handleInvoiceCancelled(invoice: any) {
  console.log('❌ Invoice cancelled:', invoice.id);
  
  try {
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_invoice_id', invoice.id);

    if (updateError) {
      console.error('❌ Error updating invoice status:', updateError);
    }

  } catch (error) {
    console.error('❌ Error handling invoice cancelled:', error);
  }
}

async function handleInvoiceExpired(invoice: any) {
  console.log('⏰ Invoice expired:', invoice.id);
  
  try {
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_invoice_id', invoice.id);

    if (updateError) {
      console.error('❌ Error updating invoice status:', updateError);
    }

  } catch (error) {
    console.error('❌ Error handling invoice expired:', error);
  }
}

function calculateEndDate(billingCycle: string): string {
  const now = new Date();
  
  switch (billingCycle) {
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    case 'yearly':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}
