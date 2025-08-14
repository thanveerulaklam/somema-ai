import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ data: { user: null } });
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.json({ data: { user: null } });
    }

    return NextResponse.json({ data: { user } });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ data: { user: null } });
  }
} 