# Free Plan Scheduled Posts Setup

## Problem: Vercel Hobby Plan Limitations

Vercel's free Hobby plan only allows **daily cron jobs**, not every minute. This means we need alternative solutions for real-time scheduled posts.

## Solution: External Cron Services (Free)

### Option 1: Cron-job.org (Recommended - Free)

1. **Go to**: https://cron-job.org
2. **Sign up** for a free account
3. **Create new cronjob**:
   - **Title**: `Somema Post Scheduler`
   - **URL**: `https://your-app-name.vercel.app/api/cron/post-scheduler`
   - **Schedule**: Every minute (`* * * * *`)
   - **Method**: POST
   - **Headers**: `Content-Type: application/json`

4. **Save and activate**

### Option 2: EasyCron (Free Tier)

1. **Go to**: https://www.easycron.com
2. **Sign up** for free account
3. **Create cron job**:
   - **URL**: `https://your-app-name.vercel.app/api/cron/post-scheduler`
   - **Schedule**: Every minute
   - **Method**: POST

### Option 3: SetCronJob (Free Tier)

1. **Go to**: https://www.setcronjob.com
2. **Create account**
3. **Add new job**:
   - **URL**: `https://your-app-name.vercel.app/api/cron/post-scheduler`
   - **Schedule**: Every minute
   - **Method**: POST

## Alternative: GitHub Actions (Free)

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

## Quick Setup Guide

### Step 1: Deploy Your App
```bash
vercel --prod
```

### Step 2: Set Up External Cron (Choose One)

#### Using Cron-job.org:
1. Go to https://cron-job.org
2. Sign up and create account
3. Click "Create cronjob"
4. Fill in:
   - **Title**: `Somema Posts`
   - **URL**: `https://your-app-name.vercel.app/api/cron/post-scheduler`
   - **Schedule**: `* * * * *` (every minute)
   - **Method**: POST
5. Click "Create"

#### Using GitHub Actions:
1. Create `.github/workflows/cron.yml` file
2. Add the YAML content above
3. Commit and push to GitHub
4. GitHub will run the cron job every minute

### Step 3: Test Scheduled Posts

1. **Schedule a test post** for 2-3 minutes from now
2. **Wait and check** your Instagram
3. **Verify** the post appears at the scheduled time

## Monitoring

### Check if Cron is Working:

1. **Test manually**:
   ```bash
   curl -X POST https://your-app-name.vercel.app/api/cron/post-scheduler
   ```

2. **Check Vercel logs**:
   - Go to Vercel Dashboard
   - Click your project
   - Go to "Functions" tab
   - Look for `/api/cron/post-scheduler` calls

3. **Check external cron service**:
   - Most services show execution history
   - Check for successful calls

### Check Database:

```sql
-- Check scheduled posts
SELECT * FROM posts WHERE status = 'scheduled';

-- Check posted posts
SELECT * FROM posts WHERE status = 'posted';
```

## Troubleshooting

### Issue: Posts Not Publishing

1. **Check external cron service**:
   - Verify the URL is correct
   - Check if cron job is active
   - Look for error logs

2. **Test endpoint manually**:
   ```bash
   curl -X POST https://your-app-name.vercel.app/api/cron/post-scheduler
   ```

3. **Check Vercel function logs**:
   - Look for errors in function execution
   - Verify Instagram credentials

### Issue: Posts Publishing Late

1. **Check cron frequency**:
   - Ensure it's set to every minute
   - Some free services have delays

2. **Use multiple cron services**:
   - Set up backup cron jobs
   - Redundancy ensures reliability

## Best Practices

### 1. Use Multiple Cron Services
Set up 2-3 different cron services as backup:
- Cron-job.org
- GitHub Actions
- EasyCron

### 2. Monitor Regularly
- Check cron service dashboards
- Monitor Vercel function logs
- Test with short intervals

### 3. Handle Failures Gracefully
- Posts will retry on next cron run
- Check for failed posts in database
- Manual intervention if needed

## Success Indicators

✅ **External cron service is active**  
✅ **Vercel function receives calls**  
✅ **Scheduled posts publish on time**  
✅ **Posts appear on Instagram**  
✅ **No failed posts in database**  

## Cost Comparison

| Service | Cost | Frequency | Reliability |
|---------|------|-----------|-------------|
| Vercel Pro | $20/month | Every minute | High |
| Cron-job.org | Free | Every minute | High |
| GitHub Actions | Free | Every minute | High |
| EasyCron | Free tier | Every minute | Medium |

**Recommendation**: Use Cron-job.org or GitHub Actions for free, reliable scheduled posts!

---

**Your scheduled posts will work perfectly with these free solutions!** 🎉 