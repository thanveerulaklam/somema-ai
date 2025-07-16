import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { posts } = await req.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'No posts provided' }, { status: 400 });
    }

    // Get user's Supabase access token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header with access token required' }, { status: 401 });
    }
    const accessToken = authHeader.replace('Bearer ', '');
    const supabase = createServerClientWithAuth(accessToken);

    // Optionally, get user_id from session or post data
    // For now, expect user_id in each post or handle as needed
    const inserts = [];
    for (const post of posts) {
      const { media_url, caption, hashtags, scheduledDate, user_id, platform } = post;
      if (!media_url || !caption || !scheduledDate) {
        return NextResponse.json({ error: 'Missing required post fields' }, { status: 400 });
      }
      inserts.push({
        media_url,
        caption,
        hashtags,
        scheduled_for: scheduledDate,
        status: 'scheduled',
        user_id: user_id || null, // You may want to require this
        platform: platform || 'instagram',
        created_at: new Date().toISOString(),
      });
    }

    const { error } = await supabase.from('posts').insert(inserts);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 