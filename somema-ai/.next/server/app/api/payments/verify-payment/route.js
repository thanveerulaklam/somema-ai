(()=>{var e={};e.id=5788,e.ids=[5788],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8805:(e,t,r)=>{"use strict";function a(e,t){let r=new Date(e);return"monthly"===t?(r.setMonth(r.getMonth()+1),r.getDate()!==e.getDate()&&r.setDate(0)):"yearly"===t&&(r.setFullYear(r.getFullYear()+1),r.getDate()!==e.getDate()&&r.setDate(0)),r.toISOString()}r.d(t,{$A:()=>a})},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},12412:e=>{"use strict";e.exports=require("assert")},21820:e=>{"use strict";e.exports=require("os")},27910:e=>{"use strict";e.exports=require("stream")},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},34631:e=>{"use strict";e.exports=require("tls")},39727:()=>{},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},47990:()=>{},55511:e=>{"use strict";e.exports=require("crypto")},55591:e=>{"use strict";e.exports=require("https")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},83997:e=>{"use strict";e.exports=require("tty")},91645:e=>{"use strict";e.exports=require("net")},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{},99870:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>P,routeModule:()=>v,serverHooks:()=>E,workAsyncStorage:()=>I,workUnitAsyncStorage:()=>S});var a={};r.r(a),r.d(a,{POST:()=>_});var n=r(96559),o=r(48088),s=r(37719),i=r(32190),c=r(55511),l=r.n(c),d=r(66437),u=r(8805);let m=(0,d.UU)("https://yfmypikqgegvookjzvyv.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function p(e){try{console.log("\uD83D\uDCE7 Sending payment confirmation email to:",e.userEmail);let t="INR"===e.currency?e.amount/100:e.amount,r="INR"===e.currency?"₹":"USD"===e.currency?"$":"EUR"===e.currency?"€":"GBP"===e.currency?"\xa3":e.currency,a=`Payment Confirmation - ${e.planName} Plan`,n=`
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
          <h2>Hello ${e.userName}!</h2>
          
          <p>Your payment has been processed successfully. Here are the details:</p>
          
          <div class="plan-details">
            <h3>${e.planName} Plan</h3>
            <div class="amount">${r}${t.toFixed(2)} ${e.currency}</div>
            <p><strong>Billing Cycle:</strong> ${e.billingCycle}</p>
            <p><strong>Payment ID:</strong> ${e.paymentId}</p>
            <p><strong>Order ID:</strong> ${e.orderId}</p>
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://www.quely.ai"}/dashboard" class="cta-button">
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
    `,o=`
      Payment Confirmation - ${e.planName} Plan
      
      Hello ${e.userName}!
      
      Your payment has been processed successfully.
      
      Plan: ${e.planName}
      Amount: ${r}${t.toFixed(2)} ${e.currency}
      Billing Cycle: ${e.billingCycle}
      Payment ID: ${e.paymentId}
      Order ID: ${e.orderId}
      
      Your plan is now active and credits have been added to your account.
      
      Go to your dashboard: ${process.env.NEXT_PUBLIC_APP_URL||"https://www.quely.ai"}/dashboard
      
      If you have any questions, please contact our support team.
      
      Best regards,
      Quely AI Team
    `;if(console.log("\uD83D\uDCE7 Email content prepared:",{to:e.userEmail,subject:a,htmlLength:n.length,textLength:o.length}),process.env.RESEND_API_KEY)try{let t=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:"Quely AI <noreply@quely.ai>",to:[e.userEmail],subject:a,html:n,text:o})});if(!t.ok){let e=await t.json();throw Error(`Resend API error: ${e.message}`)}let r=await t.json();console.log("✅ Email sent via Resend:",r.id);let{error:s}=await m.from("email_logs").insert({to_email:e.userEmail,subject:a,html_content:n,text_content:o,email_type:"payment_confirmation",status:"sent",sent_at:new Date().toISOString(),created_at:new Date().toISOString()});return s&&console.error("❌ Failed to log email:",s),{success:!0,message:"Email sent successfully",emailId:r.id}}catch(r){console.error("❌ Resend email error:",r);let{error:t}=await m.from("email_logs").insert({to_email:e.userEmail,subject:a,html_content:n,text_content:o,email_type:"payment_confirmation",status:"failed",error_message:r instanceof Error?r.message:"Unknown error",created_at:new Date().toISOString()});return{success:!1,error:r instanceof Error?r.message:"Email sending failed"}}{console.log("⚠️ No Resend API key found, logging email for manual sending");let{error:t}=await m.from("email_logs").insert({to_email:e.userEmail,subject:a,html_content:n,text_content:o,email_type:"payment_confirmation",status:"pending",created_at:new Date().toISOString()});if(t)return console.error("❌ Failed to log email:",t),{success:!1,error:"Failed to log email"};return{success:!0,message:"Email logged for manual sending"}}}catch(e){return console.error("❌ Error sending payment confirmation email:",e),{success:!1,error:e instanceof Error?e.message:"Unknown error"}}}async function y(e){try{console.log("\uD83D\uDCE7 Sending welcome email to:",e.userEmail);let t=`Welcome to Quely AI - ${e.planName} Plan`,r=`
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
          <p>Your ${e.planName} is now active</p>
        </div>
        
        <div class="content">
          <h2>Hello ${e.userName}!</h2>
          
          <p>Welcome to Quely AI! Your subscription is now active and you're ready to create amazing content.</p>
          
          <div class="credits">
            <h3>Your Credits</h3>
            <p><strong>Post Generations:</strong> ${e.credits.posts}</p>
            <p><strong>Image Enhancements:</strong> ${e.credits.enhancements}</p>
          </div>

          <h3>Getting Started</h3>
          <ol>
            <li>Upload your images and videos to the media library</li>
            <li>Generate AI-powered social media posts</li>
            <li>Schedule and publish to your social accounts</li>
            <li>Track your performance with analytics</li>
          </ol>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://www.quely.ai"}/dashboard" class="cta-button">
              Start Creating Content
            </a>
          </div>

          <p>Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL||"https://www.quely.ai"}/tutorial">tutorial</a> or contact our support team.</p>
        </div>

        <div class="footer">
          <p>Thank you for choosing Quely AI!</p>
          <p>Happy creating! 🚀</p>
        </div>
      </body>
      </html>
    `;if(process.env.RESEND_API_KEY)try{let a=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:"Quely AI <noreply@quely.ai>",to:[e.userEmail],subject:t,html:r,text:`Welcome to Quely AI! Your ${e.planName} is now active. Credits: ${e.credits.posts} posts, ${e.credits.enhancements} enhancements.`})});if(!a.ok){let e=await a.json();throw Error(`Resend API error: ${e.message}`)}let n=await a.json();console.log("✅ Welcome email sent via Resend:",n.id);let{error:o}=await m.from("email_logs").insert({to_email:e.userEmail,subject:t,html_content:r,text_content:`Welcome to Quely AI! Your ${e.planName} is now active. Credits: ${e.credits.posts} posts, ${e.credits.enhancements} enhancements.`,email_type:"welcome",status:"sent",sent_at:new Date().toISOString(),created_at:new Date().toISOString()});return o&&console.error("❌ Failed to log welcome email:",o),{success:!0,message:"Welcome email sent successfully",emailId:n.id}}catch(n){console.error("❌ Resend welcome email error:",n);let{error:a}=await m.from("email_logs").insert({to_email:e.userEmail,subject:t,html_content:r,text_content:`Welcome to Quely AI! Your ${e.planName} is now active. Credits: ${e.credits.posts} posts, ${e.credits.enhancements} enhancements.`,email_type:"welcome",status:"failed",error_message:n instanceof Error?n.message:"Unknown error",created_at:new Date().toISOString()});return{success:!1,error:n instanceof Error?n.message:"Welcome email sending failed"}}{console.log("⚠️ No Resend API key found, logging welcome email for manual sending");let{error:a}=await m.from("email_logs").insert({to_email:e.userEmail,subject:t,html_content:r,text_content:`Welcome to Quely AI! Your ${e.planName} is now active. Credits: ${e.credits.posts} posts, ${e.credits.enhancements} enhancements.`,email_type:"welcome",status:"pending",created_at:new Date().toISOString()});if(a)return console.error("❌ Failed to log welcome email:",a),{success:!1,error:"Failed to log welcome email"};return{success:!0,message:"Welcome email logged for manual sending"}}}catch(e){return console.error("❌ Error sending welcome email:",e),{success:!1,error:e instanceof Error?e.message:"Unknown error"}}}let g=(0,d.UU)("https://yfmypikqgegvookjzvyv.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function _(e){try{let t;console.log("\uD83D\uDD0D Payment verification request received");let{razorpay_order_id:a,razorpay_payment_id:n,razorpay_signature:o}=await e.json();if(console.log("\uD83D\uDCCB Payment verification data:",{orderId:a,paymentId:n,signature:o?.substring(0,20)+"..."}),!a||!n||!o)return console.error("❌ Missing required payment parameters"),i.NextResponse.json({error:"Missing required payment parameters"},{status:400});if(!process.env.RAZORPAY_KEY_SECRET)return console.error("❌ Razorpay credentials not configured"),i.NextResponse.json({error:"Payment service not configured"},{status:500});console.log("✅ Razorpay credentials are configured");let s=a+"|"+n,c=l().createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(s.toString()).digest("hex");if(console.log("\uD83D\uDD10 Signature verification:",{expectedSignature:c.substring(0,20)+"...",receivedSignature:o.substring(0,20)+"...",match:c===o}),c!==o)return console.error("❌ Payment signature verification failed",{orderId:a,paymentId:n,expectedSignature:c.substring(0,20)+"...",receivedSignature:o.substring(0,20)+"...",body:s}),i.NextResponse.json({error:"Invalid payment signature"},{status:400});console.log("✅ Payment signature verified successfully");let d=new(r(95457))({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET});try{if(console.log("\uD83D\uDD04 Fetching payment details from Razorpay API..."),t=await d.payments.fetch(n),console.log("\uD83D\uDCCA Payment details from Razorpay:",{id:t.id,status:t.status,amount:t.amount,currency:t.currency,method:t.method}),"captured"!==t.status&&"authorized"!==t.status)return console.error("❌ Payment not captured or authorized",{status:t.status,paymentId:n}),i.NextResponse.json({error:"Payment not completed",details:`Payment status: ${t.status}`},{status:400});console.log("✅ Payment verified with Razorpay API:",{paymentId:n,status:t.status,amount:t.amount})}catch(e){return console.error("❌ Razorpay API verification failed:",{error:e.message,paymentId:n,stack:e.stack}),i.NextResponse.json({error:"Payment verification failed",details:e.message},{status:400})}console.log("\uD83D\uDD0D Looking up order in database:",a);let{data:u,error:m}=await g.from("payment_orders").select("*").eq("order_id",a).single();if(m)return console.error("❌ Database error while fetching order:",m),i.NextResponse.json({error:"Database error",details:m.message},{status:500});if(!u)return console.error("❌ Order not found in database:",a),i.NextResponse.json({error:"Order not found",details:`Order ID: ${a}`},{status:404});console.log("✅ Order found in database:",{orderId:u.order_id,planId:u.plan_id,amount:u.amount,status:u.status});let{error:_}=await g.from("payment_orders").update({payment_id:n,status:"paid",updated_at:new Date().toISOString()}).eq("order_id",a);if(_)return console.error("Order update error:",_),i.NextResponse.json({error:"Failed to update order"},{status:500});let v=u.plan_id.startsWith("enhancement-");v?await h(u):"free"===u.plan_id?await b(u):await f(u);let I=u.amount+(u.tax_amount||0);if(t.amount!==I)return console.error("Amount mismatch:",{orderBaseAmount:u.amount,orderTaxAmount:u.tax_amount||0,expectedTotalAmount:I,paymentAmount:t.amount}),i.NextResponse.json({error:"Payment amount mismatch",details:`Expected: ${I}, Received: ${t.amount}`},{status:400});console.log("✅ Payment amount verification passed:",{baseAmount:u.amount,taxAmount:u.tax_amount||0,totalAmount:I,paymentAmount:t.amount}),console.log("\uD83D\uDCCA Payment details with tax:",{amount:t.amount,tax_amount:t.tax_amount,total_amount:t.amount+(t.tax_amount||0)});let{error:S}=await g.from("payments").insert({payment_id:n,order_id:a,user_id:u.user_id,plan_id:u.plan_id,amount:u.amount,tax_amount:t.tax_amount||0,total_amount:t.amount+(t.tax_amount||0),currency:u.currency,status:"captured",payment_type:v?"topup":"subscription",tax_details:t.tax_details||{},created_at:new Date().toISOString()});if(S&&console.error("Payment record error:",S),!v&&"free"!==u.plan_id)try{console.log("\uD83E\uDDFE Creating invoice after successful payment..."),await x(u,t)}catch(e){console.error("Invoice creation error:",e)}try{console.log("\uD83D\uDCE7 Sending email notifications...");let{data:e,error:r}=await g.auth.admin.getUserById(u.user_id);if(!r&&e.user){let r=e.user,o=r.email||"",s=r.user_metadata?.full_name||r.user_metadata?.business_name||o.split("@")[0],i={starter:"Starter",growth:"Growth",scale:"Scale",free:"Free"}[u.plan_id]||u.plan_id;if(await p({userEmail:o,userName:s,planName:`${i} Plan`,amount:t.amount,currency:u.currency,paymentId:n,orderId:a,billingCycle:u.billing_cycle,isIndianVisitor:"INR"===u.currency}),!v&&"free"!==u.plan_id){let e=w(u.plan_id);await y({userEmail:o,userName:s,planName:`${i} Plan`,credits:{posts:e.posts,enhancements:e.enhancements}})}console.log("✅ Email notifications sent successfully")}else console.error("❌ Failed to get user details for email:",r)}catch(e){console.error("❌ Email notification error:",e)}return console.log("\uD83C\uDF89 Payment verification completed successfully!"),i.NextResponse.json({success:!0,message:v?"Top-up purchase successful!":"Payment verified and subscription activated",paymentId:n,orderId:a,planId:u.plan_id,amount:t.amount})}catch(e){return console.error("❌ Payment verification error:",{error:e.message,stack:e.stack,name:e.name}),i.NextResponse.json({error:"Payment verification failed",details:e.message},{status:500})}}async function f(e){let t=w(e.plan_id),{error:r}=await g.from("user_profiles").upsert({user_id:e.user_id,subscription_plan:e.plan_id,subscription_status:"active",subscription_start_date:new Date().toISOString(),subscription_end_date:(0,u.$A)(new Date,e.billing_cycle),billing_cycle:e.billing_cycle,post_generation_credits:t.posts,image_enhancement_credits:t.enhancements,media_storage_limit:t.storage,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(r)throw console.error("User subscription update error:",r),Error("Failed to update user subscription");let{error:a}=await g.from("subscriptions").insert({user_id:e.user_id,plan_id:e.plan_id,status:"active",current_start_date:new Date().toISOString(),current_end_date:(0,u.$A)(new Date,e.billing_cycle),amount:e.amount,currency:e.currency,billing_cycle:e.billing_cycle,updated_at:new Date().toISOString()});a&&console.error("Subscription record error:",a)}async function h(e){let{data:t,error:r}=await g.from("user_profiles").select("image_enhancement_credits").eq("user_id",e.user_id).single();if(r)throw console.error("User fetch error:",r),Error("Failed to fetch user data");let a=0;switch(e.plan_id){case"enhancement-25":a=25;break;case"enhancement-100":a=100;break;case"enhancement-250":a=250;break;default:throw Error("Invalid top-up plan")}let n=(t?.image_enhancement_credits||0)+a,{error:o}=await g.from("user_profiles").upsert({user_id:e.user_id,image_enhancement_credits:n,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(o)throw console.error("User credits update error:",o),Error("Failed to update user credits");let{error:s}=await g.from("top_ups").insert({user_id:e.user_id,top_up_type:e.plan_id,credits_added:a,amount:e.amount,currency:e.currency,status:"captured",created_at:new Date().toISOString()});s&&console.error("Top-up record error:",s)}function w(e){return({free:{posts:15,enhancements:3,storage:50},starter:{posts:100,enhancements:30,storage:5e8},growth:{posts:300,enhancements:100,storage:-1},scale:{posts:1e3,enhancements:500,storage:-1}})[e]||{posts:0,enhancements:0,storage:0}}async function b(e){let{error:t}=await g.from("user_profiles").upsert({user_id:e.user_id,subscription_plan:"free",subscription_status:"active",subscription_start_date:new Date().toISOString(),subscription_end_date:new Date(Date.now()+2592e6).toISOString(),post_generation_credits:15,image_enhancement_credits:3,media_storage_limit:5e7,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(t)throw console.error("User free plan update error:",t),Error("Failed to activate free plan");let{error:r}=await g.from("subscriptions").upsert({user_id:e.user_id,plan_id:"free",status:"active",current_start_date:new Date().toISOString(),current_end_date:new Date(Date.now()+2592e6).toISOString(),amount:0,currency:"USD",billing_cycle:"monthly",updated_at:new Date().toISOString()},{onConflict:"user_id"});r&&console.error("Free plan subscription record error:",r)}async function x(e,t){try{let{data:a,error:n}=await g.auth.admin.getUserById(e.user_id);if(n||!a.user)throw Error("User not found for invoice creation");let o=a.user,{data:s}=await g.from("user_profiles").select("business_name, business_type, gst_number, address").eq("user_id",e.user_id).single(),i={starter:{name:"Starter Plan",priceINR:{monthly:999,yearly:9990},priceUSD:{monthly:29,yearly:290}},growth:{name:"Growth Plan",priceINR:{monthly:2499,yearly:24990},priceUSD:{monthly:79,yearly:790}},scale:{name:"Scale Plan",priceINR:{monthly:8999,yearly:89990},priceUSD:{monthly:199,yearly:1990}}}[e.plan_id];if(!i)throw Error("Invalid plan for invoice creation");let c="INR"===e.currency,l=c?i.priceINR[e.billing_cycle]:i.priceUSD[e.billing_cycle],d=c?Math.round(.18*l):0,u=l+d,m=`INV-${Date.now()}-${Math.random().toString(36).substring(2,8).toUpperCase()}`,p={name:s?.business_name||o.user_metadata?.full_name||o.email?.split("@")[0]||"Customer",email:o.email||"",contact:o.phone||"",gstin:s?.gst_number||"",billing_address:s?.address?{line1:s.address,city:"City",state:"State",country:c?"IN":"US",zipcode:"000000"}:void 0},y=[{name:`${i.name} - ${e.billing_cycle} subscription`,description:`Subscription for ${i.name} (${e.billing_cycle})`,amount:l,currency:e.currency,quantity:1}];d>0&&y.push({name:"GST (18%)",description:"Goods and Services Tax",amount:d,currency:e.currency,quantity:1});let _={type:"invoice",description:`Subscription for ${i.name}`,partial_payment:!1,customer:p,line_items:y,currency:e.currency,receipt:m,notes:{plan_id:e.plan_id,billing_cycle:e.billing_cycle,payment_id:t.id,order_id:e.order_id,gst_applied:d>0?"true":"false",user_id:e.user_id,business_name:s?.business_name||o.user_metadata?.full_name}};console.log("\uD83D\uDCCB Creating Razorpay invoice with data:",_);let f=new(r(95457))({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET}),h=await f.invoices.create(_),{error:w}=await g.from("invoices").insert({invoice_id:h.id,invoice_number:m,user_id:e.user_id,plan_id:e.plan_id,billing_cycle:e.billing_cycle,amount:l,tax_amount:d,total_amount:u,currency:e.currency,status:"paid",payment_id:t.id,order_id:e.order_id,customer_details:p,line_items:y,razorpay_invoice_data:h,created_at:new Date().toISOString(),paid_at:new Date().toISOString()});if(w)throw console.error("Invoice database insert error:",w),Error("Failed to save invoice to database");return console.log("✅ Invoice created successfully:",h.id),h}catch(e){throw console.error("Invoice creation error:",e),e}}let v=new n.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/payments/verify-payment/route",pathname:"/api/payments/verify-payment",filename:"route",bundlePath:"app/api/payments/verify-payment/route"},resolvedPagePath:"/Users/thanveerulaklam/Desktop/Projects/Somema/somema-ai/app/api/payments/verify-payment/route.ts",nextConfigOutput:"",userland:a}),{workAsyncStorage:I,workUnitAsyncStorage:S,serverHooks:E}=v;function P(){return(0,s.patchFetch)({workAsyncStorage:I,workUnitAsyncStorage:S})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[4447,580,6437,139,5457],()=>r(99870));module.exports=a})();