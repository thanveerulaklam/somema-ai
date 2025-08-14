import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const productDescription = formData.get('productDescription') as string

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Step 1: Optimize image - resize to max 1024px for better performance
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    
    const optimizedBuffer = await sharp(imageBuffer)
      .resize({ width: 1024, height: 1024, fit: 'inside' })
      .toFormat('jpeg', { quality: 90 })
      .toBuffer()
    
    const base64Image = optimizedBuffer.toString('base64')
    console.log(`Image optimized: ${imageBuffer.length} bytes → ${optimizedBuffer.length} bytes`)

    // Step 2: Detect product category
    const categoryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Classify into: fashion, tech, home, kids, premium goods.' },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Classify this product image into one category only.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 10,
        temperature: 0
      })
    })

    const categoryData = await categoryResponse.json()
    const category = categoryData.choices?.[0]?.message?.content?.trim().toLowerCase() || 'fashion'

    // Safer category normalization with fallback
    const normalizedCategory = ['fashion', 'tech', 'home', 'kids', 'premium goods']
      .find(c => category.includes(c)) || 'fashion'
    
    console.log(`Image enhancement: Category detected as "${category}", normalized to "${normalizedCategory}"`)

    const styleLibrary: Record<string, string> = {
      fashion: 'minimal, elegant runway-inspired background',
      tech: 'modern, sleek, high-tech setting with subtle gradients',
      home: 'cozy, well-lit indoor home setting with warm tones',
      kids: 'playful, colorful background with soft, child-friendly decor',
      'premium goods': 'luxurious, high-end setting with elegant decor and lighting'
    }
    const style = styleLibrary[normalizedCategory]

    // Step 3: Enhancement prompt
    const enhancementPrompt = `Create an Instagram-ready promotional image from the provided product photo, keeping the product's exact colors, textures, and proportions; if on a mannequin or stand, replace with a realistic, attractive model in the same pose; set it in a ${style} with professional lighting, natural shadows, vibrant clarity, and a trendy, eye-catching style.${productDescription ? ` Product details: ${productDescription}` : ''}`

    // Step 4: Image-to-image editing using /v1/images/edits with multipart/form-data
    const openaiFormData = new FormData()
    openaiFormData.append('model', 'gpt-image-1')
    openaiFormData.append('image', new Blob([optimizedBuffer], { type: 'image/jpeg' }), 'input.jpg')
    openaiFormData.append('prompt', enhancementPrompt)
    openaiFormData.append('size', '1024x1024')

    const imageResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: openaiFormData
    })

    if (!imageResponse.ok) {
      const err = await imageResponse.json()
      console.error(err)
      return NextResponse.json({ error: err.error?.message || 'OpenAI image generation failed' }, { status: 500 })
    }

    const imageData = await imageResponse.json()
    const enhancedImageBase64 = imageData.data?.[0]?.b64_json
    
    if (!enhancedImageBase64) {
      return NextResponse.json({ 
        error: 'No image data received from OpenAI API' 
      }, { status: 500 })
    }
    
    const enhancedImageUrl = `data:image/png;base64,${enhancedImageBase64}`

    return NextResponse.json({
      success: true,
      enhancedImageUrl,
      category: normalizedCategory
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 