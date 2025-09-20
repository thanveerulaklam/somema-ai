# Google OAuth Setup Guide for Somema.ai

## Step 1: Configure Google OAuth in Supabase

### 1.1 Go to Supabase Dashboard
1. Navigate to your Supabase project dashboard
2. Go to **Authentication** → **Providers**
3. Find **Google** in the list and click on it

### 1.2 Enable Google Provider
1. Toggle the **Enable** switch to turn on Google authentication
2. You'll need to provide Google OAuth credentials

## Step 2: Create Google OAuth Credentials

### 2.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (if not already enabled)

### 2.2 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Set the following:
   - **Name**: `Somema.ai OAuth Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-domain.com/auth/callback` (for production)
     - `https://your-project-ref.supabase.co/auth/v1/callback` (Supabase callback)

### 2.3 Copy Credentials
1. After creating, you'll get a **Client ID** and **Client Secret**
2. Copy these values

## Step 3: Configure Supabase with Google Credentials

### 3.1 Add Credentials to Supabase
1. Go back to your Supabase dashboard
2. In the Google provider settings, enter:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
3. Save the configuration

### 3.2 Test the Configuration
1. Try logging in with Google from your application
2. Check the Supabase logs for any errors

## Step 4: Environment Variables

Make sure your `.env.local` file includes:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Other configurations...
```

## Step 5: Verify Setup

### 5.1 Test Google Login
1. Start your development server: `npm run dev`
2. Go to `/login` or `/signup`
3. Click "Sign in with Google" or "Sign up with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to your app

### 5.2 Common Issues and Solutions

#### Issue: "Invalid redirect URI"
- **Solution**: Make sure the redirect URI in Google Cloud Console matches exactly with your Supabase callback URL

#### Issue: "OAuth provider not configured"
- **Solution**: Ensure Google provider is enabled in Supabase Authentication settings

#### Issue: "Client ID not found"
- **Solution**: Verify the Client ID and Client Secret are correctly entered in Supabase

## Step 6: Production Deployment

### 6.1 Update Redirect URIs
When deploying to production:
1. Update the **Authorized redirect URIs** in Google Cloud Console
2. Add your production domain URLs
3. Update the redirect URIs in Supabase if needed

### 6.2 Environment Variables
Ensure your production environment has the correct Supabase configuration.

## Troubleshooting

### Check Supabase Logs
1. Go to Supabase Dashboard → **Logs**
2. Look for authentication-related errors
3. Check the **Auth** tab for specific OAuth errors

### Test with Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Check auth configuration
supabase auth list
```

### Common Error Messages

1. **"redirect_uri_mismatch"**
   - The redirect URI in your request doesn't match the authorized redirect URIs in Google Cloud Console

2. **"invalid_client"**
   - The client ID or client secret is incorrect

3. **"access_denied"**
   - User denied the OAuth consent

4. **"state_mismatch"**
   - OAuth state parameter mismatch (usually handled automatically by Supabase)

## Security Best Practices

1. **Never expose Client Secret** in client-side code
2. **Use HTTPS** in production
3. **Regularly rotate** OAuth credentials
4. **Monitor OAuth usage** in Google Cloud Console
5. **Set up proper error handling** in your application

## Additional Configuration

### Custom OAuth Scopes
If you need additional user information, you can configure custom scopes in Supabase:

1. Go to Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Add custom scopes like:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### User Profile Mapping
Supabase automatically maps Google profile data to user metadata. You can access it in your application:

```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log(user?.user_metadata) // Contains Google profile data
```

This setup will enable seamless Google OAuth authentication for your Somema.ai application. 