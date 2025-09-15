import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PaymentEmailData {
  userEmail: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId: string;
  billingCycle: string;
  isIndianVisitor: boolean;
}

interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  planName: string;
  credits: {
    posts: number;
    enhancements: number;
  };
}

export async function sendPaymentConfirmationEmail(data: PaymentEmailData) {
  try {
    console.log('📧 Sending payment confirmation email to:', data.userEmail);

    const amount = data.currency === 'INR' ? data.amount / 100 : data.amount;
    const currencySymbol = data.currency === 'INR' ? '₹' : 
                          data.currency === 'USD' ? '$' : 
                          data.currency === 'EUR' ? '€' : 
                          data.currency === 'GBP' ? '£' : data.currency;

    const subject = `Payment Confirmation - ${data.planName} Plan`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .amount { font-size: 32px; font-weight: bold; color: #059669; margin: 20px 0; }
          .plan-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
          .payment-details { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for subscribing to Quely AI</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.userName}!</h2>
          
          <p>Your payment has been processed successfully. Here are the details:</p>
          
          <div class="plan-details">
            <h3>${data.planName} Plan</h3>
            <div class="amount">${currencySymbol}${amount.toFixed(2)} ${data.currency}</div>
            <p><strong>Billing Cycle:</strong> ${data.billingCycle}</p>
            <p><strong>Payment ID:</strong> ${data.paymentId}</p>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
          </div>

          <div class="payment-details">
            <h4>What's Next?</h4>
            <ul>
              <li>✅ Your plan is now active</li>
              <li>✅ Credits have been added to your account</li>
              <li>✅ You can start creating content immediately</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.quely.ai'}/dashboard" class="cta-button">
              Go to Dashboard
            </a>
          </div>

          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>

        <div class="footer">
          <p>This email was sent by Quely AI</p>
          <p>If you didn't make this payment, please contact us immediately.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Payment Confirmation - ${data.planName} Plan
      
      Hello ${data.userName}!
      
      Your payment has been processed successfully.
      
      Plan: ${data.planName}
      Amount: ${currencySymbol}${amount.toFixed(2)} ${data.currency}
      Billing Cycle: ${data.billingCycle}
      Payment ID: ${data.paymentId}
      Order ID: ${data.orderId}
      
      Your plan is now active and credits have been added to your account.
      
      Go to your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.quely.ai'}/dashboard
      
      If you have any questions, please contact our support team.
      
      Best regards,
      Quely AI Team
    `;

    // Send email using Supabase Edge Functions (if configured)
    // For now, we'll log the email content
    console.log('📧 Email content prepared:', {
      to: data.userEmail,
      subject,
      htmlLength: htmlContent.length,
      textLength: textContent.length
    });

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Quely AI <noreply@quely.ai>', // You'll need to verify this domain
            to: [data.userEmail],
            subject: subject,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Resend API error: ${errorData.message}`);
        }

        const result = await response.json();
        console.log('✅ Email sent via Resend:', result.id);

        // Log successful email
        const { error: emailLogError } = await supabase
          .from('email_logs')
          .insert({
            to_email: data.userEmail,
            subject: subject,
            html_content: htmlContent,
            text_content: textContent,
            email_type: 'payment_confirmation',
            status: 'sent',
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (emailLogError) {
          console.error('❌ Failed to log email:', emailLogError);
        }

        return { success: true, message: 'Email sent successfully', emailId: result.id };
      } catch (resendError) {
        console.error('❌ Resend email error:', resendError);
        
        // Fallback: Log email for manual sending
        const { error: emailLogError } = await supabase
          .from('email_logs')
          .insert({
            to_email: data.userEmail,
            subject: subject,
            html_content: htmlContent,
            text_content: textContent,
            email_type: 'payment_confirmation',
            status: 'failed',
            error_message: resendError instanceof Error ? resendError.message : 'Unknown error',
            created_at: new Date().toISOString()
          });

        return { success: false, error: resendError instanceof Error ? resendError.message : 'Email sending failed' };
      }
    } else {
      // No Resend API key - log email for manual sending
      console.log('⚠️ No Resend API key found, logging email for manual sending');
      
      const { error: emailLogError } = await supabase
        .from('email_logs')
        .insert({
          to_email: data.userEmail,
          subject: subject,
          html_content: htmlContent,
          text_content: textContent,
          email_type: 'payment_confirmation',
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (emailLogError) {
        console.error('❌ Failed to log email:', emailLogError);
        return { success: false, error: 'Failed to log email' };
      }

      return { success: true, message: 'Email logged for manual sending' };
    }

  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  try {
    console.log('📧 Sending welcome email to:', data.userEmail);

    const subject = `Welcome to Quely AI - ${data.planName} Plan`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Quely AI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .welcome-icon { font-size: 48px; margin-bottom: 20px; }
          .credits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
          .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="welcome-icon">🎉</div>
          <h1>Welcome to Quely AI!</h1>
          <p>Your ${data.planName} is now active</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.userName}!</h2>
          
          <p>Welcome to Quely AI! Your subscription is now active and you're ready to create amazing content.</p>
          
          <div class="credits">
            <h3>Your Credits</h3>
            <p><strong>Post Generations:</strong> ${data.credits.posts}</p>
            <p><strong>Image Enhancements:</strong> ${data.credits.enhancements}</p>
          </div>

          <h3>Getting Started</h3>
          <ol>
            <li>Upload your images and videos to the media library</li>
            <li>Generate AI-powered social media posts</li>
            <li>Schedule and publish to your social accounts</li>
            <li>Track your performance with analytics</li>
          </ol>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.quely.ai'}/dashboard" class="cta-button">
              Start Creating Content
            </a>
          </div>

          <p>Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.quely.ai'}/tutorial">tutorial</a> or contact our support team.</p>
        </div>

        <div class="footer">
          <p>Thank you for choosing Quely AI!</p>
          <p>Happy creating! 🚀</p>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Quely AI <noreply@quely.ai>', // You'll need to verify this domain
            to: [data.userEmail],
            subject: subject,
            html: htmlContent,
            text: `Welcome to Quely AI! Your ${data.planName} is now active. Credits: ${data.credits.posts} posts, ${data.credits.enhancements} enhancements.`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Resend API error: ${errorData.message}`);
        }

        const result = await response.json();
        console.log('✅ Welcome email sent via Resend:', result.id);

        // Log successful email
        const { error: emailLogError } = await supabase
          .from('email_logs')
          .insert({
            to_email: data.userEmail,
            subject: subject,
            html_content: htmlContent,
            text_content: `Welcome to Quely AI! Your ${data.planName} is now active. Credits: ${data.credits.posts} posts, ${data.credits.enhancements} enhancements.`,
            email_type: 'welcome',
            status: 'sent',
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (emailLogError) {
          console.error('❌ Failed to log welcome email:', emailLogError);
        }

        return { success: true, message: 'Welcome email sent successfully', emailId: result.id };
      } catch (resendError) {
        console.error('❌ Resend welcome email error:', resendError);
        
        // Fallback: Log email for manual sending
        const { error: emailLogError } = await supabase
          .from('email_logs')
          .insert({
            to_email: data.userEmail,
            subject: subject,
            html_content: htmlContent,
            text_content: `Welcome to Quely AI! Your ${data.planName} is now active. Credits: ${data.credits.posts} posts, ${data.credits.enhancements} enhancements.`,
            email_type: 'welcome',
            status: 'failed',
            error_message: resendError instanceof Error ? resendError.message : 'Unknown error',
            created_at: new Date().toISOString()
          });

        return { success: false, error: resendError instanceof Error ? resendError.message : 'Welcome email sending failed' };
      }
    } else {
      // No Resend API key - log email for manual sending
      console.log('⚠️ No Resend API key found, logging welcome email for manual sending');
      
      const { error: emailLogError } = await supabase
        .from('email_logs')
        .insert({
          to_email: data.userEmail,
          subject: subject,
          html_content: htmlContent,
          text_content: `Welcome to Quely AI! Your ${data.planName} is now active. Credits: ${data.credits.posts} posts, ${data.credits.enhancements} enhancements.`,
          email_type: 'welcome',
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (emailLogError) {
        console.error('❌ Failed to log welcome email:', emailLogError);
        return { success: false, error: 'Failed to log welcome email' };
      }

      return { success: true, message: 'Welcome email logged for manual sending' };
    }

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
