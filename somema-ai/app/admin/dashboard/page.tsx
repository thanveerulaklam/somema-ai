'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  RefreshCw, 
  Download, 
  Settings,
  LogOut,
  Shield
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    paidUsers: 0,
    mrr: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    planDistribution: {},
    subscriptions: { activeSubscriptions: 0 },
    creditUsage: { totalCreditsUsed: 0 },
    locationStats: {
      totalWithLocation: 0,
      totalWithoutLocation: 0,
      topCountries: [],
      topStates: [],
      topCities: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const router = useRouter();

  // Only this UUID can access admin
  const ALLOWED_ADMIN_UUID = '7c12a35b-353c-43ff-808b-f1c574df69e0';

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Dashboard user check:', { 
        user: user ? { id: user.id, email: user.email } : null,
        allowedId: ALLOWED_ADMIN_UUID,
        matches: user ? user.id === ALLOWED_ADMIN_UUID : false
      });
      
      if (!user) {
        console.error('No user found, redirecting to login');
        router.push('/admin/login');
        return;
      }

      // Check if this user is the allowed admin
      if (user.id !== ALLOWED_ADMIN_UUID) {
        console.error('User ID mismatch, redirecting to login');
        router.push('/admin/login');
        return;
      }

      // Verify admin role in database
      const { data: adminInfo, error: adminError } = await supabase
        .rpc('get_user_admin_info', { user_uuid: user.id });

      console.log('Dashboard admin check:', { adminInfo, adminError });

      if (adminError) {
        console.error('Admin check error:', adminError);
        router.push('/admin/login');
        return;
      }

      // The function returns an array, so we need to check the first element
      if (!adminInfo || !Array.isArray(adminInfo) || adminInfo.length === 0) {
        console.error('Admin info not found or invalid format');
        router.push('/admin/login');
        return;
      }

      const adminData = adminInfo[0];
      if (!adminData.is_admin) {
        console.error('User is not admin:', adminData);
        router.push('/admin/login');
        return;
      }

      console.log('Admin access verified successfully');

      setUser(user);
      loadAnalytics();
      
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/admin/login');
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          dateRange,
          includeDetails: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load analytics');
      }

      const data = await response.json();
      setStats(data);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const refreshData = () => {
    loadAnalytics();
  };

  const exportData = () => {
    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Analytics Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportData}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-4">
            <a
              href="/admin/users"
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </a>
            <a
              href="/admin/setup"
              className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Security Setup</span>
            </a>
          </nav>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend={stats.newUsersToday}
            trendLabel="new today"
            color="blue"
          />
          <MetricCard
            title="Paid Users"
            value={stats.paidUsers.toLocaleString()}
            icon={CreditCard}
            trend={((stats.paidUsers / stats.totalUsers) * 100).toFixed(1)}
            trendLabel="% of total"
            color="green"
          />
          <MetricCard
            title="Monthly Revenue (MRR)"
            value={`₹${stats.mrr.toLocaleString()}`}
            icon={DollarSign}
            trend={stats.totalRevenue}
            trendLabel="total revenue"
            color="purple"
            trendPrefix="₹"
          />
          <MetricCard
            title="Active Subscriptions"
            value={stats.subscriptions.activeSubscriptions.toLocaleString()}
            icon={CheckCircle}
            trend={stats.subscriptions.activeSubscriptions}
            trendLabel="active"
            color="indigo"
          />
        </div>

        {/* Location Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Users with Location"
            value={stats.locationStats?.totalWithLocation?.toLocaleString() || '0'}
            icon={BarChart3}
            trend={stats.locationStats?.totalWithLocation > 0 
              ? ((stats.locationStats.totalWithLocation / (stats.totalUsers || 1)) * 100).toFixed(1)
              : 0
            }
            trendLabel="% coverage"
            color="indigo"
          />
          <MetricCard
            title="Countries"
            value={Object.keys(stats.locationStats?.countries || {}).length.toString()}
            icon={BarChart3}
            trend={stats.locationStats?.topCountries?.length > 0 ? stats.locationStats.topCountries[0]?.country : 'N/A'}
            trendLabel="top country"
            color="blue"
          />
          <MetricCard
            title="Cities"
            value={Object.keys(stats.locationStats?.cities || {}).length.toString()}
            icon={BarChart3}
            trend={stats.locationStats?.topCities?.length > 0 ? stats.locationStats.topCities[0]?.city : 'N/A'}
            trendLabel="top city"
            color="green"
          />
        </div>

        {/* AI Usage Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="GPT Image Requests"
            value={stats.aiUsage?.gptImage1Requests?.toLocaleString() || '0'}
            icon={Activity}
            trend={stats.totalCosts?.gptImage1 || 0}
            trendLabel="cost"
            color="orange"
            trendPrefix="$"
          />
          <MetricCard
            title="Image Analysis"
            value={stats.aiUsage?.imageAnalysisRequests?.toLocaleString() || '0'}
            icon={Activity}
            trend={stats.totalCosts?.imageAnalysis || 0}
            trendLabel="cost"
            color="teal"
            trendPrefix="$"
          />
          <MetricCard
            title="Caption Generation"
            value={stats.aiUsage?.captionGenerationRequests?.toLocaleString() || '0'}
            icon={Activity}
            trend={stats.totalCosts?.captionGeneration || 0}
            trendLabel="cost"
            color="pink"
            trendPrefix="$"
          />
          <MetricCard
            title="Total AI Cost"
            value={`₹${((stats.totalCosts?.total || 0) * 83).toFixed(2)}`}
            icon={DollarSign}
            trend={stats.aiUsage?.totalTokens || 0}
            trendLabel="tokens used"
            color="red"
          />
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              User Growth
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Users Today</span>
                <span className="font-semibold text-green-600">{stats.newUsersToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Users This Week</span>
                <span className="font-semibold text-blue-600">{stats.newUsersThisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Users This Month</span>
                <span className="font-semibold text-purple-600">{stats.newUsersThisMonth}</span>
              </div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Plan Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.planDistribution).map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{plan}</span>
                  <span className="font-semibold">{count as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credit Usage & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Credit Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-600" />
              Credit Usage
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Credits Used</span>
                <span className="font-semibold">{stats.creditUsage.totalCreditsUsed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Recent Activity
            </h3>
            <div className="text-gray-600 text-sm">
              <p>Dashboard loaded successfully</p>
              <p>Last updated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* AI Usage Analytics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-600" />
            AI Usage Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats.aiUsage?.gptImage1Requests?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-orange-700">GPT Image Requests</div>
              <div className="text-xs text-orange-600 mt-1">
                Cost: ₹{((stats.totalCosts?.gptImage1 || 0) * 83).toFixed(2)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">
                {stats.aiUsage?.imageAnalysisRequests?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-teal-700">Image Analysis</div>
              <div className="text-xs text-teal-600 mt-1">
                Cost: ₹{((stats.totalCosts?.imageAnalysis || 0) * 83).toFixed(2)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">
                {stats.aiUsage?.captionGenerationRequests?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-pink-700">Caption Generation</div>
              <div className="text-xs text-pink-600 mt-1">
                Cost: ₹{((stats.totalCosts?.captionGeneration || 0) * 83).toFixed(2)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats.aiUsage?.hashtagGenerationRequests?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-red-700">Hashtag Generation</div>
              <div className="text-xs text-red-600 mt-1">
                Cost: ₹{((stats.totalCosts?.hashtagGeneration || 0) * 83).toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {stats.aiUsage?.totalTokens?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600">Total Tokens Used</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{((stats.totalCosts?.total || 0) * 83).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total AI Cost</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  ₹{(((stats.totalCosts?.total || 0) * 83) / (stats.totalUsers || 1)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Cost Per User</div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Analytics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
            User Location Analytics
          </h3>
          
          {/* Location Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.locationStats?.totalWithLocation || 0}
              </div>
              <div className="text-sm text-indigo-700">Users with Location</div>
              <div className="text-xs text-indigo-600 mt-1">
                {stats.locationStats?.totalWithLocation > 0 
                  ? `${((stats.locationStats.totalWithLocation / (stats.totalUsers || 1)) * 100).toFixed(1)}% of total`
                  : 'No location data'
                }
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(stats.locationStats?.countries || {}).length}
              </div>
              <div className="text-sm text-blue-700">Countries</div>
              <div className="text-xs text-blue-600 mt-1">
                {stats.locationStats?.topCountries?.length > 0 
                  ? `Top: ${stats.locationStats.topCountries[0]?.country}`
                  : 'No data'
                }
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(stats.locationStats?.cities || {}).length}
              </div>
              <div className="text-sm text-green-700">Cities</div>
              <div className="text-xs text-green-600 mt-1">
                {stats.locationStats?.topCities?.length > 0 
                  ? `Top: ${stats.locationStats.topCities[0]?.city}`
                  : 'No data'
                }
              </div>
            </div>
          </div>

          {/* Top Locations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Countries */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                Top Countries
              </h4>
              <div className="space-y-2">
                {stats.locationStats?.topCountries?.slice(0, 5).map((item: any, index: number) => (
                  <div key={item.country} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.country}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-xs text-green-600">
                        ₹{(item.revenue * 83).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats.locationStats?.topCountries || stats.locationStats.topCountries.length === 0) && (
                  <div className="text-gray-500 text-sm text-center py-4">No location data available</div>
                )}
              </div>
            </div>

            {/* Top States */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Top States/Provinces
              </h4>
              <div className="space-y-2">
                {stats.locationStats?.topStates?.slice(0, 5).map((item: any, index: number) => (
                  <div key={item.state} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.state}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-xs text-green-600">
                        ₹{(item.revenue * 83).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats.locationStats?.topStates || stats.locationStats.topStates.length === 0) && (
                  <div className="text-gray-500 text-sm text-center py-4">No location data available</div>
                )}
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Top Cities
              </h4>
              <div className="space-y-2">
                {stats.locationStats?.topCities?.slice(0, 5).map((item: any, index: number) => (
                  <div key={item.city} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.city}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-xs text-green-600">
                        ₹{(item.revenue * 83).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats.locationStats?.topCities || stats.locationStats.topCities.length === 0) && (
                  <div className="text-gray-500 text-sm text-center py-4">No location data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Location Data Quality */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-yellow-800">Location Data Quality</h4>
                <p className="text-sm text-yellow-700">
                  {stats.locationStats?.totalWithLocation > 0 
                    ? `${((stats.locationStats.totalWithLocation / (stats.totalUsers || 1)) * 100).toFixed(1)}% of users have provided location information`
                    : 'No users have provided location information yet'
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-yellow-800">
                  {stats.locationStats?.totalWithLocation || 0} / {stats.totalUsers || 0}
                </div>
                <div className="text-sm text-yellow-600">Users with location</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon: Icon, trend, trendLabel, color, trendPrefix = '' }: any) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
    orange: 'text-orange-600',
    teal: 'text-teal-600',
    pink: 'text-pink-600',
    red: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-gray-100 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-600">
            {trendPrefix}{trend} {trendLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
