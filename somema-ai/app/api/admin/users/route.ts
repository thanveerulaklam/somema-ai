import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiMiddleware } from '../../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await apiMiddleware(request, {
      requireAuth: true,
      requireAdmin: true,
      rateLimit: {
        maxRequests: 50,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    });

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';
    const status = searchParams.get('status') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        business_name,
        industry,
        subscription_plan,
        subscription_status,
        image_enhancement_credits,
        post_generation_credits,
        city,
        state,
        country,
        created_at,
        updated_at
      `);

    // Apply filters
    if (search) {
      query = query.or(`business_name.ilike.%${search}%,industry.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,country.ilike.%${search}%`);
    }

    if (plan && plan !== 'all') {
      query = query.eq('subscription_plan', plan);
    }

    if (status && status !== 'all') {
      query = query.eq('subscription_status', status);
    }

    if (location && location !== 'all') {
      if (location === 'with_location') {
        query = query.or('city.not.is.null,state.not.is.null,country.not.is.null');
      } else if (location === 'without_location') {
        query = query.is('city', null).is('state', null).is('country', null);
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      throw usersError;
    }

    // Get total count for pagination
    let totalCount = 0;
    if (count !== null) {
      totalCount = count;
    } else {
      const { count: total } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      totalCount = total || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await apiMiddleware(request, {
      requireAuth: true,
      requireAdmin: true,
      rateLimit: {
        maxRequests: 20,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    });

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json({ error: 'User ID and updates are required' }, { status: 400 });
    }

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await apiMiddleware(request, {
      requireAuth: true,
      requireAdmin: true,
      rateLimit: {
        maxRequests: 10,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    });

    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete user profile
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
