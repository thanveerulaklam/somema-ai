import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { 
  BarChart3, Calendar, CheckCircle, Facebook, Instagram, Plus, TrendingUp, X, Settings, FileText 
} from 'lucide-react';

const DashboardContent = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalEngagement: 0
  });
  const [metaConnected, setMetaConnected] = useState({
    facebook: false,
    facebookName: '',
    instagram: false,
    instagramName: ''
  });
  const [message, setMessage] = useState('');

  const handleSignOut = () => {
    // Implement sign out logic
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
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Welcome and Profile */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome{profile && profile.business_name ? `, ${profile.business_name}` : ''}!
            </h1>
            <p className="text-gray-600 text-sm">
              Manage your social media content, analyze performance, and connect your Meta accounts.
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center">
            <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalPosts}</div>
            <div className="text-gray-600 text-sm">Total Posts</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center">
            <Calendar className="h-8 w-8 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.scheduledPosts}</div>
            <div className="text-gray-600 text-sm">Scheduled</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.publishedPosts}</div>
            <div className="text-gray-600 text-sm">Published</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-pink-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalEngagement}</div>
            <div className="text-gray-600 text-sm">Engagement</div>
          </div>
        </div>

        {/* Meta Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Facebook className="h-5 w-5 text-blue-600 mr-2" />
            Meta Connections
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Facebook:</span>
              {metaConnected.facebook ? (
                <span className="text-green-600 flex items-center gap-1">Connected {metaConnected.facebookName ? `(${metaConnected.facebookName})` : ''} <CheckCircle className="h-4 w-4" /></span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">Not Connected <X className="h-4 w-4" /></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-500" />
              <span className="font-medium">Instagram:</span>
              {metaConnected.instagram ? (
                <span className="text-green-600 flex items-center gap-1">Connected {metaConnected.instagramName ? `(${metaConnected.instagramName})` : ''} <CheckCircle className="h-4 w-4" /></span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">Not Connected <X className="h-4 w-4" /></span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Link href="/settings">
              <Button variant="outline" size="sm">Manage Connections</Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-10">
          <Link href="/ai/generate">
            <Button><Plus className="h-4 w-4 mr-2" />Create Post</Button>
          </Link>
          <Link href="/posts">
            <Button variant="outline"><FileText className="h-4 w-4 mr-2" />View All Posts</Button>
          </Link>
          <Link href="/analytics">
            <Button variant="outline"><BarChart3 className="h-4 w-4 mr-2" />Analytics</Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline"><Calendar className="h-4 w-4 mr-2" />Calendar</Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline"><Settings className="h-4 w-4 mr-2" />Settings</Button>
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">{message}</div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent; 