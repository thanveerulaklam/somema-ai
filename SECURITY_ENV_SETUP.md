# 🔐 SECURE Environment Variables Setup

## ⚠️ CRITICAL SECURITY NOTICE

**NEVER** use `NEXT_PUBLIC_` prefix for sensitive API keys. This exposes them to the client-side and creates security vulnerabilities.

## Required Environment Variables

### 🔑 Authentication & Database
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com
```

### 🤖 AI Services (SERVER-SIDE ONLY)
```env
# OpenAI API Key (for GPT-4o and DALL-E)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Replicate API Key (for Stable Diffusion)
REPLICATE_API_KEY=your_replicate_api_key_here

# Remove.bg API Key
REMOVE_BG_API_KEY=your_remove_bg_api_key_here

# Canva API Key
CANVA_API_KEY=your_canva_api_key_here
```

### 💳 Payment Services
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Stripe Configuration (if using)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 📱 Social Media APIs
```env
# Meta/Facebook Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-domain.com/api/meta/oauth
```

### 🔧 System Configuration
```env
# Cron Job Security
CRON_SECRET=your_secure_random_string_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🚨 Security Best Practices

### 1. **Never Expose Sensitive Keys**
- ❌ `NEXT_PUBLIC_OPENAI_API_KEY` (exposed to client)
- ✅ `OPENAI_API_KEY` (server-side only)

### 2. **Use Strong Secrets**
```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For CRON_SECRET
```

### 3. **Environment-Specific Configuration**
- **Development**: Use `.env.local`
- **Production**: Set in Vercel dashboard
- **Never commit**: `.env.local` to git

### 4. **Regular Rotation**
- Rotate API keys monthly
- Update secrets quarterly
- Monitor for unauthorized usage

## 🔍 Verification Checklist

Before deploying to production:

- [ ] All sensitive keys use server-side only (no `NEXT_PUBLIC_`)
- [ ] `CRON_SECRET` is set and secure
- [ ] All API keys are valid and have proper permissions
- [ ] Webhook secrets are configured
- [ ] Database connection strings are secure
- [ ] No hardcoded secrets in code

## 🛡️ Production Deployment

### Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables
3. Set environment to "Production"
4. Redeploy your application

### Security Headers
The application now includes:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

## 🚨 Emergency Response

If you suspect a security breach:

1. **Immediately rotate all API keys**
2. **Check access logs for unauthorized usage**
3. **Update all secrets and passwords**
4. **Review and audit all environment variables**
5. **Monitor for unusual activity**

## 📞 Support

For security concerns or questions:
- Review this documentation
- Check Vercel security best practices
- Consult with security experts if needed
