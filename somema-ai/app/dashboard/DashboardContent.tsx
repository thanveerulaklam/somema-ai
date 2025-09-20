'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'
import { getCurrentUser, handleAuthError } from '../../lib/auth-utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAnalyticsContext } from '../../components/analytics/AnalyticsProvider';
import { 
  Calendar, 
  Image, 
  BarChart3, 
  Settings, 
  Plus,
  Instagram,
  Facebook,
  Users,
  Eye,
  CheckCircle,
  X,
  Clock,
  FileText,
  Sparkles,
  Play,
  Edit,
  MessageCircle,
  Trash2,
  MoreHorizontal,
  Heart,
  Share2
} from 'lucide-react';
import { Fragment } from 'react';

// Add line-clamp utility styles
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

interface UserProfile {
  id: string;
  business_name: string;
  niche: string;
  tone: string;
  audience: string;
}

interface DashboardStats {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

// Content Calendar Day Component
interface Post {
  id: number;
  platform: 'twitter' | 'facebook' | 'instagram' | 'multi';
  userIcon?: string;
  userIcons?: string[];
  tags: string[];
  headline: string;
  image: string;
  isVideo: boolean;
  engagement?: { likes: number; shares: number; comments: number } | null;
}



function DashboardContentInner() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    draftPosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [metaConnected, setMetaConnected] = useState<{ instagram: boolean; facebook: boolean; facebookName?: string; instagramName?: string }>({ instagram: false, facebook: false });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [enhancementCredits, setEnhancementCredits] = useState<number>(0);
  const analytics = useAnalyticsContext();

  useEffect(() => {
    // Check for success message in URL params
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
      // Clear the message from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, '', newUrl.toString());
    }

    // Check for subscription success message
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      setMessage('🎉 Subscription activated successfully! Welcome to your new plan.');
      // Clear the parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('subscription');
      window.history.replaceState({}, '', newUrl.toString());
    }

    const getUser = async () => {
      console.log('🔍 Starting getUser function...');
      try {
        const user = await getCurrentUser();
        console.log('👤 User auth result:', user ? 'User found' : 'No user');
        
        if (!user) {
          console.log('❌ No user found, redirecting to login');
          router.push('/login');
          return;
        }
        setUser(user);
        console.log('✅ User set:', user.id);

        // Get user profile
        console.log('📋 Fetching user profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log('📋 Profile result:', profileData ? 'Profile found' : 'No profile', profileError);

        if (profileData) {
          setProfile(profileData);
          console.log('✅ Profile set:', profileData.business_name);
          console.log('📋 Full profile data:', profileData);
          
          // Check if required fields are completed
          const requiredFields = [
            profileData.business_name,
            profileData.industry,
            profileData.city,
            profileData.country
          ];
          
          const hasRequiredFields = requiredFields.every(field => 
            field && typeof field === 'string' && field.trim().length > 0
          );
          
          if (!hasRequiredFields) {
            console.log('⚠️ Required fields missing, redirecting to settings');
            router.push('/settings?message=' + encodeURIComponent('Please complete your business profile with required information (Business Name, Industry, City, and Country)'));
            return;
          }
        } else {
          console.log('❌ No profile found, redirecting to onboarding');
          router.push('/onboarding');
          return;
        }

        // Get dashboard stats
        console.log('📊 Loading dashboard stats...');
        await loadDashboardStats(user.id);

        // Get post generation credits and enhancement credits
        console.log('🎲 Loading post generation credits and enhancement credits...');
        const { data: userData, error: creditsError } = await supabase
          .from('user_profiles')
          .select('post_generation_credits, image_enhancement_credits, subscription_plan')
          .eq('user_id', user.id)
          .single();

        if (!creditsError && userData) {
          // Get default values based on plan
          const plan = userData.subscription_plan || 'free'
          const defaultCredits = getDefaultCreditsForPlan(plan)
          
          setGenerationCount(userData.post_generation_credits ?? defaultCredits);
          setEnhancementCredits(userData.image_enhancement_credits ?? defaultCredits);
          console.log('✅ Post generation credits set:', userData.post_generation_credits ?? defaultCredits);
          console.log('✅ Enhancement credits set:', userData.image_enhancement_credits ?? defaultCredits);
        } else {
          console.log('⚠️ No credits found, defaulting to free plan credits');
          const defaultCredits = getDefaultCreditsForPlan('free');
          setGenerationCount(defaultCredits);
          setEnhancementCredits(defaultCredits);
        }

        // Check Meta connection status
        console.log('🔗 Checking Meta connection...');
        await checkMetaConnection();

        setLoading(false);
        console.log('✅ Dashboard loading complete');
      } catch (error) {
        console.error('Error getting user:', error);
        // handleAuthError will handle the redirect
        return;
      }
    };

    getUser();
  }, [router, searchParams, searchParams.get('refresh')]);



  const checkMetaConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const response = await fetch('/api/meta/connect', {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Use new structure: available (all pages) and connected (user's selection)
        const available = data.available || [];
        const connected = data.connected || [];
        // Facebook is connected if any connected entry exists
        let facebookConnected = connected.length > 0;
        let facebookName = '';
        let instagramConnected = false;
        let instagramName = '';
        // Find connected Facebook page name
        if (facebookConnected) {
          const firstConnected = connected[0];
          const page = available.find((p: any) => p.id === firstConnected.pageId);
          facebookName = page?.name || '';
          // Find connected Instagram account
          for (const conn of connected) {
            const page = available.find((p: any) => p.id === conn.pageId);
            if (page && Array.isArray(page.instagram_accounts)) {
              const insta = page.instagram_accounts.find((ia: any) => ia.id === conn.instagramId);
              if (insta) {
                instagramConnected = true;
                instagramName = insta.username || '';
                break;
              }
            }
          }
        }
        setMetaConnected({ instagram: instagramConnected, facebook: facebookConnected, facebookName, instagramName });
      } else {
        setMetaConnected({ instagram: false, facebook: false });
      }
    } catch {
      setMetaConnected({ instagram: false, facebook: false });
    }
  };

  const loadDashboardStats = async (userId: string) => {
    console.log('📊 loadDashboardStats called for user:', userId);
    try {
      // Try to get posts from database first
      console.log('🗄️ Fetching posts from database...');
      const { count: totalPosts, error: dbError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      console.log('📈 Total posts from DB:', totalPosts, 'Error:', dbError);

      let finalTotalPosts = totalPosts || 0;
      let finalScheduledPosts = 0;
      let finalPublishedPosts = 0;
      let finalDraftPosts = 0;

      if (dbError) {
        console.error('❌ Error fetching posts from database:', dbError);
        // Fallback to localStorage
        console.log('🔄 Falling back to localStorage...');
        const savedPosts = JSON.parse(localStorage.getItem('posts') || '[]');
        finalTotalPosts = savedPosts.length;
        finalScheduledPosts = savedPosts.filter((post: any) => post.status === 'scheduled').length;
        finalPublishedPosts = savedPosts.filter((post: any) => post.status === 'published').length;
        finalDraftPosts = savedPosts.filter((post: any) => post.status === 'draft').length;
        console.log('📊 Stats from localStorage:', { finalTotalPosts, finalScheduledPosts, finalPublishedPosts, finalDraftPosts });
      } else {
        // Get additional stats from database
        console.log('📊 Fetching detailed stats from database...');
        const { count: scheduledPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'scheduled');

        const { count: publishedPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'published');

        const { count: draftPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'draft');

        finalScheduledPosts = scheduledPosts || 0;
        finalPublishedPosts = publishedPosts || 0;
        finalDraftPosts = draftPosts || 0;
        console.log('📊 Detailed stats from DB:', { finalScheduledPosts, finalPublishedPosts, finalDraftPosts });
      }

      const finalStats = {
        totalPosts: finalTotalPosts,
        scheduledPosts: finalScheduledPosts,
        publishedPosts: finalPublishedPosts,
        draftPosts: finalDraftPosts
      };
      
      console.log('✅ Setting final stats:', finalStats);
      setStats(finalStats);
    } catch (error) {
      console.error('❌ Error in loadDashboardStats:', error);
      // Fallback to localStorage on any error
      console.log('🔄 Falling back to localStorage due to error...');
      const savedPosts = JSON.parse(localStorage.getItem('posts') || '[]');
      const fallbackStats = {
        totalPosts: savedPosts.length,
        scheduledPosts: savedPosts.filter((post: any) => post.status === 'scheduled').length,
        publishedPosts: savedPosts.filter((post: any) => post.status === 'published').length,
        draftPosts: savedPosts.filter((post: any) => post.status === 'draft').length
      };
      console.log('📊 Fallback stats:', fallbackStats);
      setStats(fallbackStats);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Helper function to get default credits for each plan
  const getDefaultCreditsForPlan = (plan: string): number => {
    switch (plan) {
      case 'free':
        return 3
      case 'starter':
        return 30
      case 'growth':
        return 100
      case 'scale':
        return 500
      default:
        return 3 // Default to free plan credits
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{ __html: lineClampStyles }} />
      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4 sm:p-8 relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">What do you want to create?</h2>
            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-start text-base sm:text-lg py-3 sm:py-4"
                onClick={() => { 
                  analytics.trackFeatureUsage('Single Post Creation');
                  // Track with Meta Pixel
                  analytics.metaPixelEvents.viewContent({
                    content_name: 'Single Post Creation',
                    content_category: 'Feature Usage',
                    value: 0,
                    currency: 'USD'
                  });
                  // Track with Google Ads (smart detection)
                  analytics.trackSmartFeatureUsage('single_post_creation');
                  setShowCreateModal(false); 
                  router.push('/ai/generate'); 
                }}
              >
                <Image className="h-5 w-5 mr-2" /> Single Post
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full justify-start text-base sm:text-lg py-3 sm:py-4"
                onClick={() => { 
                  analytics.trackFeatureUsage('Weekly Posts Creation');
                  setShowCreateModal(false); 
                  router.push('/ai/weekly'); 
                }}
              >
                <Calendar className="h-5 w-5 mr-2" /> Weekly Posts
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start text-base sm:text-lg py-3 sm:py-4"
                onClick={() => { 
                  analytics.trackFeatureUsage('Monthly Posts Creation');
                  setShowCreateModal(false); 
                  router.push('/ai/monthly'); 
                }}
              >
                <BarChart3 className="h-5 w-5 mr-2" /> Monthly Posts
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Header & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 sm:mb-8 gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome{profile ? `, ${profile.business_name}` : ''}!</h1>
            <p className="text-gray-600 text-xs sm:text-sm">Your social media command center</p>
          </div>
          
          {/* Action Buttons Grid - 4 in a row, right-aligned */}
          <div className="flex flex-col items-end gap-4">
            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button 
                onClick={() => {
                  analytics.trackFeatureUsage('Create Post Button Clicked');
                  // Also track with GTM for enhanced analytics
                  analytics.gtmEvent('dashboard_action', {
                    action: 'create_post_clicked',
                    page_section: 'dashboard_header',
                    user_type: user?.user_metadata?.plan || 'free'
                  });
                  setShowCreateModal(true);
                }} 
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2.5 rounded-lg font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
              <Button 
                onClick={() => {
                  analytics.trackFeatureUsage('Add Media Navigation');
                  router.push('/media');
                }} 
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2.5 rounded-lg font-medium"
              >
                <Image className="h-4 w-4 mr-2" />
                Add Media
              </Button>
              <Button 
                onClick={() => {
                  analytics.trackFeatureUsage('AI Enhanced Images Navigation');
                  // Track with GTM for ecommerce-style tracking
                  analytics.trackGTMFeatureUsage('ai_enhanced_images', {
                    feature_type: 'image_enhancement',
                    user_credits: enhancementCredits,
                    navigation_source: 'dashboard'
                  });
                  router.push('/enhanced-images');
                }} 
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2.5 rounded-lg font-medium"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Enhanced
              </Button>
              <Button 
                onClick={() => {
                  analytics.trackFeatureUsage('Content Calendar Navigation');
                  router.push('/calendar');
                }} 
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2.5 rounded-lg font-medium"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Content Calendar
              </Button>
            </div>
            
            {/* Stats and Settings Row */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 font-semibold text-xs sm:text-sm border border-purple-200 shadow-sm" title="Post generation credits remaining">
                <Sparkles className="h-4 w-4 mr-1" />
                {generationCount} Credits
              </span>
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-semibold text-xs sm:text-sm border border-blue-200 shadow-sm" title="AI image enhancement credits remaining">
                <Image className="h-4 w-4 mr-1" />
                {enhancementCredits} Enhancements
              </span>
              <Button 
                onClick={() => router.push('/settings')} 
                className="bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2.5 rounded-lg font-medium"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div 
            className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/posts')}
          >
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalPosts}</div>
            <div className="text-gray-600 text-sm">Total Posts</div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/posts?status=scheduled')}
          >
            <Clock className="h-8 w-8 text-yellow-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.scheduledPosts}</div>
            <div className="text-gray-600 text-sm">Scheduled</div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/posts?status=published')}
          >
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.publishedPosts}</div>
            <div className="text-gray-600 text-sm">Published</div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/posts?status=draft')}
          >
            <Eye className="h-8 w-8 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.draftPosts}</div>
            <div className="text-gray-600 text-sm">Drafts</div>
          </div>
        </div>

        {/* Social Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center gap-6">
            <Facebook className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Facebook</p>
              {metaConnected.facebook ? (
                <span className="text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1" />Connected{metaConnected.facebookName ? `: ${metaConnected.facebookName}` : ''}</span>
              ) : (
                <span className="text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />Not Connected</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center gap-6">
            <Instagram className="h-8 w-8 text-pink-500" />
            <div>
              <p className="font-medium text-gray-900">Instagram</p>
              {metaConnected.instagram ? (
                <span className="text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1" />Connected{metaConnected.instagramName ? `: ${metaConnected.instagramName}` : ''}</span>
              ) : (
                <span className="text-red-600 flex items-center"><X className="h-4 w-4 mr-1" />Not Connected</span>
              )}
            </div>
          </div>
        </div>

        {/* Content Calendar Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Content Calendar</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push('/calendar')}>View Full</Button>
          </div>
          
          <ContentCalendarGrid userId={user?.id} />
        </div>

        {/* Recent Drafts Section */}
        {stats.draftPosts > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Recent Drafts</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push('/posts?status=draft')}>View All Drafts</Button>
            </div>
            
            <RecentDraftsGrid userId={user?.id} />
          </div>
        )}

        {/* Quick Actions Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Quick Actions</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => router.push('/posts/editor')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Create New Post</div>
                  <div className="text-xs text-gray-500">Design and schedule content</div>
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => router.push('/media')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Image className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Manage Media</div>
                  <div className="text-xs text-gray-500">Upload and organize assets</div>
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => router.push('/posts')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">View All Posts</div>
                  <div className="text-xs text-gray-500">Manage your content library</div>
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={() => router.push('/enhanced-images')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-pink-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">AI Enhanced Images</div>
                  <div className="text-xs text-gray-500">View enhanced images</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContentInner />
    </Suspense>
  );
}

// Content Calendar Grid Component
function ContentCalendarGrid({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);

  useEffect(() => {
    const getWeekDates = () => {
      const today = new Date();
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        weekDates.push(date);
      }
      return weekDates;
    };

    setCurrentWeek(getWeekDates());
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Get posts for the current week
        const startOfWeek = currentWeek[0];
        const endOfWeek = new Date(currentWeek[6]);
        endOfWeek.setHours(23, 59, 59, 999);

        console.log('🔍 Fetching scheduled posts for week:', {
          userId,
          startOfWeek: startOfWeek.toISOString(),
          endOfWeek: endOfWeek.toISOString()
        });

        // Only fetch posts with 'scheduled' status for the content calendar
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'scheduled')
          .gte('scheduled_for', startOfWeek.toISOString())
          .lte('scheduled_for', endOfWeek.toISOString())
          .order('scheduled_for', { ascending: true });

        if (error) {
          console.error('❌ Error fetching posts:', error);
          setPosts([]);
        } else {
          console.log('✅ Posts fetched successfully:', data);
          // Debug video posts
          const videoPosts = data?.filter(post => post.media_url && post.media_url.match(/\.(mp4|mov|webm|avi|mkv)$/i)) || [];
          console.log('🎥 Video posts found:', videoPosts.length);
          videoPosts.forEach((post, index) => {
            console.log(`🎥 Video post ${index + 1}:`, {
              id: post.id,
              media_url: post.media_url,
              isVideo: post.media_url.match(/\.(mp4|mov|webm|avi|mkv)$/i) !== null,
              caption: post.caption?.slice(0, 30)
            });
          });
          setPosts(data || []);
        }
      } catch (error) {
        console.error('❌ Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId && currentWeek.length > 0) {
      fetchPosts();
    }
  }, [userId, currentWeek]);

  const getPostsForDay = (dayIndex: number) => {
    if (!currentWeek[dayIndex]) return [];
    
    const dayStart = new Date(currentWeek[dayIndex]);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentWeek[dayIndex]);
    dayEnd.setHours(23, 59, 59, 999);

    return posts.filter(post => {
      const postDate = new Date(post.scheduled_for);
      return postDate >= dayStart && postDate <= dayEnd;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getDayNumber = (date: Date) => {
    return date.getDate().toString().padStart(2, '0');
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if no posts found
  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No posts scheduled for this week</p>
          <p className="text-xs text-gray-400 mt-1">Create your first post to see it here</p>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => window.location.href = '/posts/editor'}
        >
          Create Your First Post
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Calendar Layout - Days on left, posts on right */}
      <div className="space-y-2">
        {currentWeek.map((date, dayIndex) => {
          const dayPosts = getPostsForDay(dayIndex);
          const isTodayDate = isToday(date);
          
          return (
            <div key={dayIndex} className="flex gap-4">
              {/* Day Column */}
              <div className="w-24 flex-shrink-0">
                <div className={`text-sm font-medium px-3 py-2 rounded ${isTodayDate ? 'bg-yellow-100 text-yellow-800' : 'text-gray-600'}`}>
                  {getDayName(date)} - {getDayNumber(date)}
                </div>
              </div>
              
              {/* Posts Row */}
              <div className="flex-1 overflow-hidden">
                {dayPosts.length > 0 ? (
                  <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {dayPosts.map((post, postIndex) => (
                      <div key={postIndex} className="flex-shrink-0 w-64">
                        <ContentCalendarPost 
                          post={{
                            id: post.id,
                            platform: post.platform || 'multi',
                            userIcon: post.user_avatar || '/api/placeholder/32/32',
                            tags: post.tags ? JSON.parse(post.tags) : [],
                            headline: post.caption?.slice(0, 50) + '...' || 'No caption',
                            image: post.media_url || post.thumbnail_url || '/api/placeholder/200/150',
                            isVideo: post.media_url ? post.media_url.match(/\.(mp4|mov|webm|avi|mkv)$/i) !== null : false,
                            engagement: post.status === 'published' ? {
                              likes: post.likes || 0,
                              shares: post.shares || 0,
                              comments: post.comments || 0
                            } : null
                          }}
                          time={formatTime(post.scheduled_for)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs py-2">No posts scheduled</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Recent Drafts Grid Component
function RecentDraftsGrid({ userId }: { userId: string }) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrafts = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Get recent draft posts (limit to 3)
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) {
          console.error('❌ Error fetching drafts:', error);
          setDrafts([]);
        } else {
          console.log('✅ Drafts fetched successfully:', data);
          setDrafts(data || []);
        }
      } catch (error) {
        console.error('❌ Error fetching drafts:', error);
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDrafts();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No drafts found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {drafts.map((draft) => (
        <div key={draft.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              {new Date(draft.created_at).toLocaleDateString()}
            </span>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              Draft
            </span>
          </div>
          
          {/* Post Thumbnail */}
          <div className="relative mb-3">
            {draft.media_url ? (
              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                {draft.media_url.match(/\.(mp4|mov|webm|avi|mkv)$/i) ? (
                  <video
                    src={draft.media_url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    onError={(e) => {
                      // Fallback to placeholder if video fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <img
                    src={draft.media_url}
                    alt="Draft thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                )}
                <div className="w-full h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center hidden">
                  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
                    <Image className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
                  <Image className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            {draft.media_url && draft.media_url.match(/\.(mp4|mov|webm|avi|mkv)$/i) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 bg-opacity-80 rounded-full flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
            {draft.caption?.slice(0, 60) + '...' || 'No caption'}
          </p>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.href = `/posts/editor?postId=${draft.id}`}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.href = `/posts?status=draft`}
            >
              View All
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Content Calendar Post Component
interface ContentCalendarPostProps {
  post: Post;
  time: string;
}

function ContentCalendarPost({ post, time }: ContentCalendarPostProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/posts?postId=${post.id}`);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">𝕏</span></div>;
      case 'facebook':
        return <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"><Facebook className="h-3 w-3 text-white" /></div>;
      case 'instagram':
        return <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"><Instagram className="h-3 w-3 text-white" /></div>;
      default:
        return <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">M</span></div>;
    }
  };

  const getTagColor = (tag: string) => {
    const colors: { [key: string]: string } = {
      'Monday morning': 'bg-green-100 text-green-800',
      'Promotion': 'bg-pink-100 text-pink-800',
      'Citrus madness': 'bg-yellow-100 text-yellow-800',
      'Recipes': 'bg-gray-100 text-gray-800',
      'Wellbeing': 'bg-gray-100 text-gray-800'
    };
    return colors[tag] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200" onClick={handleCardClick}>
      {/* Time */}
      <div className="text-xs text-gray-500 mb-2">{time}</div>
      
      {/* User Icon and Platform */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center">
          <Users className="h-3 w-3 text-gray-600" />
        </div>
        {getPlatformIcon(post.platform)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {post.tags.map((tag) => (
          <span key={tag} className={`text-xs px-2 py-1 rounded-full ${getTagColor(tag)}`}>
            {tag}
          </span>
        ))}
      </div>

      {/* Headline */}
      <div className="text-xs font-medium text-gray-900 mb-2 line-clamp-2">
        {post.headline}
      </div>

      {/* Image/Video Thumbnail */}
      <div className="relative mb-2">
        {post.image && post.image !== '/api/placeholder/200/150' ? (
          <div className="w-full h-20 rounded-lg overflow-hidden bg-gray-100">
            {post.isVideo ? (
              <video
                src={post.image}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                onError={(e) => {
                  // Fallback to placeholder if video fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <img
                src={post.image}
                alt="Post thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            )}
            <div className="w-full h-20 bg-gradient-to-br from-orange-200 to-pink-200 rounded-lg flex items-center justify-center hidden">
              <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                <Image className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-20 bg-gradient-to-br from-orange-200 to-pink-200 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
              <Image className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        {post.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-blue-500 bg-opacity-80 rounded-full flex items-center justify-center">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Engagement or Actions */}
      {post.engagement ? (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{post.engagement.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            <span>{post.engagement.shares}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{post.engagement.comments}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-gray-100 rounded">
            <Edit className="h-3 w-3 text-gray-500" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MessageCircle className="h-3 w-3 text-gray-500" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Trash2 className="h-3 w-3 text-gray-500" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="h-3 w-3 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}