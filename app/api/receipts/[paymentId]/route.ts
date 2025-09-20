import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const paymentId = params.paymentId;
    console.log('🧾 Generating receipt for payment:', paymentId);

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        currency,
        status,
        created_at,
        payment_orders!inner(
          order_id,
          plan_id,
          billing_cycle,
          amount as order_amount,
          tax_amount,
          total_amount,
          user_id,
          user_profiles!inner(
            full_name,
            business_name,
            email
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('❌ Payment not found:', paymentError);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const orderData = payment.payment_orders;
    const userProfile = orderData.user_profiles;

    // Get plan details
    const planDetails = {
      starter: { name: 'Starter Plan', description: 'Perfect for small businesses and creators' },
      growth: { name: 'Growth Plan', description: 'Ideal for growing businesses' },
      scale: { name: 'Scale Plan', description: 'For large-scale operations' },
      free: { name: 'Free Plan', description: 'Perfect for getting started' }
    };

    const plan = planDetails[orderData.plan_id as keyof typeof planDetails] || {
      name: `${orderData.plan_id} Plan`,
      description: 'Subscription plan'
    };

    // Calculate amounts
    const baseAmount = orderData.order_amount;
    const taxAmount = orderData.tax_amount || 0;
    const totalAmount = orderData.total_amount;
    const currency = payment.currency;
    const currencySymbol = currency === 'INR' ? '₹' : 
                          currency === 'USD' ? '$' : 
                          currency === 'EUR' ? '€' : 
                          currency === 'GBP' ? '£' : currency;

    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - Quely AI</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f8fafc;
          }
          .receipt-container { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #3B82F6, #1D4ED8); 
            color: white; 
            padding: 40px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 40px; }
          .receipt-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px; 
          }
          .info-section h3 { 
            color: #3B82F6; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 8px; 
          }
          .info-item { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 5px 0; 
          }
          .info-label { font-weight: 500; color: #6B7280; }
          .info-value { font-weight: 600; }
          .amount-breakdown { 
            background: #f8fafc; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 30px 0; 
            border: 1px solid #e5e7eb;
          }
          .amount-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 8px 0; 
          }
          .total-row { 
            border-top: 2px solid #3B82F6; 
            padding-top: 15px; 
            margin-top: 15px; 
            font-size: 18px; 
            font-weight: bold; 
            color: #059669; 
          }
          .status-badge { 
            display: inline-block; 
            background: #10B981; 
            color: white; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: 500; 
          }
          .footer { 
            background: #f8fafc; 
            padding: 30px; 
            text-align: center; 
            color: #6B7280; 
            border-top: 1px solid #e5e7eb;
          }
          .print-button { 
            background: #3B82F6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 16px; 
            margin: 20px 0; 
          }
          .print-button:hover { background: #2563EB; }
          @media print {
            body { background: white; }
            .print-button { display: none; }
            .receipt-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Quely AI - AI-Powered Social Media Management</p>
          </div>
          
          <div class="content">
            <div class="receipt-info">
              <div class="info-section">
                <h3>Payment Details</h3>
                <div class="info-item">
                  <span class="info-label">Payment ID:</span>
                  <span class="info-value">${payment.id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Order ID:</span>
                  <span class="info-value">${orderData.order_id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${new Date(payment.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value">
                    <span class="status-badge">${payment.status.toUpperCase()}</span>
                  </span>
                </div>
              </div>
              
              <div class="info-section">
                <h3>Customer Details</h3>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${userProfile.business_name || userProfile.full_name || 'Customer'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${userProfile.email}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Plan:</span>
                  <span class="info-value">${plan.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Billing:</span>
                  <span class="info-value">${orderData.billing_cycle}</span>
                </div>
              </div>
            </div>

            <div class="amount-breakdown">
              <h3 style="margin-top: 0; color: #3B82F6;">Amount Breakdown</h3>
              <div class="amount-row">
                <span>Plan Amount:</span>
                <span>${currencySymbol}${(baseAmount / (currency === 'INR' ? 100 : 1)).toFixed(2)} ${currency}</span>
              </div>
              ${taxAmount > 0 ? `
                <div class="amount-row">
                  <span>GST (18%):</span>
                  <span>${currencySymbol}${(taxAmount / (currency === 'INR' ? 100 : 1)).toFixed(2)} ${currency}</span>
                </div>
              ` : ''}
              <div class="amount-row total-row">
                <span>Total Amount:</span>
                <span>${currencySymbol}${(totalAmount / (currency === 'INR' ? 100 : 1)).toFixed(2)} ${currency}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <button class="print-button" onclick="window.print()">Print Receipt</button>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6;">
              <h4 style="margin-top: 0; color: #1E40AF;">Thank you for choosing Quely AI!</h4>
              <p style="margin-bottom: 0;">Your subscription is now active. You can start creating amazing content right away.</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>Quely AI</strong> - AI-Powered Social Media Management</p>
            <p>For support, contact us at support@quely.ai</p>
            <p>This is an automated receipt. No signature required.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Return HTML receipt
    return new NextResponse(receiptHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('❌ Receipt generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate receipt',
      details: error.message 
    }, { status: 500 });
  }
}
