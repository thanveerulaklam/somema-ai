exports.id=7774,exports.ids=[7774],exports.modules={28695:(e,t,o)=>{"use strict";o.d(t,{AC:()=>n,SW:()=>i,fX:()=>r});let s=process.env.OPENAI_API_KEY,a="https://api.openai.com/v1";process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,process.env.NEXT_PUBLIC_CANVA_API_KEY;process.env.BASE_URL;async function n(e,t){try{let o={"Content-Type":"application/json"};t&&(o.Authorization=t);let s=await fetch("/api/analyze-image",{method:"POST",headers:o,body:JSON.stringify({imageUrl:e})});if(!s.ok){let e=await s.json();if(402===s.status)throw Error(e.error||"No post generation credits remaining. Please upgrade your plan or purchase more credits.");throw Error(e.error||"Failed to analyze image")}return(await s.json()).analysis}catch(e){if(console.error("CLIP image analysis error:",e),e instanceof Error&&e.message.includes("credits"))throw e;throw Error("Failed to analyze image")}}async function i(e,t){try{let o={...t,customPrompt:`
        Create a social media caption for ${t.platform} about this specific product:
        
        IMAGE CONTENT: ${e.caption}
        PRODUCT TYPE: ${e.classification}
        PRODUCT TAGS: ${e.tags?.join(", ")||""}
        
        BUSINESS CONTEXT: ${t.businessContext}
        PLATFORM: ${t.platform}
        THEME: ${t.theme}
        ADDITIONAL CONTEXT: ${t.customPrompt||""}
        
        Requirements:
        - Focus specifically on the product shown in the image (${e.caption})
        - Use the actual product details from the image analysis
        - Make it engaging and relevant to the specific product
        - Include relevant emojis
        - Optimized for ${t.platform}
        - Keep it authentic and product-focused
      `},s={...t,customPrompt:`
        Generate hashtags for a ${t.platform} post about this specific product:
        
        PRODUCT: ${e.caption}
        PRODUCT TYPE: ${e.classification}
        PRODUCT TAGS: ${e.tags?.join(", ")||""}
        
        Requirements:
        - Use hashtags specific to the actual product shown
        - Include product-specific tags (e.g., #sneakers, #nike, #athletic)
        - Mix of popular and niche hashtags
        - Relevant to the product category
        - Optimized for ${t.platform}
      `},a={...t,customPrompt:`
        Create text elements for a social media visual about this specific product:
        
        PRODUCT: ${e.caption}
        PRODUCT TYPE: ${e.classification}
        PRODUCT TAGS: ${e.tags?.join(", ")||""}
        
        BUSINESS: ${t.businessContext}
        PLATFORM: ${t.platform}
        
        Generate three text elements in JSON format:
        {
          "headline": "Product-specific headline (e.g., 'Premium Sneakers', 'Stylish Handbag')",
          "subtext": "Brief description highlighting key features of the specific product",
          "cta": "Action-oriented text (e.g., 'Shop Now', 'Get Yours', 'Learn More')"
        }
        
        Requirements:
        - Headline should be specific to the product type
        - Subtext should mention actual product features
        - CTA should be relevant to the product category
        - All text should work together cohesively
      `};console.log("Starting content generation with analysis:",e);let[n,i,r]=await Promise.all([fetch("/api/generate-content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"caption",request:o})}),fetch("/api/generate-content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"hashtags",request:s})}),fetch("/api/generate-content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"textElements",request:a})})]);if(console.log("API Response Status:",{caption:n.status,hashtags:i.status,textElements:r.status}),!n.ok||!i.ok||!r.ok)throw console.error("API responses not ok:",{caption:n.status,hashtags:i.status,textElements:r.status}),Error("Failed to generate content");let[c,l,u]=await Promise.all([n.json(),i.json(),r.json()]);return console.log("Generated content data:",{captionData:c,hashtagsData:l,textElementsData:u}),{caption:c.result,hashtags:l.result,imagePrompt:e.caption,textElements:u.result}}catch(a){console.error("Error generating content from analyzed image:",a),console.log("Creating fallback content based on image analysis:",e);let t=`🔥 Check out these amazing ${e.classification}! ${e.caption} 💯`,o=e.tags.map(e=>e.replace(/\s+/g,"")).slice(0,8),s={headline:`${e.classification.charAt(0).toUpperCase()+e.classification.slice(1)}`,subtext:`Premium ${e.classification} for the modern lifestyle`,cta:"Shop Now"};return{caption:t,hashtags:o,imagePrompt:e.caption,textElements:s}}}async function r(e,t){if(!s)throw Error("OpenAI API key not configured");try{let o=e.classification?.toLowerCase()||"product";e.tags?.join(", ");let n=e.caption||"",i=n.includes("|"),r="";if(i){let o=n.split("|").map(e=>e.trim()).filter(Boolean);r=`You are a professional social media content creator. Based on the following analysis of a carousel (multi-image) Instagram post and the business profile, create:

1. A single engaging Instagram caption (2-3 sentences max) that describes the entire carousel and connects the images into a cohesive story.
2. Relevant hashtags (5-8 hashtags) for the whole carousel.

CAROUSEL IMAGES:
${o.map((e,t)=>`- Image ${t+1}: ${e}`).join("\n")}

TAGS: ${e.tags?.join(", ")||""}

BUSINESS PROFILE:
- Business Name: ${t.business_name}
- Industry: ${t.niche}
- Brand Tone: ${t.tone}
- Target Audience: ${t.audience}

IMPORTANT: Incorporate the business name "${t.business_name}" naturally into the caption. Make the content feel authentic to this specific business and its ${t.tone} tone. Target the ${t.audience} audience and focus on the ${t.niche} industry. Focus on the specific product details from the image analysis. Don't use generic phrases like "elevate your style" or "check out this amazing product" unless they're specifically relevant to the product shown. Respond in this exact JSON format:

{
  "caption": "Your engaging Instagram caption here",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`}else o.includes("shirt")||o.includes("dress")||o.includes("jacket")||o.includes("outerwear")||o.includes("casual")||o.includes("outfit"),r=`You are a professional social media content creator. Based on the following image analysis and business profile, create:

1. An engaging Instagram caption (2-3 sentences max)
2. Relevant hashtags (5-8 hashtags)

IMAGE ANALYSIS:
- Product: ${e.classification}
- Description: ${e.caption}
- Tags: ${e.tags?.join(", ")||""}
- Confidence: ${(100*e.confidence).toFixed(1)}%

BUSINESS PROFILE:
- Business Name: ${t.business_name}
- Industry: ${t.niche}
- Brand Tone: ${t.tone}
- Target Audience: ${t.audience}

IMPORTANT: Incorporate the business name "${t.business_name}" naturally into the caption. Make the content feel authentic to this specific business and its ${t.tone} tone. Target the ${t.audience} audience and focus on the ${t.niche} industry. Focus on the specific product details from the image analysis. Don't use generic phrases like "elevate your style" or "check out this amazing product" unless they're specifically relevant to the product shown. Respond in this exact JSON format:

{
  "caption": "Your engaging Instagram caption here",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;console.log("\uD83D\uDE80 Starting INSTAGRAM CONTENT generation..."),console.log("\uD83D\uDCCA Request details:"),console.log("  - Model: gpt-4o-mini"),console.log("  - Max tokens: 500"),console.log("  - Prompt length:",r.length,"characters"),console.log("  - Product type:",o),console.log("  - Is carousel:",i);let c=await fetch(`${a}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${s}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:"You are a professional social media content creator. Always respond with valid JSON format."},{role:"user",content:r}],max_tokens:500,temperature:.9})});if(console.log("\uD83D\uDCC8 OpenAI API Response Headers:"),console.log("  - Status:",c.status),console.log("  - X-Request-ID:",c.headers.get("x-request-id")),console.log("  - X-RateLimit-Limit:",c.headers.get("x-ratelimit-limit")),console.log("  - X-RateLimit-Remaining:",c.headers.get("x-ratelimit-remaining")),!c.ok){let e=await c.text();throw console.error("OpenAI API error response:",e),Error(`OpenAI API error: ${c.status} - ${e}`)}let l=await c.json();if(l.usage){console.log("\uD83D\uDCB0 INSTAGRAM CONTENT Generation Usage:"),console.log("  - Input tokens:",l.usage.prompt_tokens),console.log("  - Output tokens:",l.usage.completion_tokens),console.log("  - Total tokens:",l.usage.total_tokens);let e=l.usage.prompt_tokens/1e6*.15,t=l.usage.completion_tokens/1e6*.6,o=e+t;console.log("  - Input cost: $"+e.toFixed(6)),console.log("  - Output cost: $"+t.toFixed(6)),console.log("  - Total cost: $"+o.toFixed(6))}console.log("✅ INSTAGRAM CONTENT generation complete!");let u=l.choices[0].message.content.trim();try{let o=JSON.parse(u);return{caption:o.caption||`Amazing ${e.classification} from ${t.business_name}!`,hashtags:o.hashtags||e.tags.slice(0,5)}}catch(o){return console.error("Failed to parse JSON response, using fallback:",o),console.log("Raw content was:",u),{caption:`Check out these amazing ${e.classification} from ${t.business_name}! ${e.caption}`,hashtags:[...e.tags.slice(0,5),t.niche.toLowerCase().replace(/\s+/g,"")]}}}catch(o){return console.error("Error generating Instagram content from CLIP:",o),{caption:`Amazing ${e.classification} from ${t.business_name}! Don't miss out on this incredible product.`,hashtags:[...e.tags.slice(0,5),t.niche.toLowerCase().replace(/\s+/g,"")]}}}},39727:()=>{},47990:()=>{},49485:(e,t,o)=>{"use strict";o.d(t,{CX:()=>c,X2:()=>i,eM:()=>r});let s=(0,o(66437).UU)("https://yfmypikqgegvookjzvyv.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY),a=new Map;function n(e){return/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e)}async function i(e){try{if(!n(e))return console.error("❌ Invalid UUID format for admin check:",e),!1;let t=a.get(e);if(t&&Date.now()-t.timestamp<3e5)return console.log("\uD83D\uDD0D Using cached admin check for user:",e,"Result:",t.isAdmin),t.isAdmin;console.log("\uD83D\uDD0D Checking admin access for user:",e);let{data:o,error:i}=await s.rpc("get_user_admin_info",{user_uuid:e});if(i)return console.error("❌ Admin check error:",i),a.set(e,{isAdmin:!1,timestamp:Date.now()}),!1;if(!o||!Array.isArray(o)||0===o.length)return console.log("ℹ️ No admin info found for user:",e),a.set(e,{isAdmin:!1,timestamp:Date.now()}),!1;let r=o[0];if("boolean"!=typeof r.is_admin||"boolean"!=typeof r.is_active)return console.error("❌ Invalid admin data structure:",r),a.set(e,{isAdmin:!1,timestamp:Date.now()}),!1;let c=r.is_admin&&r.is_active;return console.log("✅ Admin check result:",{userId:e,isAdmin:c,role:r.role,isActive:r.is_active}),a.set(e,{isAdmin:c,timestamp:Date.now()}),c}catch(t){return console.error("❌ Error checking admin access:",t),a.set(e,{isAdmin:!1,timestamp:Date.now()}),!1}}async function r(e){return await i(e)}async function c(e){try{if(!n(e))return console.error("❌ Invalid UUID format for admin info check:",e),{isAdmin:!1};let{data:t,error:o}=await s.rpc("get_user_admin_info",{user_uuid:e});if(o||!t||!Array.isArray(t)||0===t.length)return{isAdmin:!1};let a=t[0];if("boolean"!=typeof a.is_admin||"boolean"!=typeof a.is_active)return console.error("❌ Invalid admin data structure:",a),{isAdmin:!1};return{isAdmin:a.is_admin&&a.is_active,role:a.role,permissions:a.permissions}}catch(e){return console.error("Error getting admin info:",e),{isAdmin:!1}}}},78335:()=>{},96487:()=>{}};