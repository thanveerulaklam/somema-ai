import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/supabase'
import { cookies } from 'next/headers'
import { analyzeImageWithCLIP, generateContentFromAnalyzedImage } from '../../../lib/ai-services'

async function generateCaption(context: any) {
  const res = await fetch(`/api/generate-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'caption',
      request: context
    })
  });
  if (!res.ok) throw new Error('Failed to generate caption');
  const data = await res.json();
  return data.result || data.success || '';
}

async function generateHashtags(context: any) {
  const res = await fetch(`/api/generate-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'hashtags',
      request: context
    })
  });
  if (!res.ok) throw new Error('Failed to generate hashtags');
  const data = await res.json();
  return data.result || [];
}

export async function POST(req: NextRequest) {
  const { images, schedule_type, selected_days, imageDateMap, platform = 'instagram', theme = 'product', customPrompt } = await req.json();
  if (!images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 });
  }

  // Get user ID from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }
  const userId = authHeader.replace('Bearer ', '');

  // Fetch user profile context from Supabase
  const supabase = await getServerSupabase(cookies);
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('business_name, niche, tone, audience')
    .eq('id', userId)
    .single();
  if (profileError || !profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Generate previews with AI captions/hashtags and correct scheduled dates
  const previews = [];
  for (let i = 0; i < images.length; i++) {
    const media_url = images[i];
    let caption = '';
    let hashtags: string[] = [];
    let scheduledDate = new Date().toISOString();
    let captionError = null;
    let hashtagsError = null;
    let imageAnalysis = null;
    if (imageDateMap && imageDateMap[media_url]) {
      scheduledDate = imageDateMap[media_url];
    } else if (selected_days && selected_days[i]) {
      scheduledDate = selected_days[i];
    }
    // Build business context for AI
    const businessContext = {
      businessContext: profile.business_name,
      platform,
      theme,
      customPrompt,
      tone: profile.tone,
      targetAudience: profile.audience,
      niche: profile.niche,
      imageUrl: media_url
    };
    try {
      // 1. Analyze the image
      imageAnalysis = await analyzeImageWithCLIP(media_url);
      // 2. Generate content using both image and business context
      const aiResult = await generateContentFromAnalyzedImage(imageAnalysis, businessContext);
      caption = aiResult.caption;
      // Extract hashtags from the caption text
      hashtags = (caption.match(/#\w+/g) || []).map(tag => tag.substring(1));
    } catch (e: any) {
      caption = 'Generated caption';
      hashtags = [];
      captionError = e.message || e.toString();
      hashtagsError = e.message || e.toString();
      console.error('Content generation error:', captionError);
    }
    previews.push({
      media_url,
      caption,
      hashtags,
      scheduledDate,
      imageAnalysis,
      captionError,
      hashtagsError,
    });
  }
  return NextResponse.json({ previews });
} 