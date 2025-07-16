import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { createMetaAPIService, PostContent } from '../../../../lib/meta-api';

export async function POST(req: NextRequest) {
  const logs: string[] = [];
  try {
    // Find all scheduled posts due for posting
    const now = new Date().toISOString();
    logs.push(`[${now}] Checking for scheduled posts due for posting...`);
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_time', now);

    if (error) {
      logs.push(`Error fetching posts: ${error.message}`);
      return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
    if (!posts || posts.length === 0) {
      logs.push('No posts to process.');
      return NextResponse.json({ success: true, message: 'No posts to process.', logs });
    }
    logs.push(`Found ${posts.length} scheduled post(s) to process.`);

    const results = [];
    for (const post of posts) {
      try {
        logs.push(`\nProcessing post ID: ${post.id}`);
        // 1. Fetch user Meta credentials
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('meta_credentials')
          .eq('user_id', post.user_id)
          .single();
        if (profileError || !userProfile?.meta_credentials) {
          logs.push(`Meta credentials not found for user ${post.user_id}`);
          throw new Error('Meta credentials not found for user.');
        }
        const credentials = userProfile.meta_credentials;
        logs.push(`Fetched Meta credentials for user ${post.user_id}`);
        // 2. Find the correct page (assume post has page_id or use first page)
        let selectedPage = credentials.pages?.[0];
        if (post.page_id && credentials.pages) {
          selectedPage = credentials.pages.find((p: any) => p.id === post.page_id) || selectedPage;
        }
        if (!selectedPage) {
          logs.push('No Facebook page found in Meta credentials.');
          throw new Error('No Facebook page found in Meta credentials.');
        }
        logs.push(`Using Facebook page: ${selectedPage.id} (${selectedPage.name || ''})`);
        const instagramAccountId = selectedPage.instagram_accounts?.[0]?.id;
        if (instagramAccountId) {
          logs.push(`Using Instagram account: ${instagramAccountId}`);
        } else {
          logs.push('No Instagram account found for this page.');
        }
        // 3. Create Meta API service
        const metaService = createMetaAPIService({
          accessToken: credentials.accessToken,
          pageId: selectedPage.id,
          instagramBusinessAccountId: instagramAccountId
        });
        // 4. Prepare post content
        const postContent: PostContent = {
          caption: post.caption,
          hashtags: post.hashtags || [],
          mediaUrl: post.media_url,
          scheduledTime: post.scheduled_time,
          platform: post.platform || 'facebook',
        };
        logs.push(`Prepared post content: ${JSON.stringify(postContent)}`);
        // 5. Post to Meta
        let result;
        switch (postContent.platform) {
          case 'facebook':
            logs.push('Posting to Facebook...');
            result = await metaService.postToFacebook(postContent);
            logs.push(`Facebook post result: ${JSON.stringify(result)}`);
            break;
          case 'instagram':
            if (!instagramAccountId) {
              result = { success: false, error: 'No Instagram business account connected to this page.' };
              logs.push(result.error);
            } else {
              logs.push('Posting to Instagram...');
              result = await metaService.postToInstagram(postContent);
              logs.push(`Instagram post result: ${JSON.stringify(result)}`);
            }
            break;
          case 'both':
            logs.push('Posting to both Facebook and Instagram...');
            const facebookResult = await metaService.postToFacebook(postContent);
            logs.push(`Facebook post result: ${JSON.stringify(facebookResult)}`);
            let instagramResult;
            if (!instagramAccountId) {
              instagramResult = { success: false, error: 'No Instagram business account connected to this page.' };
              logs.push(instagramResult.error);
            } else {
              instagramResult = await metaService.postToInstagram(postContent);
              logs.push(`Instagram post result: ${JSON.stringify(instagramResult)}`);
            }
            result = { facebook: facebookResult, instagram: instagramResult };
            break;
          default:
            result = { success: false, error: 'Invalid platform.' };
            logs.push(result.error);
        }
        // 6. Update post status
        let updateData: any = { updated_at: new Date().toISOString() };
        if (postContent.platform === 'both') {
          const bothResult = result as { facebook: any; instagram: any };
          const facebookSuccess = bothResult.facebook.success;
          const instagramSuccess = bothResult.instagram.success;
          updateData.status = (facebookSuccess && instagramSuccess) ? 'posted' : 'failed';
          updateData.meta_post_ids = {
            facebook: bothResult.facebook.postId,
            instagram: bothResult.instagram.postId
          };
          if (!facebookSuccess || !instagramSuccess) {
            updateData.meta_errors = {
              facebook: bothResult.facebook.error,
              instagram: bothResult.instagram.error
            };
          }
        } else {
          const singleResult = result as any;
          updateData.status = singleResult.success ? 'posted' : 'failed';
          if (singleResult.success) {
            updateData.meta_post_id = singleResult.postId;
            updateData.posted_at = new Date().toISOString();
          } else {
            updateData.meta_error = singleResult.error;
          }
        }
        await supabase
          .from('posts')
          .update(updateData)
          .eq('id', post.id);
        logs.push(`Updated post status in DB: ${JSON.stringify(updateData)}`);
        results.push({ id: post.id, ...updateData });
      } catch (err: any) {
        await supabase
          .from('posts')
          .update({ status: 'failed', meta_error: err.message || 'Unknown error', updated_at: new Date().toISOString() })
          .eq('id', post.id);
        logs.push(`Error processing post ID ${post.id}: ${err.message}`);
        results.push({ id: post.id, success: false, error: err.message });
      }
    }
    logs.push('All posts processed.');
    return NextResponse.json({ success: true, processed: results, logs });
  } catch (err: any) {
    logs.push(`Fatal error: ${err.message}`);
    return NextResponse.json({ error: err.message || 'Unknown error', logs }, { status: 500 });
  }
} 