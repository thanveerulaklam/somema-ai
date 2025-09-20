import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostQueueItem {
  queue_id: string
  post_id: string
  user_id: string
  scheduled_for: string
}

interface PostData {
  id: string
  user_id: string
  caption: string
  hashtags: string[]
  platform: string
  media_url: string
  page_id: string
}

interface UserProfile {
  meta_credentials: any
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Queue processor started')

    // Get next batch of posts to process (default 10, max 20)
    const batchSize = Math.min(parseInt(req.headers.get('batch-size') || '10'), 20)
    
    const { data: queueItems, error: queueError } = await supabaseClient
      .rpc('get_next_posts_to_process', { batch_size: batchSize })

    if (queueError) {
      console.error('❌ Error fetching queue items:', queueError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch queue items', details: queueError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ No posts to process')
      return new Response(
        JSON.stringify({ success: true, message: 'No posts to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Processing ${queueItems.length} posts from queue`)

    const results = []
    const startTime = Date.now()

    // Process each post in the queue
    for (const queueItem of queueItems as PostQueueItem[]) {
      const postStartTime = Date.now()
      
      try {
        console.log(`🔄 Processing queue item: ${queueItem.queue_id}`)

        // Mark as processing
        await supabaseClient.rpc('update_queue_status', {
          queue_id: queueItem.queue_id,
          new_status: 'processing'
        })

        // Fetch post details
        const { data: post, error: postError } = await supabaseClient
          .from('posts')
          .select('*')
          .eq('id', queueItem.post_id)
          .single()

        if (postError || !post) {
          throw new Error(`Post not found: ${postError?.message}`)
        }

        // Fetch user profile and credentials
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .select('meta_credentials')
          .eq('user_id', post.user_id)
          .single()

        if (profileError || !userProfile?.meta_credentials) {
          throw new Error('User profile or Meta credentials not found')
        }

        // Process the post (simplified version - you'll need to add your Meta API logic here)
        const processingResult = await processPost(post, userProfile.meta_credentials)

        if (processingResult.success) {
          // Mark as completed
          await supabaseClient.rpc('update_queue_status', {
            queue_id: queueItem.queue_id,
            new_status: 'completed',
            processing_time_ms: Date.now() - postStartTime
          })

          // Update post status in posts table
          await supabaseClient
            .from('posts')
            .update({
              status: 'published',
              meta_post_id: processingResult.postId,
              posted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id)

          console.log(`✅ Post ${post.id} processed successfully`)
          results.push({ queue_id: queueItem.queue_id, status: 'completed', post_id: post.id })
        } else {
          throw new Error(processingResult.error || 'Unknown processing error')
        }

      } catch (error) {
        console.error(`❌ Error processing queue item ${queueItem.queue_id}:`, error)

        // Mark as failed
        await supabaseClient.rpc('update_queue_status', {
          queue_id: queueItem.queue_id,
          new_status: 'failed',
          error_message: error.message,
          processing_time_ms: Date.now() - postStartTime
        })

        results.push({ 
          queue_id: queueItem.queue_id, 
          status: 'failed', 
          error: error.message 
        })
      }
    }

    const totalTime = Date.now() - startTime
    console.log(`🏁 Queue processing completed in ${totalTime}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
        processing_time_ms: totalTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Queue processor error:', error)
    return new Response(
      JSON.stringify({ error: 'Queue processor failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Simplified post processing function
// You'll need to implement your actual Meta API logic here
async function processPost(post: PostData, credentials: any): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // This is a placeholder - implement your actual Meta API posting logic
    // For now, we'll simulate a successful post
    console.log(`📝 Processing post: ${post.caption?.substring(0, 50)}...`)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate success (replace with actual Meta API call)
    const mockPostId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return { success: true, postId: mockPostId }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
