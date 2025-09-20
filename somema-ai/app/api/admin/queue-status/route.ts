import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Get queue statistics
    const { data: queueStats, error: statsError } = await supabase
      .from('post_queue')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (statsError) {
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total: queueStats?.length || 0,
      pending: queueStats?.filter(item => item.status === 'pending').length || 0,
      processing: queueStats?.filter(item => item.status === 'processing').length || 0,
      completed: queueStats?.filter(item => item.status === 'completed').length || 0,
      failed: queueStats?.filter(item => item.status === 'failed').length || 0,
      retrying: queueStats?.filter(item => item.status === 'retrying').length || 0,
    };

    // Get recent processing logs
    const { data: recentLogs, error: logsError } = await supabase
      .from('queue_processing_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    // Get failed posts that need attention
    const { data: failedPosts, error: failedError } = await supabase
      .from('post_queue')
      .select(`
        id,
        post_id,
        user_id,
        status,
        attempts,
        max_attempts,
        last_error,
        scheduled_for,
        created_at,
        posts!inner(caption, platform)
      `)
      .eq('status', 'failed')
      .lt('attempts', 3) // Posts that can still be retried
      .order('created_at', { ascending: false })
      .limit(20);

    if (failedError) {
      return NextResponse.json({ error: failedError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stats,
      recent_logs: recentLogs,
      failed_posts: failedPosts,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, queue_id } = await req.json();

    switch (action) {
      case 'retry_failed':
        // Retry a specific failed post
        const { data: retryResult, error: retryError } = await supabase
          .rpc('retry_failed_posts');
        
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Retried ${retryResult || 0} failed posts`
        });

      case 'retry_specific':
        // Retry a specific post by queue_id
        if (!queue_id) {
          return NextResponse.json({ error: 'queue_id is required' }, { status: 400 });
        }

        const { data: specificRetry, error: specificError } = await supabase
          .from('post_queue')
          .update({
            status: 'retrying',
            attempts: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', queue_id)
          .eq('status', 'failed');

        if (specificError) {
          return NextResponse.json({ error: specificError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Post queued for retry'
        });

      case 'clear_completed':
        // Clear completed posts older than 7 days
        const { data: clearResult, error: clearError } = await supabase
          .from('post_queue')
          .delete()
          .eq('status', 'completed')
          .lt('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (clearError) {
          return NextResponse.json({ error: clearError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Cleared old completed posts'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
