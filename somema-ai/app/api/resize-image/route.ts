import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

// Instagram aspect ratio requirements
const INSTAGRAM_ASPECT_RATIO = {
  MIN: 0.8,  // 4:5 ratio
  MAX: 1.91  // 16:9 ratio
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, targetAspectRatio = 1.0 } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Could not fetch image' }, { status: 400 })
    }

    const imageBuffer = await response.arrayBuffer()
    
    // Get original image metadata
    const metadata = await sharp(Buffer.from(imageBuffer)).metadata()
    const { width: originalWidth, height: originalHeight } = metadata

    if (!originalWidth || !originalHeight) {
      return NextResponse.json({ error: 'Could not determine image dimensions' }, { status: 400 })
    }

    const originalAspectRatio = originalWidth / originalHeight
    console.log(`Original image: ${originalWidth}x${originalHeight} (aspect ratio: ${originalAspectRatio.toFixed(2)})`)

    // Check if image already meets Instagram requirements
    if (originalAspectRatio >= INSTAGRAM_ASPECT_RATIO.MIN && originalAspectRatio <= INSTAGRAM_ASPECT_RATIO.MAX) {
      return NextResponse.json({
        success: true,
        message: 'Image already meets Instagram requirements',
        originalDimensions: { width: originalWidth, height: originalHeight },
        aspectRatio: originalAspectRatio,
        resized: false
      })
    }

    // Calculate new dimensions to fit Instagram requirements
    let newWidth = originalWidth
    let newHeight = originalHeight

    if (originalAspectRatio < INSTAGRAM_ASPECT_RATIO.MIN) {
      // Image is too tall (aspect ratio too small), make it wider
      newWidth = Math.round(originalHeight * INSTAGRAM_ASPECT_RATIO.MIN)
    } else if (originalAspectRatio > INSTAGRAM_ASPECT_RATIO.MAX) {
      // Image is too wide (aspect ratio too large), make it taller
      newHeight = Math.round(originalWidth / INSTAGRAM_ASPECT_RATIO.MAX)
    }

    console.log(`Resizing to: ${newWidth}x${newHeight} (aspect ratio: ${(newWidth / newHeight).toFixed(2)})`)

    // Resize the image
    const resizedBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(newWidth, newHeight, {
        fit: 'fill',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    // Upload to Supabase Storage to get a public URL (required by Meta APIs)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const fileName = `instagram-resized-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const filePath = `media/resized/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, Buffer.from(resizedBuffer), {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(filePath)
    const resizedUrl = publicUrlData?.publicUrl

    return NextResponse.json({
      success: true,
      message: 'Image resized successfully',
      originalDimensions: { width: originalWidth, height: originalHeight },
      newDimensions: { width: newWidth, height: newHeight },
      originalAspectRatio: originalAspectRatio,
      newAspectRatio: newWidth / newHeight,
      resizedUrl,
      resized: true
    })

  } catch (error) {
    console.error('Error resizing image:', error)
    return NextResponse.json(
      { error: 'Failed to resize image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
