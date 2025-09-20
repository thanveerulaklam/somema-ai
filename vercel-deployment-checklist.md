# Vercel Deployment Checklist

## Environment Variables to Set in Vercel

### Required Environment Variables
```bash
# Meta App Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-domain.vercel.app/api/meta/oauth

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Other Required Variables
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Optional Environment Variables
```bash
# For additional features
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Meta App Configuration for Production

### 1. Add Production Redirect URI
- Go to Meta for Developers → Your App → Facebook Login → Settings
- Add to **Valid OAuth Redirect URIs**:
  ```
  https://your-domain.vercel.app/api/meta/oauth
  ```

### 2. Add Production Domain
- Go to App Settings → Basic → App Domains
- Add your Vercel domain:
  ```
  your-domain.vercel.app
  ```

### 3. Check App Mode
- For production, make sure your app is in **Live** mode
- Or keep it in **Development** mode if you're still testing

## Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Fix: Comprehensive page and Instagram account discovery"
git push origin main
```

### 2. Deploy to Vercel
- Vercel will automatically deploy when you push to main
- Or manually trigger deployment from Vercel dashboard

### 3. Set Environment Variables
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all the required environment variables listed above

### 4. Test Production OAuth
- Go to your production URL: `https://your-domain.vercel.app/settings`
- Click "Connect Meta Account"
- Verify OAuth flow works
- Test page discovery functionality

## Post-Deployment Testing

### 1. OAuth Flow Test
- ✅ OAuth redirect works
- ✅ All pages are discovered
- ✅ All Instagram accounts are found
- ✅ Debug button works

### 2. Edge Cases
- ✅ Test with accounts having >100 pages
- ✅ Test with Business Manager pages
- ✅ Test with multiple Instagram accounts

### 3. Performance
- ✅ OAuth flow completes within reasonable time
- ✅ Page discovery doesn't timeout
- ✅ Debug output is comprehensive

## Troubleshooting Production Issues

### Common Issues

1. **"Redirect URI not whitelisted"**
   - Double-check the production redirect URI in Meta app settings
   - Make sure it matches exactly: `https://your-domain.vercel.app/api/meta/oauth`

2. **"Environment variables not found"**
   - Check all environment variables are set in Vercel
   - Verify variable names match exactly

3. **"OAuth flow fails"**
   - Check Meta app is in correct mode (Development/Live)
   - Verify all permissions are active
   - Check app domain is added

4. **"Pages not discovered"**
   - Use debug button to check discovery methods
   - Verify access token has correct permissions
   - Check console logs for errors

## Monitoring

After deployment, monitor:
- OAuth success rate
- Page discovery success rate
- Error rates in Vercel logs
- User feedback on missing pages/accounts

## Rollback Plan

If issues occur:
1. Check Vercel deployment logs
2. Use debug button to identify issues
3. Rollback to previous deployment if needed
4. Fix issues and redeploy
