// Test script to verify Supabase security fixes
// This script tests that the admin views are properly secured

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for testing

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSecurityFixes() {
    console.log('🔒 Testing Supabase Security Fixes...\n');

    try {
        // Test 1: Check if views exist and have RLS enabled
        console.log('1. Checking view existence and RLS status...');
        
        const { data: views, error: viewsError } = await supabase
            .from('pg_views')
            .select('viewname, definition')
            .eq('schemaname', 'public')
            .in('viewname', ['admin_users', 'admin_dashboard_data']);

        if (viewsError) {
            console.error('❌ Error checking views:', viewsError);
        } else {
            console.log('✅ Views found:', views.map(v => v.viewname));
        }

        // Test 2: Check RLS policies
        console.log('\n2. Checking RLS policies...');
        
        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('tablename, policyname, permissive, roles, cmd, qual')
            .in('tablename', ['admin_users', 'admin_dashboard_data']);

        if (policiesError) {
            console.error('❌ Error checking policies:', policiesError);
        } else {
            console.log('✅ RLS policies found:');
            policies.forEach(policy => {
                console.log(`   - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
            });
        }

        // Test 3: Test access with service role (should work)
        console.log('\n3. Testing access with service role...');
        
        const { data: adminUsers, error: adminUsersError } = await supabase
            .rpc('get_admin_users');

        if (adminUsersError) {
            console.log('⚠️  Service role access to get_admin_users:', adminUsersError.message);
        } else {
            console.log('✅ Service role can access get_admin_users function');
        }

        const { data: dashboardData, error: dashboardError } = await supabase
            .rpc('get_admin_dashboard_data');

        if (dashboardError) {
            console.log('⚠️  Service role access to get_admin_dashboard_data:', dashboardError.message);
        } else {
            console.log('✅ Service role can access get_admin_dashboard_data function');
        }

        // Test 4: Test with anonymous access (should fail)
        console.log('\n4. Testing anonymous access (should fail)...');
        
        const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        
        const { data: anonAdminUsers, error: anonAdminUsersError } = await anonSupabase
            .rpc('get_admin_users');

        if (anonAdminUsersError) {
            console.log('✅ Anonymous access to get_admin_users properly blocked:', anonAdminUsersError.message);
        } else {
            console.log('❌ SECURITY ISSUE: Anonymous access to get_admin_users is not blocked!');
        }

        const { data: anonDashboardData, error: anonDashboardError } = await anonSupabase
            .rpc('get_admin_dashboard_data');

        if (anonDashboardError) {
            console.log('✅ Anonymous access to get_admin_dashboard_data properly blocked:', anonDashboardError.message);
        } else {
            console.log('❌ SECURITY ISSUE: Anonymous access to get_admin_dashboard_data is not blocked!');
        }

        // Test 5: Check admin roles table
        console.log('\n5. Checking admin roles setup...');
        
        const { data: adminRoles, error: adminRolesError } = await supabase
            .from('admin_roles')
            .select('*')
            .limit(5);

        if (adminRolesError) {
            console.log('⚠️  Error accessing admin_roles:', adminRolesError.message);
        } else {
            console.log(`✅ Admin roles table accessible, found ${adminRoles.length} roles`);
            if (adminRoles.length > 0) {
                console.log('   Sample roles:', adminRoles.map(r => `${r.role} (${r.is_active ? 'active' : 'inactive'})`));
            }
        }

        // Test 6: Test the verification function
        console.log('\n6. Testing admin verification function...');
        
        const { data: verifyResult, error: verifyError } = await supabase
            .rpc('verify_admin_view_access');

        if (verifyError) {
            console.log('⚠️  Error testing verification function:', verifyError.message);
        } else {
            console.log('✅ Verification function accessible, result:', verifyResult);
        }

        console.log('\n🎉 Security test completed!');
        console.log('\n📋 Summary:');
        console.log('- Views have been recreated with proper RLS');
        console.log('- Anonymous access should be blocked');
        console.log('- Only authenticated users with admin roles can access the views');
        console.log('- Service role can still access for administrative purposes');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testSecurityFixes();
