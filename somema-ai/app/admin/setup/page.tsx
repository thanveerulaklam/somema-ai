'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { getCurrentUser } from '../../../lib/auth-utils';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Database,
  Key,
  Users,
  Settings
} from 'lucide-react';

interface AdminSetupStatus {
  databaseReady: boolean;
  adminTablesExist: boolean;
  userHasRole: boolean;
  isSuperAdmin: boolean;
  systemSecure: boolean;
}

export default function AdminSetupPage() {
  const [user, setUser] = useState<any>(null);
  const [setupStatus, setSetupStatus] = useState<AdminSetupStatus>({
    databaseReady: false,
    adminTablesExist: false,
    userHasRole: false,
    isSuperAdmin: false,
    systemSecure: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const router = useRouter();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Check if admin tables exist
      const { data: adminRoles, error: rolesError } = await supabase
        .from('admin_roles')
        .select('id')
        .limit(1);

      const { data: adminInvitations, error: invitationsError } = await supabase
        .from('admin_invitations')
        .select('id')
        .limit(1);

      const { data: adminAuditLogs, error: auditError } = await supabase
        .from('admin_audit_logs')
        .select('id')
        .limit(1);

      // Check if user has admin role
      const { data: adminInfo, error: adminError } = await supabase
        .rpc('get_user_admin_info', { user_uuid: user.id });

      setSetupStatus({
        databaseReady: true,
        adminTablesExist: !rolesError && !invitationsError && !auditError,
        userHasRole: adminInfo && adminInfo.is_admin,
        isSuperAdmin: adminInfo && adminInfo.is_super_admin,
        systemSecure: adminInfo && adminInfo.is_admin
      });

    } catch (error) {
      console.error('Setup status check failed:', error);
      setError('Failed to check setup status');
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      // This would typically be done through a secure API endpoint
      // For now, we'll show instructions
      setSetupStep(2);
      
    } catch (error) {
      console.error('Database setup failed:', error);
      setError('Database setup failed');
    } finally {
      setLoading(false);
    }
  };

  const createSuperAdmin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userEmail) {
        setError('Please enter an email address');
        return;
      }

      // Find user by email - we'll need to create an API endpoint for this
      // For now, let's use the current user's ID as a placeholder
      // In production, you'd create an API endpoint to look up users by email
      setError('Email lookup not implemented yet. Please use the direct user ID approach.');
      return;

      // Grant super admin access
      const { data: grantResult, error: grantError } = await supabase
        .rpc('grant_admin_access', {
          target_user_id: user.id, // Use current user's ID
          role_type: 'super_admin'
        });

      if (grantError || !grantResult) {
        setError('Failed to grant super admin access');
        return;
      }

      setSetupStep(3);
      await checkSetupStatus();

    } catch (error) {
      console.error('Create super admin failed:', error);
      setError('Failed to create super admin');
    } finally {
      setLoading(false);
    }
  };

  const inviteAdmin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!inviteEmail || !inviteRole) {
        setError('Please fill in all fields');
        return;
      }

      // Create admin invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('admin_invitations')
        .insert({
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id,
          invitation_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (inviteError || !invitation) {
        setError('Failed to create invitation');
        return;
      }

      setError(null);
      setInviteEmail('');
      alert(`Admin invitation sent to ${inviteEmail}`);

    } catch (error) {
      console.error('Invite admin failed:', error);
      setError('Failed to invite admin');
    } finally {
      setLoading(false);
    }
  };

  const goToAdminDashboard = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking admin setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Security Setup</h1>
            <p className="text-gray-600">Secure your admin system with role-based access control</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Setup Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            System Security Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Database Ready</span>
              {setupStatus.databaseReady ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Admin Tables</span>
              {setupStatus.adminTablesExist ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">User Has Role</span>
              {setupStatus.userHasRole ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Super Admin</span>
              {setupStatus.isSuperAdmin ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>

          {setupStatus.systemSecure && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">✅ System is secure and ready!</span>
              </div>
              <button
                onClick={goToAdminDashboard}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Go to Admin Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Setup Steps */}
        {!setupStatus.systemSecure && (
          <div className="space-y-6">
            {/* Step 1: Database Setup */}
            {setupStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Database Setup</h3>
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Database Setup Required</h4>
                      <p className="text-yellow-700 mt-1">
                        You need to run the SQL script to create the admin security tables.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                    <li>Navigate to <strong>SQL Editor</strong></li>
                    <li>Copy and paste the contents of <code className="bg-gray-100 px-2 py-1 rounded">add-admin-security.sql</code></li>
                    <li>Update <code className="bg-gray-100 px-2 py-1 rounded">YOUR_USER_ID_HERE</code> with your actual user ID</li>
                    <li>Run the script</li>
                  </ol>
                </div>

                <button
                  onClick={runDatabaseSetup}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  I've Run the Database Setup
                </button>
              </div>
            )}

            {/* Step 2: Create Super Admin */}
            {setupStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Create Super Admin</h3>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Super Admin Already Created!</h4>
                      <p className="text-blue-700 mt-1">
                        The SQL script has already created you as a super admin with user ID: 
                        <code className="bg-blue-100 px-2 py-1 rounded ml-2">{user?.id}</code>
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSetupStep(3)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Continue to Next Step
                </button>
              </div>
            )}

            {/* Step 3: Invite Additional Admins */}
            {setupStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Invite Additional Admins (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address:
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="admin@yourdomain.com"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role:
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={inviteAdmin}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Send Admin Invitation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security Features */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Security Features Implemented
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Role-Based Access Control</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• User roles: user, admin, super_admin</li>
                <li>• Granular permissions system</li>
                <li>• Role expiration dates</li>
                <li>• Permission-based feature access</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Security Measures</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Row Level Security (RLS)</li>
                <li>• Admin action audit logging</li>
                <li>• Secure invitation system</li>
                <li>• Session validation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Admin Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Only super admins can grant roles</li>
                <li>• Users cannot promote themselves</li>
                <li>• Admin access can be revoked</li>
                <li>• Invitation-based onboarding</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Audit & Monitoring</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All admin actions logged</li>
                <li>• IP address tracking</li>
                <li>• User agent logging</li>
                <li>• Action history and reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Database Setup Issues</h4>
              <p className="text-blue-700 text-sm">
                If you get errors running the SQL script, make sure you have the necessary permissions 
                and that the <code className="bg-blue-100 px-1 rounded">uuid-ossp</code> extension is enabled.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Permission Issues</h4>
              <p className="text-yellow-700 text-sm">
                After setup, you may need to refresh your session or logout/login again 
                for the new permissions to take effect.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Need Help?</h4>
              <p className="text-green-700 text-sm">
                Check the <code className="bg-green-100 px-1 rounded">ADMIN_SETUP.md</code> file for detailed 
                setup instructions and security best practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
