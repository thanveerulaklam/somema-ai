import { NextRequest, NextResponse } from 'next/server'
import { generateInstagramContentFromCLIP } from '../../../lib/ai-services'

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