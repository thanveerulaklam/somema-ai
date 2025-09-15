const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminAccess() {
  console.log('🔍 Testing Admin Access...\n');

  try {
    // Test 1: Check if admin_roles table exists
    console.log('1. Checking admin_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('admin_roles')
      .select('*')
      .limit(1);
    
    if (rolesError) {
      console.log('❌ admin_roles table error:', rolesError.message);
    } else {
      console.log('✅ admin_roles table exists');
      console.log('   Rows found:', roles?.length || 0);
    }

    // Test 2: Check if RPC functions exist
    console.log('\n2. Testing RPC functions...');
    
    // Test get_user_admin_info function
    const { data: adminInfo, error: adminError } = await supabase
      .rpc('get_user_admin_info', { user_uuid: '7c12a35b-353c-43ff-808b-f1c574df69e0' });
    
    if (adminError) {
      console.log('❌ get_user_admin_info error:', adminError.message);
    } else {
      console.log('✅ get_user_admin_info function works');
      console.log('   Admin info:', adminInfo);
    }

    // Test 3: Check your specific user
    console.log('\n3. Checking your user in admin_roles...');
    const { data: yourRole, error: yourRoleError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', '7c12a35b-353c-43ff-808b-f1c574df69e0')
      .single();
    
    if (yourRoleError) {
      console.log('❌ User role lookup error:', yourRoleError.message);
    } else {
      console.log('✅ Your admin role found:');
      console.log('   Role:', yourRole.role);
      console.log('   Permissions:', yourRole.permissions);
      console.log('   Is Active:', yourRole.is_active);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the test
testAdminAccess();
