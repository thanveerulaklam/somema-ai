#!/usr/bin/env node

/**
 * Setup script for Razorpay Invoice + GST database schema
 * Run this script to set up the required database tables and functions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Razorpay Invoice + GST database schema...\n');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'razorpay-invoice-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing database schema...');
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
      process.exit(1);
    }

    console.log('✅ Database schema executed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    
    const tables = [
      'invoices',
      'invoice_items', 
      'gst_registrations',
      'tax_settings',
      'user_profiles'
    ];

    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (tableError) {
        console.error(`❌ Error verifying table ${table}:`, tableError.message);
      } else {
        console.log(`✅ Table ${table} created successfully`);
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure Razorpay webhooks in your dashboard');
    console.log('2. Update your environment variables');
    console.log('3. Test the invoice creation flow');
    console.log('\n📖 See RAZORPAY_INVOICE_GST_SETUP.md for detailed instructions');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
