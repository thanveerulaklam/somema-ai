import { NextRequest, NextResponse } from 'next/server'
import { generateInstagramContentFromCLIP } from '../../../lib/ai-services'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { imageSelections, userProfile, platform, contentStrategy } = await request.json()

    if (!imageSelections || !userProfile) {
      return NextResponse.json(
        { error: 'Missing required parameters: imageSelections and userProfile' },
        { status: 400 }
      )
    }

    console.log('Generating monthly content with:', {
      imageSelections: Object.keys(imageSelections).length,
      userProfile: userProfile.business_name,
      platform,
      contentStrategy
    })

    const generatedPosts = []

    for (const [dateKey, selectedImages] of Object.entries(imageSelections)) {
      if (!selectedImages || !Array.isArray(selectedImages) || selectedImages.length === 0) continue

      try {
        // Step 1: Analyze all images for the day (carousel)
        const baseUrl = request.headers.get('origin') || 'http://localhost:3000'
        const analyses: any[] = []
        for (const img of selectedImages) {
          const analysisResponse = await fetch(`${baseUrl}/api/analyze-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: img.file_path })
          })
          if (!analysisResponse.ok) throw new Error('Failed to analyze image')
          const analysisData = await analysisResponse.json()
          analyses.push(analysisData.analysis)
        }

        // Aggregate analyses for carousel
        const allCaptions = analyses.map(a => a.caption).join(' | ')
        const allTags = Array.from(new Set(analyses.flatMap(a => a.tags)))
        const classificationCounts: Record<string, number> = analyses.reduce((acc, a) => {
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
        const dayIndex = Object.keys(imageSelections).indexOf(dateKey)
        const scheduledDate = new Date()
        scheduledDate.setDate(scheduledDate.getDate() + dayIndex + 1)
        scheduledDate.setHours(9, 0, 0, 0)

        generatedPosts.push({
          dateKey,
          theme: aggregatedAnalysis.classification,
          caption: generatedContent.caption,
          hashtags: generatedContent.hashtags,
          imagePrompt: aggregatedAnalysis.caption,
          selectedImages: selectedImages,
          mediaUrls: selectedImages.map((img: any) => img.file_path),
          scheduledFor: scheduledDate.toISOString()
        })
      } catch (error) {
        console.error(`Error generating content for ${dateKey}:`, error)
        
        // Fallback content
        const dayIndex = Object.keys(imageSelections).indexOf(dateKey)
        const scheduledDate = new Date()
        scheduledDate.setDate(scheduledDate.getDate() + dayIndex + 1)
        scheduledDate.setHours(9, 0, 0, 0)
        
        generatedPosts.push({
          dateKey,
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

    // Log one generation event per generated post
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const userId = authHeader.replace('Bearer ', '')
        const logs = generatedPosts.map(() => ({ user_id: userId, type: 'monthly' }))
        if (logs.length > 0) {
          await supabase.from('generation_logs').insert(logs)
        }
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