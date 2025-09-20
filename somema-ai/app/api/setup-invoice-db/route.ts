import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Setting up Razorpay Invoice + GST database schema...');

    // Read the SQL schema file
    const schemaPath = path.join(process.cwd(), 'razorpay-invoice-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({ 
        error: 'Schema file not found',
        path: schemaPath
      }, { status: 404 });
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing database schema...');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    const results = [];
    const errors = [];

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            // Some errors are expected (like table already exists)
            if (!error.message.includes('already exists') && 
                !error.message.includes('relation') &&
                !error.message.includes('function') &&
                !error.message.includes('policy')) {
              errors.push({
                statement: statement.substring(0, 100) + '...',
                error: error.message
              });
            }
          } else {
            results.push({
              statement: statement.substring(0, 100) + '...',
              success: true
            });
          }
        }
      } catch (err) {
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    
    const tables = [
      'invoices',
      'invoice_items', 
      'gst_registrations',
      'tax_settings',
      'user_profiles'
    ];

    const tableVerification = [];

    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (tableError) {
          tableVerification.push({
            table,
            status: 'error',
            error: tableError.message
          });
        } else {
          tableVerification.push({
            table,
            status: 'success'
          });
        }
      } catch (err) {
        tableVerification.push({
          table,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    const success = errors.length === 0 && tableVerification.every(t => t.status === 'success');

    console.log('✅ Database setup completed!');

    return NextResponse.json({
      success,
      message: success ? 'Database setup completed successfully!' : 'Database setup completed with some warnings',
      results: {
        statementsExecuted: results.length,
        errors: errors.length,
        tableVerification
      },
      details: {
        successfulStatements: results,
        errors,
        tableVerification
      }
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json({ 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
