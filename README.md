<<<<<<< HEAD
# 🚀 Somema.ai — AI-Powered Social Media Manager

**Somema.ai** is a full-stack AI-powered SaaS platform that acts as your personal social media manager. It helps businesses and creators automatically generate daily social media content — including captions, hashtags, and images — and posts them to Instagram, Facebook, and Twitter/X. All powered by a smart hybrid AI engine.

---

## 🔑 Features

- 🧠 AI-generated captions and hashtags based on your business
- 🖼️ Upload or auto-generate branded images for posts
- 📅 Drag-and-drop content calendar with editable post previews
- 🔁 Monthly content plans generated in bulk by AI
- 📲 Auto-post to social platforms (Instagram, Facebook, Twitter)
- 📊 Analytics dashboard with insights and charts
- 💼 Business onboarding to set brand tone and style
- 💳 Stripe billing with usage-based limits

---

## 🧰 Tech Stack

| Layer         | Technology                         |
|---------------|-------------------------------------|
| Frontend      | Next.js 14 (App Router)             |
| Styling       | Tailwind CSS                        |
| Backend       | Supabase (Database, Auth, Storage)  |
| AI Models     | GPT-4o, Claude Haiku, Gemini Pro    |
| Image Gen     | DALL·E 3, Stable Diffusion (Replicate) |
| Scheduling    | Supabase Edge Functions / CronJobs  |
| Charts        | Recharts / Chart.js                 |
| Payments      | Stripe                              |
| Hosting       | Vercel                              |

---

## 📁 Folder Structure

```
/app
  /login
  /signup
  /onboarding
  /dashboard
  /media
  /ai/generate
  /calendar
  /posts/schedule/[id]
  /analytics
  /settings
/components
/lib
supabaseClient.ts
gpt.ts
/public
/styles
.env.local
README.md
```

---

## 🛠️ Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/somema-ai.git
   cd somema-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set environment variables**
   Create a `.env.local` file with the following:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   OPENAI_API_KEY=your_openai_key
   REPLICATE_API_KEY=your_replicate_key
   STRIPE_SECRET_KEY=your_stripe_key
   ```

4. **Run the app locally**

   ```bash
   npm run dev
   ```

---

## 📌 Development Roadmap

* [x] Business onboarding and brand setup
* [x] Upload product media
* [x] AI caption + hashtag generator
* [x] Monthly calendar content planner
* [ ] AI image generation and editing
* [ ] Social media auto-posting integration
* [ ] Stripe billing
* [ ] Analytics with engagement tracking
* [ ] Admin tools for moderation

---

## 🤝 Contributions

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to improve. 
=======
# Somema.ai - AI-Powered Social Media Manager

A comprehensive social media management platform that leverages AI to automate content creation, scheduling, and analytics for Instagram, Facebook, Twitter, and more.

## 🚀 Features

- **AI Content Generation**: Create engaging captions and hashtags using GPT-4o, Claude, and Gemini
- **Smart Scheduling**: Plan and schedule content with an intuitive calendar interface
- **Multi-Platform Posting**: Automatically post to Instagram, Facebook, Twitter, and more
- **Analytics & Insights**: Track engagement, reach, and performance with detailed reports
- **Background Removal**: AI-powered image editing with background removal
- **Image Generation**: Create stunning visuals with Stable Diffusion integration
- **Google OAuth**: Seamless authentication with Google accounts

## 🏠 Enhanced Home Page

The home page has been completely redesigned with:

- **Modern Design**: Beautiful gradient backgrounds and improved typography
- **Quick Login Form**: Inline login form that appears on the home page
- **Google OAuth Integration**: Direct Google sign-in from the home page
- **Better CTAs**: Clear call-to-action buttons with improved styling
- **Feature Showcase**: Highlighted features with engaging visuals
- **Stats Section**: Key metrics and benefits prominently displayed
- **Responsive Design**: Optimized for all device sizes

## 🔐 Authentication

### Email/Password Login
- Traditional email and password authentication
- Secure password validation
- Automatic redirection to dashboard or onboarding

### Google OAuth
- Seamless Google account integration
- One-click sign-in experience
- Automatic profile data mapping
- Secure token handling

## 🛠️ Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Services
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Image Processing
REMOVE_BG_API_KEY=your_remove_bg_api_key_here
REPLICATE_API_KEY=your_replicate_api_key_here

# Other configurations...
```

### 2. Google OAuth Setup

Follow the detailed guide in `GOOGLE_OAUTH_SETUP.md` to configure Google OAuth:

1. **Configure Google Cloud Console**
   - Create OAuth 2.0 credentials
   - Set authorized redirect URIs
   - Enable necessary APIs

2. **Configure Supabase**
   - Enable Google provider in Authentication settings
   - Add Google OAuth credentials
   - Test the configuration

3. **Test the Setup**
   ```bash
   node test-google-oauth.js
   ```

### 3. Database Setup

Run the database setup scripts:

```bash
# Set up the database schema
psql -h your-supabase-host -U postgres -d postgres -f database-setup.sql

# Add missing columns if needed
psql -h your-supabase-host -U postgres -d postgres -f add-missing-columns.sql
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the enhanced home page.

## 📱 Usage

### Home Page Features

1. **Quick Sign In**: Click "Sign in" in the header to show the inline login form
2. **Google Login**: Use the "Sign in with Google" button for one-click authentication
3. **Get Started**: Click "Start Free Trial" to create a new account
4. **Feature Exploration**: Browse the feature cards to learn about capabilities

### Authentication Flow

1. **New Users**: Sign up → Complete onboarding → Access dashboard
2. **Existing Users**: Sign in → Redirect to dashboard (if onboarding complete)
3. **Google Users**: Click Google sign-in → Authorize → Automatic redirect

## 🔧 Troubleshooting

### Google OAuth Issues

1. **"Invalid redirect URI"**
   - Check Google Cloud Console redirect URIs
   - Ensure Supabase callback URL is included

2. **"OAuth provider not configured"**
   - Enable Google provider in Supabase Dashboard
   - Verify credentials are correctly entered

3. **"Client ID not found"**
   - Double-check Google OAuth credentials
   - Ensure environment variables are set

### General Issues

1. **Supabase not configured**
   - Check `.env.local` file exists
   - Verify environment variables are correct

2. **Authentication errors**
   - Check browser console for detailed errors
   - Verify Supabase project settings

## 📁 Project Structure

```
somema-ai/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Enhanced home page
├── components/            # Reusable components
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
├── GOOGLE_OAUTH_SETUP.md # Google OAuth setup guide
├── test-google-oauth.js  # OAuth testing script
└── README.md             # This file
```

## 🎨 Design Improvements

### Home Page Enhancements

- **Gradient Backgrounds**: Beautiful blue-to-purple gradients
- **Modern Typography**: Improved font sizes and spacing
- **Interactive Elements**: Hover effects and smooth transitions
- **Better Visual Hierarchy**: Clear content organization
- **Responsive Layout**: Optimized for mobile and desktop

### Authentication Pages

- **Consistent Design**: Matching styling across login/signup
- **Error Handling**: Improved error message display
- **Loading States**: Better user feedback during authentication
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔒 Security Features

- **Secure OAuth Flow**: Proper token handling and validation
- **Environment Variables**: Sensitive data kept out of client code
- **Error Handling**: Graceful error handling without exposing sensitive info
- **HTTPS Required**: Production deployment requires HTTPS

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- All AI service API keys
- Google OAuth credentials

## 📞 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the `GOOGLE_OAUTH_SETUP.md` guide
3. Run the test script: `node test-google-oauth.js`
4. Check browser console for detailed error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Somema.ai** - Transform your social media with AI 🚀
>>>>>>> 02d868d65835d85f5aecef34c733b66bdba455f4
