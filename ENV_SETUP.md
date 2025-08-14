# Environment Variables Setup Guide

## Step 1: Create .env.local file

Create a `.env.local` file in the root of your project with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI API Key (for GPT-4o and CLIP image analysis)
# Note: This should be server-side only, not exposed to the client
OPENAI_API_KEY=your_openai_api_key_here

# Remove.bg API Key (for background removal)
REMOVE_BG_API_KEY=your_remove_bg_api_key_here

# Replicate API Key (for Stable Diffusion image generation)
REPLICATE_API_KEY=your_replicate_api_key_here

# Anthropic API Key (for Claude Haiku)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google AI API Key (for Gemini Pro)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Canva API Key (for template customization)
CANVA_API_KEY=your_canva_api_key_here

# Stripe Configuration (for billing)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Meta API Configuration (for Facebook/Instagram posting)
# Note: These are obtained through Meta App setup and user authorization
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_ACCESS_TOKEN=your_meta_access_token_here

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Payment Provider API Keys

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Step 2: Get Your Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the following keys:
   - **Project URL** → `