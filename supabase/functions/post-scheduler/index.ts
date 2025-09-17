// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

console.log("Hello from Functions!")

// Supabase Edge Function: Scheduled Post Worker
Deno.serve(async (req) => {
  const logs: string[] = [];
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const now = new Date().toISOString();
    logs.push(`[${now}] Checking for scheduled posts due for posting...`);
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (error) {
      logs.push(`Error fetching posts: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message, logs }), { status: 500 })
    }
    if (!posts || posts.length === 0) {
      logs.push('No posts to process.');
      return new Response(JSON.stringify({ success: true, message: 'No posts to process.', logs }), { status: 200 })
    }
    logs.push(`Found ${posts.length} scheduled post(s) to process.`);

    const results: any[] = [];
    for (const post of posts) {
      try {
        logs.push(`\nProcessing post ID: ${post.id}`);
        // Fetch user Meta credentials
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
        // Find the correct page (assume post has page_id or use first page)
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
        // Prepare post content
        const postContent = {
          caption: post.caption,
          hashtags: post.hashtags || [],
          mediaUrl: post.media_url,
          scheduledTime: post.scheduled_for,
          platform: post.platform || 'facebook',
        };
        logs.push(`Prepared post content: ${JSON.stringify(postContent)}`);
        // Post to Meta (call your own API endpoint or implement Meta API logic here)
        let result: any;
        try {
          const metaApiUrl = `${Deno.env.get('BASE_URL') || 'https://your-production-domain.com'}/api/meta/post`;
          const metaRes = await fetch(metaApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${post.user_id}`
            },
            body: JSON.stringify({
              caption: post.caption,
              hashtags: post.hashtags,
              mediaUrl: post.media_url,
              scheduledTime: post.scheduled_for,
              platform: post.platform,
              postId: post.id,
              selectedPageId: selectedPage.id
            })
          });
          result = await metaRes.json();
          logs.push(`Meta API post result: ${JSON.stringify(result)}`);
        } catch (err: any) {
          logs.push(`Meta API call failed: ${err.message}`);
          result = { success: false, error: err.message };
        }
        // Update post status
        let updateData: any = { updated_at: new Date().toISOString() };
        if (result.success) {
          updateData.status = 'posted';
          updateData.meta_post_id = result.result?.postId || null;
          updateData.published_at = new Date().toISOString();
        } else {
          updateData.status = 'failed';
          updateData.meta_error = result.error || 'Unknown error';
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
    return new Response(JSON.stringify({ success: true, processed: results, logs }), { status: 200 })
  } catch (err: any) {
    logs.push(`Fatal error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error', logs }), { status: 500 })
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/post-scheduler' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
