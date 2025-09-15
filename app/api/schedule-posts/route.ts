import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/supabase'
import { cookies } from 'next/headers'
import { analyzeImageWithCLIP, generateContentFromAnalyzedImage } from '../../../lib/ai-services'
import { shouldBypassCredits } from '../../../lib/admin-utils'

async function generateCaption(context: any, authHeader: string) {
  const res = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/generate-content`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      type: 'caption',
      request: context
    })
  });
  if (!res.ok) {
    const errorData = await res.json();
    // Pass through credit-related errors with their original message
    if (res.status === 402) {
      throw new Error(errorData.error || 'No post generation credits remaining. Please upgrade your plan or purchase more credits.');
    }
    throw new Error('Failed to generate caption');
  }
  const data = await res.json();
  return data.result || data.success || '';
}

async function generateHashtags(context: any, authHeader: string) {
  const res = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/generate-content`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      type: 'hashtags',
      request: context
    })
  });
  if (!res.ok) {
    const errorData = await res.json();
    // Pass through credit-related errors with their original message
    if (res.status === 402) {
      throw new Error(errorData.error || 'No post generation credits remaining. Please upgrade your plan or purchase more credits.');
    }
    throw new Error('Failed to generate hashtags');
  }
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
    .from('user_profiles')
    .select('business_name, industry, brand_tone, target_audience, post_generation_credits')
    .eq('user_id', userId)
    .single();
  if (profileError || !profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Check if user is admin (bypass credits)
  const bypassCredits = await shouldBypassCredits(userId);

  // Check user's post generation credits
  const currentCredits = profile?.post_generation_credits || 0;
  const postsToGenerate = images.length;
  
  if (!bypassCredits && currentCredits < postsToGenerate) {
    return NextResponse.json({ 
      error: `Insufficient post generation credits. You need ${postsToGenerate} credits but only have ${currentCredits} remaining. Please upgrade your plan or purchase more credits.`,
      creditsRemaining: currentCredits,
      creditsNeeded: postsToGenerate
    }, { status: 402 });
  }

  if (bypassCredits) {
    console.log('👑 Admin user - bypassing credit check for post scheduling');
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
      tone: profile.brand_tone,
      targetAudience: profile.target_audience,
      niche: profile.industry,
      imageUrl: media_url
    };
    try {
      // 1. Analyze the image
      imageAnalysis = await analyzeImageWithCLIP(media_url, authHeader);
      // 2. Generate content using both image and business context
      const aiResult = await generateContentFromAnalyzedImage(imageAnalysis, businessContext);
      caption = aiResult.caption;
      // Extract hashtags from the caption text
      hashtags = (caption.match(/#\w+/g) || []).map(tag => tag.substring(1));
    } catch (e: any) {
      // Fallback to individual generation if the combined approach fails
      try {
        caption = await generateCaption(businessContext, authHeader);
        hashtags = await generateHashtags(businessContext, authHeader);
      } catch (fallbackError: any) {
        caption = 'Generated caption';
        hashtags = [];
        captionError = fallbackError.message || fallbackError.toString();
        hashtagsError = fallbackError.message || fallbackError.toString();
        console.error('Content generation error:', captionError);
      }
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