import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    // Check if it's a multipart form data (file upload) or JSON (URL)
    const contentType = request.headers.get('content-type') || ''
    
    let imageBuffer: ArrayBuffer
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      
      console.log('🔄 Converting uploaded HEIC file:', file.name)
      imageBuffer = await file.arrayBuffer()
    } else {
      // Handle URL
      const { imageUrl } = await request.json()
      
      if (!imageUrl) {
        return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
      }
      
      console.log('🔄 Converting HEIC image URL:', imageUrl)
      
      // Download the HEIC image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      imageBuffer = await response.arrayBuffer()
    }
    
    console.log('📄 Image buffer size:', imageBuffer.byteLength, 'bytes')

    // Convert HEIC to JPEG using Sharp
    const jpegBuffer = await sharp(Buffer.from(imageBuffer))
      .jpeg({ quality: 90 })
      .toBuffer()

    console.log('✅ JPEG conversion successful, size:', jpegBuffer.length, 'bytes')

    // Convert to base64 data URL
    const base64 = jpegBuffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    return NextResponse.json({ 
      success: true, 
      dataUrl,
      message: 'HEIC converted to JPEG successfully'
    })

  } catch (error) {
    console.error('❌ HEIC conversion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to convert HEIC image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 