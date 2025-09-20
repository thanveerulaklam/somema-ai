import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiMiddleware } from '../../../../lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await apiMiddleware(request, {
      requireAuth: true,
      requireAdmin: true,
      rateLimit: {
        maxRequests: 30,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    });

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get request body
    const { dateRange = '30d', includeDetails = false } = await request.json();
    
    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. User Analytics
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const { data: paidUsers } = await supabase
      .from('user_profiles')
      .select('*')
      .neq('subscription_plan', 'free');

    const { data: newUsersToday } = await supabase
      .from('user_profiles')
      .select('*')
      .gte('created_at', today.toISOString());

    const { data: newUsersThisWeek } = await supabase
      .from('user_profiles')
      .select('*')
      .gte('created_at', weekAgo.toISOString());

    const { data: newUsersThisMonth } = await supabase
      .from('user_profiles')
      .select('*')
      .gte('created_at', monthAgo.toISOString());

    // 2. Plan Distribution
    const { data: allProfiles } = await supabase
      .from('user_profiles')
      .select('subscription_plan, subscription_status');

    const planDistribution = {
      free: 0,
      starter: 0,
      growth: 0,
      scale: 0
    };

    const subscriptions = {
      activeSubscriptions: 0
    };

    allProfiles?.forEach(profile => {
      const plan = profile.subscription_plan || 'free';
      const status = profile.subscription_status || 'active';
      
      if (planDistribution.hasOwnProperty(plan)) {
        planDistribution[plan as keyof typeof planDistribution]++;
      }
      
      if (status === 'active' && plan !== 'free') {
        subscriptions.activeSubscriptions++;
      }
    });

    // 3. Credit Usage
    const { data: creditUsers } = await supabase
      .from('user_profiles')
      .select('image_enhancement_credits, subscription_plan');

    const totalCreditsUsed = creditUsers?.reduce((sum, user) => {
      const defaultCredits = getDefaultCreditsForPlan(user.subscription_plan || 'free');
      const used = defaultCredits - (user.image_enhancement_credits || 0);
      return sum + Math.max(0, used);
    }, 0) || 0;

    // 4. Revenue Calculation (based on actual payments with correct pricing)
    // Indian pricing (in INR)
    const planPricesINR = {
      starter: 999,
      growth: 2499,
      scale: 8999
    };

    // International pricing (in USD, converted to INR for display)
    const planPricesUSD = {
      starter: 29,
      growth: 79,
      scale: 199
    };

    // Convert USD to INR (approximate rate: 1 USD = 83 INR)
    const USD_TO_INR = 83;
    const planPricesUSDInINR = {
      starter: planPricesUSD.starter * USD_TO_INR,
      growth: planPricesUSD.growth * USD_TO_INR,
      scale: planPricesUSD.scale * USD_TO_INR
    };

    // Calculate MRR (Monthly Recurring Revenue) from active subscriptions
    const mrr = paidUsers?.reduce((sum, user) => {
      const plan = user.subscription_plan;
      const status = user.subscription_status;
      const country = user.country;
      
      // Only count active subscriptions for MRR
      if (status === 'active' && plan !== 'free') {
        // Use Indian pricing if user is from India, otherwise use international pricing
        const isIndianUser = country === 'India' || country === 'IN';
        const price = isIndianUser 
          ? (planPricesINR[plan as keyof typeof planPricesINR] || 0)
          : (planPricesUSDInINR[plan as keyof typeof planPricesUSDInINR] || 0);
        return sum + price;
      }
      return sum;
    }, 0) || 0;

    // Calculate total revenue from all paid users (lifetime)
    const totalRevenue = paidUsers?.reduce((sum, user) => {
      const plan = user.subscription_plan;
      const country = user.country;
      
      if (plan !== 'free') {
        // Use Indian pricing if user is from India, otherwise use international pricing
        const isIndianUser = country === 'India' || country === 'IN';
        const price = isIndianUser 
          ? (planPricesINR[plan as keyof typeof planPricesINR] || 0)
          : (planPricesUSDInINR[plan as keyof typeof planPricesUSDInINR] || 0);
        return sum + price;
      }
      return sum;
    }, 0) || 0;

    // Annual Recurring Revenue
    const arr = mrr * 12;

    // 5. Location Analytics
    const { data: locationData } = await supabase
      .from('user_profiles')
      .select('city, state, country, subscription_plan, created_at');

    const locationStats = {
      countries: {} as Record<string, number>,
      states: {} as Record<string, number>,
      cities: {} as Record<string, number>,
      topCountries: [] as Array<{ country: string; count: number; revenue: number }>,
      topStates: [] as Array<{ state: string; count: number; revenue: number }>,
      topCities: [] as Array<{ city: string; count: number; revenue: number }>,
      totalWithLocation: 0,
      totalWithoutLocation: 0
    };

    if (locationData) {
      locationData.forEach(profile => {
        const hasLocation = profile.city || profile.state || profile.country;
        
        if (hasLocation) {
          locationStats.totalWithLocation++;
          
          // Country stats
          if (profile.country) {
            const country = profile.country;
            locationStats.countries[country] = (locationStats.countries[country] || 0) + 1;
          }
          
          // State stats
          if (profile.state) {
            const state = profile.state;
            locationStats.states[state] = (locationStats.states[state] || 0) + 1;
          }
          
          // City stats
          if (profile.city) {
            const city = profile.city;
            locationStats.cities[city] = (locationStats.cities[city] || 0) + 1;
          }
        } else {
          locationStats.totalWithoutLocation++;
        }
      });

      // Calculate top locations with revenue
      Object.entries(locationStats.countries).forEach(([country, count]) => {
        const revenue = locationData
          .filter(p => p.country === country && p.subscription_plan !== 'free')
          .reduce((sum, p) => {
            const isIndianUser = p.country === 'India' || p.country === 'IN';
            const price = isIndianUser 
              ? (planPricesINR[p.subscription_plan as keyof typeof planPricesINR] || 0)
              : (planPricesUSDInINR[p.subscription_plan as keyof typeof planPricesUSDInINR] || 0);
            return sum + price;
          }, 0);
        
        locationStats.topCountries.push({ country, count, revenue });
      });

      Object.entries(locationStats.states).forEach(([state, count]) => {
        const revenue = locationData
          .filter(p => p.state === state && p.subscription_plan !== 'free')
          .reduce((sum, p) => {
            const isIndianUser = p.country === 'India' || p.country === 'IN';
            const price = isIndianUser 
              ? (planPricesINR[p.subscription_plan as keyof typeof planPricesINR] || 0)
              : (planPricesUSDInINR[p.subscription_plan as keyof typeof planPricesUSDInINR] || 0);
            return sum + price;
          }, 0);
        
        locationStats.topStates.push({ state, count, revenue });
      });

      Object.entries(locationStats.cities).forEach(([city, count]) => {
        const revenue = locationData
          .filter(p => p.city === city && p.subscription_plan !== 'free')
          .reduce((sum, p) => {
            const isIndianUser = p.country === 'India' || p.country === 'IN';
            const price = isIndianUser 
              ? (planPricesINR[p.subscription_plan as keyof typeof planPricesINR] || 0)
              : (planPricesUSDInINR[p.subscription_plan as keyof typeof planPricesUSDInINR] || 0);
            return sum + price;
          }, 0);
        
        locationStats.topCities.push({ city, count, revenue });
      });

      // Sort by count and take top 10
      locationStats.topCountries.sort((a, b) => b.count - a.count).splice(10);
      locationStats.topStates.sort((a, b) => b.count - a.count).splice(10);
      locationStats.topCities.sort((a, b) => b.count - a.count).splice(10);
    }

    // 5. User Activity
    const { count: postsCreatedToday } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: postsCreatedThisWeek } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    const { count: postsCreatedThisMonth } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    const { count: imagesEnhancedToday } = await supabase
      .from('generation_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: imagesEnhancedThisWeek } = await supabase
      .from('generation_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    const { count: imagesEnhancedThisMonth } = await supabase
      .from('generation_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    // 6. AI Usage Analytics
    const { data: aiUsageData } = await supabase
      .from('generation_logs')
      .select('type, created_at, user_id');

    // Count different types of AI operations
    const aiUsage = {
      gptImage1Requests: 0,
      imageAnalysisRequests: 0,
      captionGenerationRequests: 0,
      hashtagGenerationRequests: 0,
      totalTokens: 0
    };

    // Estimate tokens and costs for different operations
    const tokenEstimates = {
      imageAnalysis: 150,      // CLIP analysis
      captionGeneration: 200,  // GPT caption generation
      hashtagGeneration: 100,  // GPT hashtag generation
      gptImage1: 0            // No tokens for image generation
    };

    const costEstimates = {
      imageAnalysis: 0.0001,   // $0.0001 per CLIP analysis
      captionGeneration: 0.002, // $0.002 per caption (200 tokens @ $0.01/1K tokens)
      hashtagGeneration: 0.001, // $0.001 per hashtag (100 tokens @ $0.01/1K tokens)
      gptImage1: 0.015        // $0.015 per DALL-E image
    };

    if (aiUsageData) {
      aiUsageData.forEach(log => {
        switch (log.type) {
          case 'gpt-image-1':
            aiUsage.gptImage1Requests++;
            break;
          case 'image-analysis':
            aiUsage.imageAnalysisRequests++;
            aiUsage.totalTokens += tokenEstimates.imageAnalysis;
            break;
          case 'caption-generation':
            aiUsage.captionGenerationRequests++;
            aiUsage.totalTokens += tokenEstimates.captionGeneration;
            break;
          case 'hashtag-generation':
            aiUsage.hashtagGenerationRequests++;
            aiUsage.totalTokens += tokenEstimates.hashtagGeneration;
            break;
        }
      });
    }

    // Calculate total costs
    const totalCosts = {
      gptImage1: aiUsage.gptImage1Requests * costEstimates.gptImage1,
      imageAnalysis: aiUsage.imageAnalysisRequests * costEstimates.imageAnalysis,
      captionGeneration: aiUsage.captionGenerationRequests * costEstimates.captionGeneration,
      hashtagGeneration: aiUsage.hashtagGenerationRequests * costEstimates.hashtagGeneration,
      total: 0
    };

    totalCosts.total = totalCosts.gptImage1 + totalCosts.imageAnalysis + 
                      totalCosts.captionGeneration + totalCosts.hashtagGeneration;

    const analytics = {
      totalUsers: totalUsers || 0,
      paidUsers: paidUsers?.length || 0,
      mrr,
      totalRevenue,
      newUsersToday: newUsersToday?.length || 0,
      newUsersThisWeek: newUsersThisWeek?.length || 0,
      newUsersThisMonth: newUsersThisMonth?.length || 0,
      planDistribution,
      subscriptions,
      creditUsage: {
        totalCreditsUsed
      },
      userActivity: {
        postsCreatedToday: postsCreatedToday || 0,
        postsCreatedThisWeek: postsCreatedThisWeek || 0,
        postsCreatedThisMonth: postsCreatedThisMonth || 0,
        imagesEnhancedToday: imagesEnhancedToday || 0,
        imagesEnhancedThisWeek: imagesEnhancedThisWeek || 0,
        imagesEnhancedThisMonth: imagesEnhancedThisMonth || 0
      },
      aiUsage,
      totalCosts,
      locationStats
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getDefaultCreditsForPlan(plan: string): number {
  switch (plan) {
    case 'free': return 3;
    case 'starter': return 30;
    case 'growth': return 100;
    case 'scale': return 500;
    default: return 3;
  }
}
