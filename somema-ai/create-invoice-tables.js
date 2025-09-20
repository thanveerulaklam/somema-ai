const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🚀 Creating invoice tables...');

  try {
    // Create invoices table
    const { error: invoicesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          razorpay_invoice_id TEXT UNIQUE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          invoice_number TEXT UNIQUE NOT NULL,
          plan_id TEXT NOT NULL,
          billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one-time')),
          
          -- Customer Information
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT,
          customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
          
          -- Business Information (for GST compliance)
          business_name TEXT,
          gst_number TEXT,
          business_address JSONB,
          billing_address JSONB,
          
          -- Invoice Details
          base_amount INTEGER NOT NULL,
          tax_amount INTEGER DEFAULT 0,
          total_amount INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          
          -- GST Details
          gst_rate DECIMAL(5,2) DEFAULT 18.00,
          cgst_amount INTEGER DEFAULT 0,
          sgst_amount INTEGER DEFAULT 0,
          igst_amount INTEGER DEFAULT 0,
          is_export BOOLEAN DEFAULT FALSE,
          
          -- Invoice Status
          status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'expired')),
          due_date TIMESTAMP WITH TIME ZONE,
          paid_at TIMESTAMP WITH TIME ZONE,
          
          -- Razorpay Integration
          razorpay_payment_id TEXT,
          razorpay_order_id TEXT,
          
          -- Metadata
          invoice_data JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (invoicesError) {
      console.error('❌ Error creating invoices table:', invoicesError);
    } else {
      console.log('✅ Invoices table created successfully');
    }

    // Create invoice_items table
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS invoice_items (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
          item_name TEXT NOT NULL,
          item_description TEXT,
          quantity INTEGER DEFAULT 1,
          unit_price INTEGER NOT NULL,
          total_price INTEGER NOT NULL,
          tax_rate DECIMAL(5,2) DEFAULT 18.00,
          tax_amount INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (itemsError) {
      console.error('❌ Error creating invoice_items table:', itemsError);
    } else {
      console.log('✅ Invoice_items table created successfully');
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
        ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // Create RLS policies
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create RLS policies for invoices table
        CREATE POLICY IF NOT EXISTS "Users can view their own invoices" ON invoices
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can insert their own invoices" ON invoices
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can update their own invoices" ON invoices
          FOR UPDATE USING (auth.uid() = user_id);

        -- Create RLS policies for invoice_items table
        CREATE POLICY IF NOT EXISTS "Users can view their own invoice items" ON invoice_items
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM invoices 
              WHERE invoices.id = invoice_items.invoice_id 
              AND invoices.user_id = auth.uid()
            )
          );

        CREATE POLICY IF NOT EXISTS "Users can insert their own invoice items" ON invoice_items
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM invoices 
              WHERE invoices.id = invoice_items.invoice_id 
              AND invoices.user_id = auth.uid()
            )
          );
      `
    });

    if (policiesError) {
      console.error('❌ Error creating RLS policies:', policiesError);
    } else {
      console.log('✅ RLS policies created successfully');
    }

    console.log('🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTables();
