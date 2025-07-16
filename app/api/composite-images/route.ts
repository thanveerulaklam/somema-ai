import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// Use service role key if available, otherwise fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey!
)

export async function POST(request: NextRequest) {
  try {
    const { productImageUrl, backgroundImageUrl, businessName } = await request.json()

    if (!productImageUrl || !backgroundImageUrl || !businessName) {
      return NextResponse.json(
        { error: 'Missing productImageUrl, backgroundImageUrl, or businessName' },
        { status: 400 }
      )
    }

    console.log('Compositing images...')
    console.log('Product image:', productImageUrl.substring(0, 100) + '...')
    console.log('Background image:', backgroundImageUrl.substring(0, 100) + '...')

    // Helper function to get image buffer from URL
    const getImageBuffer = async (url: string, imageName: string): Promise<Buffer> => {
      if (url.startsWith('data:image/')) {
        // Extract base64 from data URL
        const base64Match = url.match(/data:image\/[^;]+;base64,(.+)/)
        if (!base64Match) {
          throw new Error(`Invalid data URL format for ${imageName}`)
        }
        const base64 = base64Match[1]
        return Buffer.from(base64, 'base64')
      } else if (url.startsWith('blob:')) {
        // Blob URLs should not reach here since we convert them on client side
        console.error(`Blob URL received on server side for ${imageName} - this should not happen`)
        throw new Error(`Invalid image URL format for ${imageName}. Please try uploading the image again.`)
      } else {
        // Download the image
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to download ${imageName}: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }
    }

    // Download the background image
    const backgroundBuffer = await getImageBuffer(backgroundImageUrl, 'background image')
    
    // Download the product image (background removed)
    const productBuffer = await getImageBuffer(productImageUrl, 'product image')

    // Use Sharp to composite the images
    console.log('Compositing images with Sharp...')
    
    // Get metadata of both images to calculate optimal positioning
    const backgroundMetadata = await sharp(Buffer.from(backgroundBuffer)).metadata()
    const productMetadata = await sharp(Buffer.from(productBuffer)).metadata()
    
    console.log('Background metadata:', { 
      width: backgroundMetadata.width, 
      height: backgroundMetadata.height,
      format: backgroundMetadata.format,
      channels: backgroundMetadata.channels
    })
    console.log('Product metadata:', { 
      width: productMetadata.width, 
      height: productMetadata.height,
      format: productMetadata.format,
      channels: productMetadata.channels,
      hasAlpha: productMetadata.hasAlpha
    })
    
    // Calculate optimal positioning for the product
    const backgroundSize = 1024
    
    // Ensure the product fits within the background and is visible
    let productWidth = productMetadata.width || 512
    let productHeight = productMetadata.height || 512
    
    // Calculate the maximum size the product can be while fitting in the background
    const maxProductSize = Math.min(backgroundSize * 0.8, backgroundSize * 0.8) // 80% of background size
    
    // If product is too large, scale it down to fit
    if (productWidth > maxProductSize || productHeight > maxProductSize) {
      const scale = Math.min(maxProductSize / productWidth, maxProductSize / productHeight)
      productWidth = Math.floor(productWidth * scale)
      productHeight = Math.floor(productHeight * scale)
      console.log('Scaling down product to fit background:', { scale, newWidth: productWidth, newHeight: productHeight })
    }
    
    // If product is too small, scale it up (but not beyond max size)
    const minProductSize = 300
    if (productWidth < minProductSize || productHeight < minProductSize) {
      const scale = Math.min(
        Math.max(minProductSize / productWidth, minProductSize / productHeight),
        maxProductSize / Math.max(productWidth, productHeight)
      )
      productWidth = Math.floor(productWidth * scale)
      productHeight = Math.floor(productHeight * scale)
      console.log('Scaling up product for better visibility:', { scale, newWidth: productWidth, newHeight: productHeight })
    }
    
    // Center the product on the background
    const left = Math.max(0, Math.floor((backgroundSize - productWidth) / 2))
    const top = Math.max(0, Math.floor((backgroundSize - productHeight) / 2))
    
    console.log('Product positioning:', { left, top, width: productWidth, height: productHeight })
    
    // Create the composite image
    console.log('Starting composition with positioning:', { top, left, productWidth, productHeight })
    
    // Resize the product image if needed
    let productInput: Buffer
    if (productWidth !== productMetadata.width || productHeight !== productMetadata.height) {
      console.log('Resizing product image to:', { width: productWidth, height: productHeight })
      productInput = await sharp(Buffer.from(productBuffer))
        .resize(productWidth, productHeight, { fit: 'inside', withoutEnlargement: false })
        .png()
        .toBuffer()
    } else {
      productInput = Buffer.from(productBuffer)
    }
    
    // Try the composition with better error handling
    let compositeBuffer: Buffer
    try {
      compositeBuffer = await sharp(Buffer.from(backgroundBuffer))
        .resize(backgroundSize, backgroundSize, { fit: 'cover' }) // Resize background to standard size
        .composite([
          {
            input: productInput,
            top: top,
            left: left,
            blend: 'over' // Standard alpha blending
          }
        ])
        .png()
        .toBuffer()
    } catch (compositionError) {
      console.error('Composition failed, trying alternative approach:', compositionError)
      
      // Fallback: resize product to fit and overlay
      console.log('Using fallback composition with resized product')
      const fallbackProductBuffer = await sharp(Buffer.from(productBuffer))
        .resize(Math.min(600, productMetadata.width || 600), Math.min(600, productMetadata.height || 600), { 
          fit: 'inside', 
          withoutEnlargement: false 
        })
        .png()
        .toBuffer()
      
      compositeBuffer = await sharp(Buffer.from(backgroundBuffer))
        .resize(backgroundSize, backgroundSize, { fit: 'cover' })
        .composite([
          {
            input: fallbackProductBuffer,
            top: 200,
            left: 200,
            blend: 'over'
          }
        ])
        .png()
        .toBuffer()
    }
    
    console.log('Composition completed, buffer size:', compositeBuffer.length)
    
    // For debugging, let's also create a simple test to verify the product image has transparency
    try {
      const testProductBuffer = await sharp(Buffer.from(productBuffer))
        .png()
        .toBuffer()
      console.log('Product image processed successfully, size:', testProductBuffer.length)
    } catch (error) {
      console.error('Error processing product image:', error)
    }
    
    console.log('Composite created successfully')
    
    // Create a unique filename for the composite
    const timestamp = Date.now()
    const fileName = `composite-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.png`
    const filePath = `composites/${fileName}`
    
    console.log('Uploading composite to Supabase path:', filePath)
    
    // Upload the composite image
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, new Blob([compositeBuffer], { type: 'image/png' }), {
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      throw new Error(`Failed to upload composite: ${uploadError.message}`)
    }
    
    console.log('Composite uploaded successfully')
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)
    
    console.log('Composite URL:', publicUrl)
    
    return NextResponse.json({
      success: true,
      compositeUrl: publicUrl
    })

  } catch (error: any) {
    console.error('Image composition error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to composite images' },
      { status: 500 }
    )
  }
} 