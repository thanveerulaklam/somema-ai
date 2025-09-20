# Scheduled Posts Setup - Cron Job Configuration

## Overview

To ensure scheduled posts are published at the exact scheduled time, you need to set up a cron job that runs the post scheduler API endpoint regularly.

## How Scheduled Posts Work

1. **User schedules a post** → Stored in database with `scheduled_time`
2. **Cron job runs every minute** → Checks for posts due for publishing
3. **Posts are published** → Using Instagram API with correct tokens
4. **Status updated** → Post marked as 'posted' or 'failed'

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended)

If you're using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/post-scheduler",
      "schedule": "* * * * *"
    }
  ]
}
```

This runs every minute and checks for scheduled posts.

### Option 2: External Cron Service

Use services like:
- **Cron-job.org** (free)
- **EasyCron** (paid)
- **SetCronJob** (free tier available)

**URL to call:**
```
https://your-app-name.vercel.app/api/cron/post-scheduler
```

**Schedule:** Every minute (`* * * * *`)

### Option 3: GitHub Actions (Free)

Create `.github/workflows/cron.yml`:

```yaml
name: Post Scheduler Cron

on:
  schedule:
    - cron: '* * * * *'  # Every minute

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger post scheduler
        run: |
          curl -X POST https://your-app-name.vercel.app/api/cron/post-scheduler
```

## Testing Scheduled Posts

### 1. Schedule a Test Post

1. Go to your app
2. Create a new post
3. Set scheduled time to 2-3 minutes from now
4. Save the post

### 2. Monitor the Process

Check the logs in your Vercel dashboard:
1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Functions" tab
4. Look for `/api/cron/post-scheduler` calls

### 3. Verify Post Status

Check your database or app dashboard:
- Post status should change from 'scheduled' to 'posted'
- Check Instagram to see if the post appears

## Troubleshooting

### Issue: Posts Not Publishing

**Check these:**

1. **Cron job is running:**
   ```bash
   # Test the endpoint manually
   curl -X POST https://your-app-name.vercel.app/api/cron/post-scheduler
   ```

2. **Database connection:**
   - Ensure Supabase is accessible
   - Check environment variables

3. **Instagram credentials:**
   - Verify Instagram access token is valid
   - Check Instagram Business Account ID

4. **Post data:**
   - Ensure `scheduled_time` is in correct format
   - Check post status is 'scheduled'

### Issue: Posts Publishing Late

**Solutions:**

1. **Reduce cron frequency:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/post-scheduler",
         "schedule": "*/30 * * * *"  // Every 30 seconds
       }
     ]
   }
   ```

2. **Check timezone:**
   - Ensure your app uses the correct timezone
   - Consider using UTC for consistency

### Issue: Instagram API Errors

**Common fixes:**

1. **Token expired:**
   - Reconnect Instagram account
   - Get fresh access token

2. **Missing permissions:**
   - Ensure `instagram_content_publish` permission
   - Check Facebook app settings

3. **Rate limiting:**
   - Instagram has posting limits
   - Space out posts by 1-2 minutes

## Monitoring and Alerts

### Set up monitoring:

1. **Vercel Analytics:**
   - Monitor function execution
   - Check for errors

2. **Database monitoring:**
   - Track failed posts
   - Monitor success rates

3. **Email alerts:**
   - Set up notifications for failed posts
   - Monitor cron job health

## Best Practices

### 1. Timezone Handling
```javascript
// Always use UTC for scheduling
const scheduledTime = new Date().toISOString();
```

### 2. Error Handling
- Log all errors for debugging
- Retry failed posts (optional)
- Notify users of failures

### 3. Rate Limiting
- Don't schedule posts too close together
- Respect Instagram's posting limits
- Use 1-2 minute intervals minimum

### 4. Testing
- Test with short intervals first
- Verify posts appear on Instagram
- Check all platforms (Instagram + Facebook)

## Example: Complete Setup

### 1. Add to vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/post-scheduler",
      "schedule": "* * * * *"
    }
  ]
}
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

### 3. Test with a post
- Schedule a post for 2 minutes from now
- Wait and check Instagram
- Verify post appears at exact time

### 4. Monitor
- Check Vercel function logs
- Verify post status in database
- Confirm Instagram posting

## Success Indicators

✅ **Cron job runs every minute**  
✅ **Scheduled posts publish on time**  
✅ **Posts appear on Instagram**  
✅ **Status updates correctly**  
✅ **No failed posts**  

---

**Your scheduled posts will now work perfectly at the exact scheduled time!** 🎉 