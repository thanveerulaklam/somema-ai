'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, 
  Image, 
  BarChart3, 
  Settings, 
  Plus,
  Instagram,
  Facebook,
  TrendingUp,
  Users,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';

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
  totalEngagement: number;
}

export default function DashboardContent() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalEngagement: 0
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [metaConnected, setMetaConnected] = useState<{ instagram: boolean; facebook: boolean; facebookName?: string; instagramName?: string }>({ instagram: false, facebook: false });
  const router = useRouter();
  const searchParams = useSearchParams();

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

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Get user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        router.push('/onboarding');
        return;
      }

      // Get dashboard stats
      await loadDashboardStats(user.id);
      setLoading(false);
    };
    getUser();

    // Check Meta connection status
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
    checkMetaConnection();
  }, [router]);

  const loadDashboardStats = async (userId: string) => {
    try {
      // Try to get posts from database first
      const { count: totalPosts, error: dbError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      let finalTotalPosts = totalPosts || 0;
      let finalScheduledPosts = 0;
      let finalPublishedPosts = 0;
      let finalTotalEngagement = 0;

      if (dbError || totalPosts === 0) {
        // Fallback to localStorage
        const savedPosts = JSON.parse(localStorage.getItem('somema_draft_posts') || '[]');
        const userPosts = savedPosts.filter((post: any) => post.user_id === userId);
        finalTotalPosts = userPosts.length;
        finalScheduledPosts = userPosts.filter((post: any) => post.status === 'scheduled').length;
        finalPublishedPosts = userPosts.filter((post: any) => post.status === 'published').length;
      } else {
        // Get additional stats from database
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

        finalScheduledPosts = scheduledPosts || 0;
        finalPublishedPosts = publishedPosts || 0;

        // Get total engagement (sum of all engagement metrics)
        const { data: posts } = await supabase
          .from('posts')
          .select('engagement_metrics')
          .eq('user_id', userId)
          .not('engagement_metrics', 'is', null);

        finalTotalEngagement = posts?.reduce((sum, post) => {
          const metrics = post.engagement_metrics || {};
          return sum + (metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0);
        }, 0) || 0;
      }

      setStats({
        totalPosts: finalTotalPosts,
        scheduledPosts: finalScheduledPosts,
        publishedPosts: finalPublishedPosts,
        totalEngagement: finalTotalEngagement
      });
    } catch (error) {
      // Fallback to localStorage on any error
      const savedPosts = JSON.parse(localStorage.getItem('somema_draft_posts') || '[]');
      const userPosts = savedPosts.filter((post: any) => post.user_id === userId);
      setStats({
        totalPosts: userPosts.length,
        scheduledPosts: userPosts.filter((post: any) => post.status === 'scheduled').length,
        publishedPosts: userPosts.filter((post: any) => post.status === 'published').length,
        totalEngagement: 0
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Somema.ai
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {profile?.business_name}
              </span>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <p className="text-green-800 text-sm">{message}</p>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/posts/schedule">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Plus className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Create Post</h3>
                    <p className="text-sm text-gray-600">Generate AI content</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/media">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Image className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Media Library</h3>
                    <p className="text-sm text-gray-600">Upload & manage images</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/calendar">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Content Calendar</h3>
                    <p className="text-sm text-gray-600">Schedule & plan posts</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/posts" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalPosts}</p>
                </div>
              </div>
            </Link>
            
            <Link href="/posts?status=scheduled" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.scheduledPosts}</p>
                </div>
              </div>
            </Link>
            
            <Link href="/posts?status=published" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.publishedPosts}</p>
                </div>
              </div>
            </Link>
            
            <Link href="/posts?status=engagement" className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Engagement</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalEngagement}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Connected Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Instagram className="h-6 w-6 text-pink-600" />
                  <span className={`ml-3 text-sm font-medium text-gray-900 ${metaConnected.instagram ? 'text-green-600' : 'text-gray-500'}`}>{metaConnected.instagram ? `Connected${metaConnected.instagramName ? ` as @${metaConnected.instagramName}` : ''}` : 'Not connected'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Facebook className="h-6 w-6 text-blue-600" />
                  <span className={`ml-3 text-sm font-medium text-gray-900 ${metaConnected.facebook ? 'text-green-600' : 'text-gray-500'}`}>{metaConnected.facebook ? `Connected${metaConnected.facebookName ? ` as ${metaConnected.facebookName}` : ''}` : 'Not connected'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <Link href="/analytics" className="text-sm text-blue-600 hover:text-blue-500">
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Your posts and analytics will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 