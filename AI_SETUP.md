# AI Services Setup Guide

This guide will help you configure the AI services integration for Somema.ai.

## Required API Keys

You'll need to obtain API keys from the following services:

### 1. OpenAI API
- **Purpose**: GPT-4 for caption generation and DALL-E 3 for image generation
- **Get API Key**: https://platform.openai.com/api-keys
- **Cost**: Pay-per-use (GPT-4 ~$0.03/1K tokens, DALL-E 3 ~$0.04/image)

### 2. Anthropic Claude API
- **Purpose**: Claude Haiku for hashtag suggestions
- **Get API Key**: https://console.anthropic.com/
- **Cost**: Pay-per-use (~$0.25/1M input tokens, ~$1.25/1M output tokens)

### 3. Canva API (Optional)
- **Purpose**: Template customization and design generation
- **Get API Key**: https://www.canva.dev/
- **Cost**: Varies by plan

## Environment Variables Setup

Add these variables to your `.env.local` file:

```env
# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Anthropic Claude API Configuration
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key

# Canva API Configuration (optional)
NEXT_PUBLIC_CANVA_API_KEY=your_canva_api_key
```

## API Key Setup Instructions

### OpenAI API Setup
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env.local`
5. Add billing information to your OpenAI account

### Anthropic Claude Setup
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local`
6. Add billing information to your Anthropic account

### Canva API Setup (Optional)
1. Go to https://www.canva.dev/
2. Sign in with your Canva account
3. Create a new app
4. Generate API credentials
5. Copy the key and add it to your `.env.local`

## Testing the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test AI Generation**:
   - Go to your app and click "Create Post"
   - Choose "Single Post"
   - Fill in the business context
   - Click "Generate Content"
   - You should see real AI-generated content

3. **Check Console for Errors**:
   - Open browser developer tools
   - Look for any API errors in the console
   - Verify API keys are working correctly

## Fallback Behavior

If any AI service is unavailable or fails:
- The system will automatically fall back to high-quality mock content
- Users will still get generated content, just not from the AI services
- Error messages will be logged to the console for debugging

## Cost Optimization

### OpenAI API
- GPT-4 is more expensive but higher quality
- Consider using GPT-3.5-turbo for testing
- Monitor usage in OpenAI dashboard

### Anthropic Claude
- Claude Haiku is very cost-effective
- Good for hashtag generation
- Monitor usage in Anthropic console

### Rate Limiting
- Implement rate limiting for production use
- Add usage tracking and limits
- Consider caching generated content

## Production Deployment

For production deployment:

1. **Environment Variables**: Set all API keys in your hosting platform (Vercel, Netlify, etc.)

2. **Rate Limiting**: Implement rate limiting to control costs

3. **Error Handling**: Add proper error handling and user feedback

4. **Monitoring**: Set up monitoring for API usage and costs

5. **Caching**: Implement caching for generated content

## Troubleshooting

### Common Issues

1. **"API key not configured" error**:
   - Check that your `.env.local` file exists
   - Verify API key names are correct
   - Restart your development server

2. **"OpenAI API error"**:
   - Check your OpenAI API key is valid
   - Verify you have billing set up
   - Check API usage limits

3. **"Anthropic API error"**:
   - Check your Anthropic API key is valid
   - Verify you have billing set up
   - Check API usage limits

4. **Content not generating**:
   - Check browser console for errors
   - Verify all API keys are configured
   - Check network tab for failed requests

### Getting Help

- Check the browser console for detailed error messages
- Verify API keys are correctly formatted
- Test API keys directly in the respective platforms
- Check service status pages for any outages

## Next Steps

Once AI services are configured:

1. **Test all content types**: Single, Weekly, and Monthly generation
2. **Customize prompts**: Modify the prompt templates in `ai-services.ts`
3. **Add image generation**: Integrate DALL-E 3 for AI-generated images
4. **Add Canva integration**: Enable template customization
5. **Monitor costs**: Set up usage tracking and alerts 