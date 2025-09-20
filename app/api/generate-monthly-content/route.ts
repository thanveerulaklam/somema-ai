import { NextRequest, NextResponse } from 'next/server'
import { generateInstagramContentFromCLIP } from '../../../lib/ai-services'
import { createClient } from '@supabase/supabase-js'
import { shouldBypassCredits, getAdminInfo } from '../../../lib/admin-utils'

export async function POST(request: NextRequest) {
  try {
    const { imageSelections, userProfile, platform } = await request.json()

    if (!imageSelections || !userProfile) {
      return NextResponse.json(
        { error: 'Missing required parameters: imageSelections and userProfile' },
        { status: 400 }
      )
    }

    // Get user ID from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const userId = authHeader.replace('Bearer ', '')
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 401 }
      )
    }

    // Check if user is admin (bypass credits)
    const bypassCredits = await shouldBypassCredits(userId)
    const adminInfo = await getAdminInfo(userId)
    
    console.log('🔐 Admin check result:', {
      userId,
      bypassCredits,
      adminInfo
    })

    // Check user's post generation credits
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    
    const { data: userData, error: userDataError } = await supabase
      .from('user_profiles')
      .select('post_generation_credits, subscription_plan')
      .eq('user_id', userId)
      .single()

    if (userDataError) {
      console.error('Error fetching user credits:', userDataError)
      return NextResponse.json({ error: 'Failed to check user credits' }, { status: 500 })
    }

    const currentCredits = userData?.post_generation_credits || 0
    const postsToGenerate = Object.keys(imageSelections).length
    
    if (!bypassCredits && currentCredits < postsToGenerate) {
      return NextResponse.json({ 
        error: `Insufficient post generation credits. You need ${postsToGenerate} credits but only have ${currentCredits} remaining. Please upgrade your plan or purchase more credits.`,
        creditsRemaining: currentCredits,
        creditsNeeded: postsToGenerate
      }, { status: 402 })
    }

    if (bypassCredits) {
      console.log('👑 Admin user - bypassing credit check for monthly content generation')
    }

    console.log('Generating monthly content with:', {
      imageSelections: Object.keys(imageSelections).length,
      userProfile: {
        business_name: userProfile.business_name,
        industry: userProfile.industry,
        brand_tone: userProfile.brand_tone,
        target_audience: userProfile.target_audience
      },
      platform,
      creditsRemaining: currentCredits
    })

    const generatedPosts = []

    for (const [dayKey, selectedImages] of Object.entries(imageSelections)) {
      if (!selectedImages || !Array.isArray(selectedImages) || selectedImages.length === 0) continue

      try {
        // Step 1: Analyze all media for the day (carousel)
        const baseUrl = request.headers.get('origin') || 'http://localhost:3000'
        const analyses: any[] = []
        for (const img of selectedImages) {
          if (img.mime_type && img.mime_type.startsWith('video/')) {
            // Use video analysis API for videos
            console.log(`🎥 Analyzing video: ${img.file_name}`)
            const formData = new FormData()
            // Download the video and append as Blob
            const res = await fetch(img.file_path)
            const blob = await res.blob()
            formData.append('file', new File([blob], img.file_name, { type: img.mime_type }))
            
            const videoResponse = await fetch(`${baseUrl}/api/analyze-video`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${userId}`
              },
              body: formData
            })
            if (!videoResponse.ok) throw new Error('Failed to analyze video')
            const videoData = await videoResponse.json()
            analyses.push(videoData.aggregated_analysis)
          } else {
            // Use image analysis API for images
            const analysisResponse = await fetch(`${baseUrl}/api/analyze-image`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userId}`
              },
              body: JSON.stringify({ imageUrl: img.file_path })
            })
            if (!analysisResponse.ok) throw new Error('Failed to analyze image')
            const analysisData = await analysisResponse.json()
            analyses.push(analysisData.analysis)
          }
        }

        // Aggregate analyses for carousel
        // - Concatenate captions
        // - Merge tags
        // - Pick most common classification
        const allCaptions = analyses.map(a => a.caption).join(' | ')
        const allTags = Array.from(new Set(analyses.flatMap(a => a.tags)))
        const classificationCounts = analyses.reduce((acc, a) => {
          acc[a.classification] = (acc[a.classification] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        const classificationEntries: [string, number][] = Object.entries(classificationCounts)
        const mostCommonClassification = classificationEntries.length > 0 ? classificationEntries.sort((a, b) => b[1] - a[1])[0][0] : 'Product'
        const avgConfidence = analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length

        const aggregatedAnalysis = {
          caption: allCaptions,
          classification: mostCommonClassification,
          tags: allTags,
          confidence: avgConfidence
        }

        // Step 2: Generate Instagram content based on aggregated analysis
        const businessProfile = {
          business_name: userProfile.business_name || 'Our Business',
          niche: userProfile.industry || 'General',
          tone: userProfile.brand_tone || 'Professional',
          audience: userProfile.target_audience || 'Our customers'
        }
        const generatedContent = await generateInstagramContentFromCLIP(aggregatedAnalysis, businessProfile)

        // Step 3: Create scheduled date for this post
        const dayIndex = Object.keys(imageSelections).indexOf(dayKey)
        const scheduledDate = new Date()
        scheduledDate.setDate(scheduledDate.getDate() + dayIndex + 1)
        scheduledDate.setHours(11, 0, 0, 0)

        generatedPosts.push({
          dayKey,
          theme: aggregatedAnalysis.classification,
          caption: generatedContent.caption,
          hashtags: generatedContent.hashtags,
          imagePrompt: aggregatedAnalysis.caption,
          selectedImages: selectedImages,
          mediaUrls: selectedImages.map((img: any) => img.file_path),
          scheduledFor: scheduledDate.toISOString()
        })
      } catch (error) {
        console.error(`Error generating content for ${dayKey}:`, error)
        
        // Fallback content
        const dayIndex = Object.keys(imageSelections).indexOf(dayKey)
        const scheduledDate = new Date()
        scheduledDate.setDate(scheduledDate.getDate() + dayIndex + 1)
        scheduledDate.setHours(11, 0, 0, 0)
        
        generatedPosts.push({
          dayKey,
          theme: 'Product Showcase',
          caption: `Check out this amazing product from ${userProfile.business_name || 'our business'}!`,
          hashtags: ['product', 'amazing', 'checkitout'],
          imagePrompt: 'Product showcase',
          selectedImages: selectedImages,
          mediaUrls: selectedImages.map((img: any) => img.file_path),
          scheduledFor: scheduledDate.toISOString()
        })
      }
    }

    console.log('Generated monthly content:', generatedPosts)

    // Decrement user's post generation credits and log generation events
    // Only deduct credits for successfully generated posts (not failed ones)
    const successfulPosts = generatedPosts.filter(post => 
      post.caption && 
      post.caption !== 'Check out this amazing product from Brand E!' && 
      post.hashtags && 
      post.hashtags.length > 0
    )
    
    try {
      const newCredits = currentCredits - successfulPosts.length
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ post_generation_credits: newCredits })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Failed to update user credits:', updateError)
        // Don't fail the request if credit update fails, but log it
      } else {
        console.log(`✅ Credits deducted: ${successfulPosts.length} (successful posts) out of ${generatedPosts.length} (total posts)`)
        console.log(`📊 Credits remaining: ${newCredits}`)
      }

      // Log one generation event per successful post
      const logs = successfulPosts.map(() => ({ user_id: userId, type: 'monthly' }))
      if (logs.length > 0) {
        await supabase.from('generation_logs').insert(logs)
      }
    } catch (logError) {
      console.error('Failed to log monthly generation:', logError)
    }

    return NextResponse.json({
      success: true,
      generatedPosts
    })

  } catch (error: any) {
    console.error('Error generating monthly content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate monthly content' },
      { status: 500 }
    )
  }
} 