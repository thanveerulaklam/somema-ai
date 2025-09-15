# 🚀 Somema.ai Setup Guide

This guide will help you set up Somema.ai with all the necessary API keys and configurations.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- Supabase account (free tier available)
- OpenAI API key (required for AI features)

## 🔧 Step-by-Step Setup

### 1. **Clone and Install**

```bash
git clone https://github.com/your-username/somema-ai.git
cd somema-ai
npm install
```

### 2. **Environment Variables**

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration (Required for AI features) - SERVER-SIDE ONLY
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Configuration (Optional - for Claude AI) - SERVER-SIDE ONLY
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Replicate Configuration (Optional - for Stable Diffusion) - SERVER-SIDE ONLY
REPLICATE_API_KEY=your_replicate_api_key_here

# Stripe Configuration (Optional - for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Canva Configuration (Optional - for templates) - SERVER-SIDE ONLY
CANVA_API_KEY=your_canva_api_key_here
```

### 3. **Get API Keys**

#### **OpenAI API Key (Required)**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

#### **Supabase Setup**
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings > API
4. Copy the URL and anon key
5. Go to Settings > API > service_role key (for admin operations)

### 4. **Database Setup**

Run the following SQL in your Supabase SQL editor:

```sql
-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  text_elements JSONB,
  image_url TEXT,
  platform TEXT DEFAULT 'instagram',
  theme TEXT DEFAULT 'product',
  business_context TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  tone TEXT DEFAULT 'professional',
  brand_colors JSONB,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own businesses" ON businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);
```

### 5. **Storage Setup**

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `media`
3. Set the bucket to public
4. Add the following policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (true);

-- Allow users to update their own files
CREATE POLICY "Allow users to update own files" ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. **Authentication Setup**

1. Go to Authentication > Settings in Supabase
2. Enable Email auth provider
3. Configure your site URL (e.g., `http://localhost:3000` for development)
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

### 7. **Run the Application**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Setup

### **Test AI Generation**
1. Sign up for an account
2. Go to AI > Generate
3. Fill in business details
4. Try generating content
5. Check if DALL-E images are generated

### **Test Post Editor**
1. Generate content with AI
2. Click "Open Post Editor"
3. Verify Fabric.js canvas loads
4. Test text editing and positioning
5. Try saving the post

### **Test Database**
1. Create a post
2. Check if it appears in your Supabase dashboard
3. Verify the post data is stored correctly

## 🚨 Troubleshooting

### **Common Issues**

#### **"OpenAI API key not configured"**
- Make sure your `.env.local` file has `NEXT_PUBLIC_OPENAI_API_KEY`
- Restart your development server after adding environment variables

#### **"Supabase connection failed"**
- Verify your Supabase URL and keys
- Check if your Supabase project is active
- Ensure you've run the database schema

#### **"Fabric.js canvas not loading"**
- Check browser console for errors
- Ensure you're using a modern browser
- Verify the image URL is accessible

#### **"Image generation failed"**
- Check your OpenAI API key and billing
- Verify you have DALL-E 3 access
- Check the image prompt format

### **Getting Help**

1. Check the browser console for error messages
2. Verify all environment variables are set
3. Check the Supabase dashboard for database errors
4. Open an issue on GitHub with detailed error information

## 🎉 Next Steps

Once setup is complete:

1. **Customize Branding**: Update colors, fonts, and branding
2. **Add More AI Models**: Integrate Claude, Gemini, or other AI services
3. **Social Media Integration**: Connect Instagram, Facebook, Twitter APIs
4. **Analytics**: Set up tracking and reporting
5. **Deploy**: Deploy to Vercel or your preferred hosting platform

---

**Need help?** Check our [GitHub Issues](https://github.com/your-username/somema-ai/issues) or join our Discord community! 