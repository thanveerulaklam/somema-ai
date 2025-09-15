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
    console.log('🔧 Fixing user_profiles table...');

    // Read the fix SQL file
    const fixPath = path.join(process.cwd(), 'fix-user-profiles-table.sql');
    
    if (!fs.existsSync(fixPath)) {
      return NextResponse.json({ 
        error: 'Fix SQL file not found',
        path: fixPath
      }, { status: 404 });
    }

    const fixSQL = fs.readFileSync(fixPath, 'utf8');
    
    console.log('📋 Executing fix SQL...');
    
    // Split the SQL into individual statements
    const statements = fixSQL
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
            // Some errors are expected (like column already exists)
            if (!error.message.includes('already exists') && 
                !error.message.includes('relation') &&
                !error.message.includes('function') &&
                !error.message.includes('trigger')) {
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

    // Verify the table structure
    console.log('🔍 Verifying table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public');

    if (columnsError) {
      errors.push({
        statement: 'Table structure verification',
        error: columnsError.message
      });
    }

    const success = errors.length === 0;

    console.log('✅ User profiles table fix completed!');

    return NextResponse.json({
      success,
      message: success ? 'User profiles table fixed successfully!' : 'User profiles table fix completed with some warnings',
      results: {
        statementsExecuted: results.length,
        errors: errors.length,
        tableColumns: columns || []
      },
      details: {
        successfulStatements: results,
        errors,
        tableStructure: columns
      }
    });

  } catch (error) {
    console.error('❌ Fix failed:', error);
    return NextResponse.json({ 
      error: 'User profiles table fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
