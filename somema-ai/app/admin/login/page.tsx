'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Only this UUID can access admin
  const ALLOWED_ADMIN_UUID = '7c12a35b-353c-43ff-808b-f1c574df69e0';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Login failed');
        setLoading(false);
        return;
      }

      // Check if this user is the allowed admin
      console.log('User ID check:', { 
        userId: authData.user.id, 
        allowedId: ALLOWED_ADMIN_UUID,
        matches: authData.user.id === ALLOWED_ADMIN_UUID 
      });
      
      if (authData.user.id !== ALLOWED_ADMIN_UUID) {
        setError('Access denied. Only authorized administrators can access this area.');
        // Sign out the unauthorized user
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Verify admin role in database
      const { data: adminInfo, error: adminError } = await supabase
        .rpc('get_user_admin_info', { user_uuid: authData.user.id });

      console.log('Admin check result:', { adminInfo, adminError });

      if (adminError) {
        console.error('Admin check error:', adminError);
        setError('Failed to verify admin privileges');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // The function returns an array, so we need to check the first element
      if (!adminInfo || !Array.isArray(adminInfo) || adminInfo.length === 0) {
        setError('Admin privileges not found. Contact system administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const adminData = adminInfo[0];
      if (!adminData.is_admin) {
        setError('Admin privileges not found. Contact system administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('Admin check successful, proceeding to dashboard...');
      
      // Try to log admin action (optional - don't fail if function doesn't exist)
      try {
        await supabase.rpc('log_admin_action', {
          action_name: 'admin_login',
          resource_type: 'auth',
          action_details: { 
            timestamp: new Date().toISOString(),
            ip_address: 'client_ip',
            user_agent: navigator.userAgent
          }
        });
        console.log('Admin action logged successfully');
      } catch (logError) {
        console.log('Admin action logging failed (non-critical):', logError);
      }

      // Show success message and redirect
      setSuccess('Login successful! Redirecting to admin dashboard...');
      setLoading(false);
      
      // Redirect to admin dashboard using window.location for more reliable redirect
      console.log('Redirecting to admin dashboard...');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Access Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access the admin dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="admin@yourdomain.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-12 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      {success}
                    </h3>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => window.location.href = '/admin/dashboard'}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Go to Admin Dashboard Now
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Sign in to Admin'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Only authorized administrators can access this area
          </p>
        </div>
      </div>
    </div>
  );
}
