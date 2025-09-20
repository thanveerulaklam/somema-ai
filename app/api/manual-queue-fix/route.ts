import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Find all scheduled posts that are not in the queue
    const { data: scheduledPosts, error } = await supabase
      .from('posts')
      .select('id, user_id, scheduled_for, caption')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({ message: 'No scheduled posts found' });
    }

    const results = [];
    
    // Add each scheduled post to the queue
    for (const post of scheduledPosts) {
      const { error: insertError } = await supabase
        .from('post_queue')
        .insert({
          post_id: post.id,
          user_id: post.user_id,
          scheduled_for: post.scheduled_for,
          status: 'pending'
        });

      if (insertError && !insertError.message.includes('duplicate key')) {
        results.push({ post_id: post.id, error: insertError.message });
      } else {
        results.push({ post_id: post.id, status: 'added to queue' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledPosts.length} scheduled posts`,
      results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
