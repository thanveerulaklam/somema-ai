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