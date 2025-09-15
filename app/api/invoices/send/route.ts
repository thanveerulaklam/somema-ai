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
    console.log('📧 Sending Razorpay Invoice...');
    
    const { invoiceId, razorpayInvoiceId } = await req.json();

    if (!invoiceId && !razorpayInvoiceId) {
      return NextResponse.json({ error: 'Invoice ID or Razorpay Invoice ID required' }, { status: 400 });
    }

    let razorpayInvoiceIdToUse = razorpayInvoiceId;

    // If only database invoice ID is provided, get Razorpay invoice ID
    if (!razorpayInvoiceIdToUse && invoiceId) {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('razorpay_invoice_id')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      razorpayInvoiceIdToUse = invoice.razorpay_invoice_id;
    }

    // Send invoice via Razorpay
    const sentInvoice = await razorpay.invoices.notifyBy(razorpayInvoiceIdToUse, 'email');

    // Update invoice status in database
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_invoice_id', razorpayInvoiceIdToUse);

    if (updateError) {
      console.error('❌ Error updating invoice status:', updateError);
    }

    console.log('✅ Invoice sent successfully:', razorpayInvoiceIdToUse);

    return NextResponse.json({
      success: true,
      invoice: {
        id: razorpayInvoiceIdToUse,
        status: 'sent',
        sent_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error sending invoice:', error);
    return NextResponse.json({ 
      error: 'Failed to send invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
