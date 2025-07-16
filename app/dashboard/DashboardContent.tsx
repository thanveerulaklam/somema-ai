'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
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
      {/* ...rest of your dashboard UI... */}
      {/* (Paste your existing dashboard JSX here) */}
    </div>
  );
}