import { NextRequest, NextResponse } from 'next/server'
import { generateInstagramContentFromCLIP } from '../../../lib/ai-services'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { imageAnalysis, businessProfile } = await request.json()

    if (!imageAnalysis || !businessProfile) {
      return NextResponse.json(
        { error: 'Missing required parameters: imageAnalysis and businessProfile' },
        { status: 400 }
      )
    }

    console.log('Generating Instagram content with:', {
      imageAnalysis,
      businessProfile
    })

    const result = await generateInstagramContentFromCLIP(imageAnalysis, businessProfile)

    console.log('Generated Instagram content:', result)

    // Log generation event
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const userId = authHeader.replace('Bearer ', '')
        await supabase.from('generation_logs').insert({ user_id: userId, type: 'single' })
      }
    } catch (logError) {
      console.error('Failed to log single generation:', logError)
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error: any) {
    console.error('Error generating Instagram content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate Instagram content' },
      { status: 500 }
    )
  }
} 