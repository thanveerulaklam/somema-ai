import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key if available, otherwise fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, businessName } = await request.json()
    
    if (!imageUrl || !businessName) {
      return NextResponse.json(
        { error: 'Missing imageUrl or businessName' },
        { status: 400 }
      )
    }

    console.log('Downloading image from:', imageUrl)
    console.log('Business name:', businessName)

    // Handle different types of image URLs
    let imageBuffer: ArrayBuffer | Buffer
    
    if (imageUrl.startsWith('data:image/')) {
      // Extract base64 from data URL
      const base64Match = imageUrl.match(/data:image\/[^;]+;base64,(.+)/)
      if (!base64Match) {
        throw new Error('Invalid data URL format')
      }
      const base64 = base64Match[1]
      imageBuffer = Buffer.from(base64, 'base64')
    } else if (imageUrl.startsWith('blob:')) {
      // Blob URLs should not reach here since we convert them on client side
      console.error('Blob URL received on server side - this should not happen')
      throw new Error('Invalid image URL format. Please try uploading the image again.')
    } else {
    // Download the image server-side (no CORS issues)
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }
    
      imageBuffer = await response.arrayBuffer()
    }
    
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
    
    console.log('Image downloaded successfully, size:', imageBlob.size)
    
    // Create a unique filename
    const timestamp = Date.now()
    const fileName = `dalle-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.png`
    const filePath = `generated-images/${fileName}`
    
    console.log('Uploading to Supabase path:', filePath)
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }
    
    console.log('Image uploaded successfully')
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)
    
    console.log('Public URL generated:', publicUrl)
    
    return NextResponse.json({ 
      success: true, 
      publicUrl,
      message: 'Image stored permanently'
    })
    
  } catch (error) {
    console.error('Error in download-image API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to download and store image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 