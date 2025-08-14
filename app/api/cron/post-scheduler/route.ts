import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createMetaAPIService, PostContent } from '../../../../lib/meta-api';
import { createInstagramAPIService } from '../../../../lib/instagram-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const logs: string[] = [];
  try {
    // Find all scheduled posts due for posting
    const now = new Date().toISOString();
    logs.push(`[${now}] Checking for scheduled posts due for posting...`);
    // Log all scheduled posts for debugging
    const { data: allScheduled, error: allScheduledError } = await supabase
      .from('posts')
      .select('id, scheduled_for, status')
      .eq('status', 'scheduled');
    logs.push('All scheduled posts: ' + JSON.stringify(allScheduled));
    logs.push('Current UTC time (now): ' + now);
    // Main query
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);
    logs.push('Posts due for posting: ' + JSON.stringify(posts));

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
        
        if (profileError) {
          logs.push(`Error fetching user profile: ${profileError.message}`);
          throw new Error(`Failed to fetch user profile: ${profileError.message}`);
        }
        
        if (!userProfile) {
          logs.push(`User profile not found for user ${post.user_id}`);
          throw new Error('User profile not found. Please complete your profile setup.');
        }
        
        if (!userProfile.meta_credentials || Object.keys(userProfile.meta_credentials).length === 0) {
          logs.push(`Meta credentials not found for user ${post.user_id}. User needs to connect Meta account.`);
          throw new Error('Meta account not connected. Please connect your Facebook/Instagram account in settings.');
        }
        
        const credentials = userProfile.meta_credentials;
        logs.push(`Fetched Meta credentials for user ${post.user_id}`);
        
        // 2. Find the correct page (assume post has page_id or use first page)
        if (!credentials.pages || credentials.pages.length === 0) {
          logs.push('No Facebook pages found in Meta credentials.');
          throw new Error('No Facebook pages connected. Please connect a Facebook page in settings.');
        }
        
        let selectedPage = credentials.pages[0];
        if (post.page_id && credentials.pages) {
          selectedPage = credentials.pages.find((p: any) => p.id === post.page_id) || selectedPage;
        }
        
        if (!selectedPage) {
          logs.push('No Facebook page found in Meta credentials.');
          throw new Error('No Facebook page found in Meta credentials.');
        }
        
        if (!selectedPage.access_token) {
          logs.push(`No access token found for page ${selectedPage.id}`);
          throw new Error('Page access token not found. Please reconnect your Facebook page.');
        }
        logs.push(`Using Facebook page: ${selectedPage.id} (${selectedPage.name || ''})`);
        
        // Get Instagram account ID
        const instagramAccountId = selectedPage.instagram_accounts?.[0]?.id;
        if (instagramAccountId) {
          logs.push(`Using Instagram account: ${instagramAccountId}`);
        } else {
          logs.push('No Instagram account found for this page.');
        }
        
        // 3. Create Meta API service (same as immediate posting)
        const metaService = createMetaAPIService({
          accessToken: credentials.accessToken, // Use user access token, not page token
          pageId: selectedPage.id,
          instagramBusinessAccountId: instagramAccountId
        });
        
        // 4. Prepare post content
        const postContent: PostContent = {
          caption: post.caption || '',
          hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
          mediaUrl: post.media_url || undefined,
          scheduledTime: post.scheduled_for,
          platform: post.platform || 'facebook',
        };
        logs.push(`Prepared post content: ${JSON.stringify(postContent)}`);
        
        // 5. Post to Meta (use same approach as immediate posting)
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
              logs.push('Posting to Instagram using same method as immediate posting...');
              
              // Use the same approach as immediate posting - use user access token
              const userAccessToken = credentials.accessToken;
              
              if (!userAccessToken) {
                result = { success: false, error: 'User access token not found' };
                logs.push(result.error);
              } else {
                const instagramService = createInstagramAPIService({
                  accessToken: userAccessToken, // Use user access token instead of page token
                  instagramBusinessAccountId: instagramAccountId
                });
                
                // Try scheduled posting first
                result = await instagramService.postToInstagram({
                  caption: postContent.caption || '',
                  hashtags: Array.isArray(postContent.hashtags) ? postContent.hashtags : [],
                  mediaUrl: postContent.mediaUrl || undefined,
                  scheduledTime: postContent.scheduledTime
                });
                logs.push(`Instagram scheduled post result: ${JSON.stringify(result)}`);
                
                // If scheduled posting fails with whitelist error, try immediate posting
                if (!result.success && result.error && result.error.includes('whitelist')) {
                  logs.push('Instagram scheduled posting failed with whitelist error, trying immediate posting...');
                  const immediateResult = await instagramService.postToInstagram({
                    caption: postContent.caption || '',
                    hashtags: Array.isArray(postContent.hashtags) ? postContent.hashtags : [],
                    mediaUrl: postContent.mediaUrl || undefined,
                    scheduledTime: undefined // Force immediate posting
                  });
                  logs.push(`Instagram immediate post result: ${JSON.stringify(immediateResult)}`);
                  
                  if (immediateResult.success) {
                    result = immediateResult; // Use the successful immediate result
                  } else {
                    result = { success: false, error: `Scheduled posting failed: ${result.error}. Immediate posting also failed: ${immediateResult.error}` };
                  }
                }
              }
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
              // Use the same approach as immediate posting - use user access token
              const userAccessToken = credentials.accessToken;
              
              if (!userAccessToken) {
                instagramResult = { success: false, error: 'User access token not found' };
                logs.push(instagramResult.error);
              } else {
                const instagramService = createInstagramAPIService({
                  accessToken: userAccessToken, // Use user access token instead of page token
                  instagramBusinessAccountId: instagramAccountId
                });
                
                // Try scheduled posting first
                instagramResult = await instagramService.postToInstagram({
                  caption: postContent.caption || '',
                  hashtags: Array.isArray(postContent.hashtags) ? postContent.hashtags : [],
                  mediaUrl: postContent.mediaUrl || undefined,
                  scheduledTime: postContent.scheduledTime
                });
                logs.push(`Instagram scheduled post result: ${JSON.stringify(instagramResult)}`);
                
                // If scheduled posting fails with whitelist error, try immediate posting
                if (!instagramResult.success && instagramResult.error && instagramResult.error.includes('whitelist')) {
                  logs.push('Instagram scheduled posting failed with whitelist error, trying immediate posting...');
                  const immediateResult = await instagramService.postToInstagram({
                    caption: postContent.caption || '',
                    hashtags: Array.isArray(postContent.hashtags) ? postContent.hashtags : [],
                    mediaUrl: postContent.mediaUrl || undefined,
                    scheduledTime: undefined // Force immediate posting
                  });
                  logs.push(`Instagram immediate post result: ${JSON.stringify(immediateResult)}`);
                  
                  if (immediateResult.success) {
                    instagramResult = immediateResult; // Use the successful immediate result
                  } else {
                    instagramResult = { success: false, error: `Scheduled posting failed: ${instagramResult.error}. Immediate posting also failed: ${immediateResult.error}` };
                  }
                }
              }
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
          updateData.status = (facebookSuccess && instagramSuccess) ? 'published' : 'failed';
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
          updateData.status = singleResult.success ? 'published' : 'failed';
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
  } catch (error: any) {
    logs.push(`Cron job error: ${error.message}`);
    return NextResponse.json({ error: error.message, logs }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Post scheduler cron job endpoint' });
} 