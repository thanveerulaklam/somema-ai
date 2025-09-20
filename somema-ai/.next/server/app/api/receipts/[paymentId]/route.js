(()=>{var e={};e.id=2853,e.ids=[2853],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},27910:e=>{"use strict";e.exports=require("stream")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},34631:e=>{"use strict";e.exports=require("tls")},39727:()=>{},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},47990:()=>{},55511:e=>{"use strict";e.exports=require("crypto")},55591:e=>{"use strict";e.exports=require("https")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},63378:(e,t,a)=>{"use strict";a.r(t),a.d(t,{patchFetch:()=>f,routeModule:()=>l,serverHooks:()=>m,workAsyncStorage:()=>c,workUnitAsyncStorage:()=>u});var r={};a.r(r),a.d(r,{GET:()=>d});var n=a(96559),s=a(48088),i=a(37719),o=a(32190);let p=(0,a(66437).UU)("https://yfmypikqgegvookjzvyv.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY);async function d(e,{params:t}){try{let{paymentId:e}=await t;console.log("\uD83E\uDDFE Generating receipt for payment:",e);let{data:a,error:r}=await p.from("payments").select(`
        id,
        amount,
        currency,
        status,
        created_at,
        payment_orders!inner(
          order_id,
          plan_id,
          billing_cycle,
          amount,
          tax_amount,
          total_amount,
          user_id,
          user_profiles!inner(
            full_name,
            business_name,
            email
          )
        )
      `).eq("id",e).single();if(r||!a)return console.error("❌ Payment not found:",r),o.NextResponse.json({error:"Payment not found"},{status:404});let n=a.payment_orders?.[0],s=n?.user_profiles?.[0];if(!n||!s)return console.error("❌ Order or user data not found"),o.NextResponse.json({error:"Order or user data not found"},{status:404});let i={starter:{name:"Starter Plan",description:"Perfect for small businesses and creators"},growth:{name:"Growth Plan",description:"Ideal for growing businesses"},scale:{name:"Scale Plan",description:"For large-scale operations"},free:{name:"Free Plan",description:"Perfect for getting started"}}[n.plan_id]||{name:`${n.plan_id} Plan`,description:"Subscription plan"},d=n.amount,l=n.tax_amount||0,c=n.total_amount,u=a.currency,m="INR"===u?"₹":"USD"===u?"$":"EUR"===u?"€":"GBP"===u?"\xa3":u,f=`
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
                  <span class="info-value">${a.id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Order ID:</span>
                  <span class="info-value">${n.order_id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${new Date(a.created_at).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value">
                    <span class="status-badge">${a.status.toUpperCase()}</span>
                  </span>
                </div>
              </div>
              
              <div class="info-section">
                <h3>Customer Details</h3>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${s.business_name||s.full_name||"Customer"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${s.email}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Plan:</span>
                  <span class="info-value">${i.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Billing:</span>
                  <span class="info-value">${n.billing_cycle}</span>
                </div>
              </div>
            </div>

            <div class="amount-breakdown">
              <h3 style="margin-top: 0; color: #3B82F6;">Amount Breakdown</h3>
              <div class="amount-row">
                <span>Plan Amount:</span>
                <span>${m}${(d/("INR"===u?100:1)).toFixed(2)} ${u}</span>
              </div>
              ${l>0?`
                <div class="amount-row">
                  <span>GST (18%):</span>
                  <span>${m}${(l/("INR"===u?100:1)).toFixed(2)} ${u}</span>
                </div>
              `:""}
              <div class="amount-row total-row">
                <span>Total Amount:</span>
                <span>${m}${(c/("INR"===u?100:1)).toFixed(2)} ${u}</span>
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
    `;return new o.NextResponse(f,{headers:{"Content-Type":"text/html","Cache-Control":"no-cache, no-store, must-revalidate",Pragma:"no-cache",Expires:"0"}})}catch(e){return console.error("❌ Receipt generation error:",e),o.NextResponse.json({error:"Failed to generate receipt",details:e.message},{status:500})}}let l=new n.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/receipts/[paymentId]/route",pathname:"/api/receipts/[paymentId]",filename:"route",bundlePath:"app/api/receipts/[paymentId]/route"},resolvedPagePath:"/Users/thanveerulaklam/Desktop/Projects/Somema/somema-ai/app/api/receipts/[paymentId]/route.ts",nextConfigOutput:"",userland:r}),{workAsyncStorage:c,workUnitAsyncStorage:u,serverHooks:m}=l;function f(){return(0,i.patchFetch)({workAsyncStorage:c,workUnitAsyncStorage:u})}},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},91645:e=>{"use strict";e.exports=require("net")},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[4447,580,6437],()=>a(63378));module.exports=r})();