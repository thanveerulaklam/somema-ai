import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY
    
    if (!REMOVE_BG_API_KEY) {
      return NextResponse.json({ error: 'Remove.bg API key not configured' }, { status: 500 })
    }

    // Handle different types of image URLs
    let base64Image: string
    
    if (imageUrl.startsWith('data:image/')) {
      // Extract base64 from data URL
      const base64Match = imageUrl.match(/data:image\/[^;]+;base64,(.+)/)
      if (!base64Match) {
        return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 })
      }
      base64Image = base64Match[1]
    } else if (imageUrl.startsWith('blob:')) {
      // Blob URLs should not reach here since we convert them on client side
      console.error('Blob URL received on server side - this should not happen')
      return NextResponse.json({ 
        error: 'Invalid image URL format. Please try uploading the image again.' 
      }, { status: 400 })
    } else {
      // Download the image and convert to base64 (for media library URLs)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to download image' }, { status: 400 })
    }

    const imageBuffer = await imageResponse.arrayBuffer()
      base64Image = Buffer.from(imageBuffer).toString('base64')
    }

    // Call Remove.bg API
    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: base64Image,
        size: 'auto',
        format: 'png'
      })
    })

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text()
      console.error('Remove.bg API error:', errorText)
      return NextResponse.json({ error: 'Failed to remove background' }, { status: 500 })
    }

    const resultBuffer = await removeBgResponse.arrayBuffer()
    const base64Result = Buffer.from(resultBuffer).toString('base64')
    
    // Return the processed image as base64
    return NextResponse.json({ 
      success: true,
      imageData: `data:image/png;base64,${base64Result}`
    })

  } catch (error) {
    console.error('Background removal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 