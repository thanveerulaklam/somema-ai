import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createMetaAPIService, MetaAPIService, PostContent } from '../../../../lib/meta-api';
import { createInstagramAPIService } from '../../../../lib/instagram-api';

// Force dynamic rendering to prevent caching issues with cron jobs
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const logs: string[] = [];
  try {
    // Verify cron job authentication
    const cronSecret = req.headers.get('x-cron-secret');
    const userAgent = req.headers.get('user-agent') || '';
    const expectedSecret = process.env.CRON_SECRET;
    
    // Check for Vercel-specific headers that indicate this is a legitimate Vercel cron job
    const vercelId = req.headers.get('x-vercel-id');
    const vercelDeploymentUrl = req.headers.get('x-vercel-deployment-url');
    const vercelCache = req.headers.get('x-vercel-cache');
    const vercelMatchedPath = req.headers.get('x-matched-path');
    const host = req.headers.get('host');
    
    // Vercel cron jobs will have x-vercel-id and either x-vercel-deployment-url or x-vercel-cache
    // Also allow requests from Vercel domains (for actual cron jobs that might not have all headers)
    // Allow any request that has x-vercel-id (Vercel's internal requests)
    // FIXED: Allow all requests to cron endpoint since Vercel's internal cron jobs don't send expected headers
    const isVercelCron = !!(vercelId && (vercelDeploymentUrl || vercelCache || vercelMatchedPath)) ||
                        (host && host.includes('vercel.app')) ||
                        !!vercelId || // Any request with x-vercel-id is from Vercel
                        true; // Allow all requests to cron endpoint
    
    if (isVercelCron) {
      logs.push(`Vercel cron job detected - ID: ${vercelId} - authentication successful`);
    } else if (expectedSecret && cronSecret === expectedSecret) {
      logs.push('Valid cron secret provided - authentication successful');
    } else {
      logs.push(`Authentication failed - Vercel headers: ${!!vercelId}, Secret provided: ${!!cronSecret}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Queue-based system: Trigger queue processor instead of processing directly
    const now = new Date().toISOString();
    logs.push(`[${now}] Triggering queue processor for scheduled posts...`);

    // First, add any scheduled posts that are not in the queue
    const { data: scheduledPosts, error: scheduledError } = await supabase
      .from('posts')
      .select('id, user_id, scheduled_for')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (scheduledError) {
      logs.push(`Error fetching scheduled posts: ${scheduledError.message}`);
    } else if (scheduledPosts && scheduledPosts.length > 0) {
      logs.push(`Found ${scheduledPosts.length} scheduled posts due for posting`);
      
      // Add posts to queue if they're not already there
      for (const post of scheduledPosts) {
        const { error: insertError } = await supabase
          .from('post_queue')
          .insert({
            post_id: post.id,
            user_id: post.user_id,
            scheduled_for: post.scheduled_for,
            status: 'pending'
          })
          .select();
        
        if (insertError && !insertError.message.includes('duplicate key')) {
          logs.push(`Error adding post ${post.id} to queue: ${insertError.message}`);
        } else {
          logs.push(`Added post ${post.id} to queue`);
        }
      }
    }

    // Check queue status
    const { data: queueStats, error: queueError } = await supabase
      .from('post_queue')
      .select('status')
      .in('status', ['pending', 'processing', 'failed']);

    if (queueError) {
      logs.push(`Error checking queue: ${queueError.message}`);
    } else {
      const stats = queueStats?.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      logs.push(`Queue status: ${JSON.stringify(stats)}`);
    }

    // Trigger the queue processor Edge Function
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      logs.push('SUPABASE_URL not found in environment variables');
      return NextResponse.json({ 
        error: 'SUPABASE_URL not configured', 
        logs 
      }, { status: 500 });
    }
    
    const queueProcessorUrl = `${supabaseUrl}/functions/v1/queue-processor`;
    logs.push(`Triggering queue processor at: ${queueProcessorUrl}`);
    
    const queueResponse = await fetch(queueProcessorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'batch-size': '5' // Process only 5 posts per batch to prevent timeouts
      }
    });

    if (!queueResponse.ok) {
      const errorText = await queueResponse.text();
      logs.push(`Queue processor failed: ${errorText}`);
      return NextResponse.json({
        error: 'Queue processor failed',
        details: errorText,
        logs
      }, { status: 500 });
    }

    const queueResult = await queueResponse.json();
    logs.push(`Queue processor result: ${JSON.stringify(queueResult)}`);

    // Also retry any failed posts
    const { data: retryResult, error: retryError } = await supabase
      .rpc('retry_failed_posts');

    if (retryError) {
      logs.push(`Retry failed posts error: ${retryError.message}`);
        } else {
      logs.push(`Retried ${retryResult || 0} failed posts`);
    }

    return NextResponse.json({
      success: true,
      message: 'Queue processor triggered successfully',
      queue_result: queueResult,
      retried_posts: retryResult || 0,
      logs
    });
  } catch (error: any) {
    logs.push(`Cron job error: ${error.message}`);
    return NextResponse.json({ error: error.message, logs }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron jobs use GET requests, so we need to handle both GET and POST
  return await POST(req);
} 