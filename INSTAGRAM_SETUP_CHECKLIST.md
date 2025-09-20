# Instagram API Setup Checklist

## ✅ Prerequisites
- [ ] Instagram account converted to Business account
- [ ] Facebook Page created and linked to Instagram
- [ ] Facebook Developer account created
- [ ] Facebook App created in Developer Console

## ✅ Facebook App Configuration
- [ ] App type set to "Business"
- [ ] Instagram Basic Display or Instagram Graph API product added
- [ ] OAuth redirect URIs configured:
  - [ ] `http://localhost:3000/api/meta/oauth` (development)
  - [ ] `https://yourdomain.com/api/meta/oauth` (production)
- [ ] App ID and App Secret noted down

## ✅ Instagram Permissions
- [ ] `instagram_content_publish` added to app
- [ ] `instagram_basic` added to app
- [ ] `pages_show_list` added to app
- [ ] `pages_read_engagement` added to app
- [ ] Permissions submitted for review (if required)

## ✅ Get Credentials
- [ ] Run the helper script: `node get-instagram-credentials.js`
- [ ] Follow the interactive prompts
- [ ] Copy the generated credentials

## ✅ Environment Setup
- [ ] Create `.env.local` file in project root
- [ ] Add Instagram credentials:
  ```env
  INSTAGRAM_ACCESS_TOKEN=your_access_token
  INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
  META_APP_ID=your_app_id
  META_APP_SECRET=your_app_secret
  ```

## ✅ Test Integration
- [ ] Run test script: `node test-instagram-api.js`
- [ ] Verify account info is retrieved
- [ ] Verify recent media is accessible
- [ ] Test posting (optional - will create actual post)

## ✅ App Integration
- [ ] Restart your Next.js development server
- [ ] Go to your app's Meta connection page
- [ ] Connect your Instagram account
- [ ] Test posting through the app interface

## 🎯 Success Indicators
- [ ] Instagram account shows as connected in dashboard
- [ ] Can select Instagram account in post editor
- [ ] Posts are successfully published to Instagram
- [ ] Detailed logs show successful API calls

## 🔧 Troubleshooting
If you encounter issues:
1. Check the detailed logs in your app
2. Verify all environment variables are set correctly
3. Ensure Instagram account is properly linked to Facebook Page
4. Confirm all required permissions are granted
5. Test with the provided test scripts

---

**Note**: This setup is optimized for Indian businesses that primarily use Instagram for social media marketing. 